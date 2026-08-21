import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/tenant/payments/[id]/receipt/route'
import { signToken } from '@/lib/jwt'
import { Payment } from '@/models/Payment'
import { generateReceiptPdf } from '@/lib/receipt-pdf'
import { signReceiptToken } from '@/lib/receipt-token'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Payment', () => ({ Payment: { findById: vi.fn() } }))
vi.mock('@/lib/receipt-pdf', () => ({ generateReceiptPdf: vi.fn() }))

const paidPayment = {
  _id: 'payment-1',
  tenantId: 'tenant-1',
  status: 'paid',
  tenantName: 'Jane Cooper',
  unitNumber: 'A-101',
  amount: 1200,
  date: '2026-08-01',
  method: 'gateway',
}

function bearerRequest(sub = 'tenant-1') {
  const token = signToken({ sub, role: 'tenant' })
  return new NextRequest('http://localhost/api/tenant/payments/payment-1/receipt', { headers: { authorization: `Bearer ${token}` } })
}

function tokenRequest(paymentId: string, sub = 'tenant-1') {
  const receiptToken = signReceiptToken(paymentId, sub)
  return new NextRequest(`http://localhost/api/tenant/payments/${paymentId}/receipt?token=${receiptToken}`)
}

describe('GET /tenant/payments/:id/receipt', () => {
  beforeEach(() => vi.clearAllMocks())

  it('accepts a normal Bearer token', async () => {
    vi.mocked(Payment.findById).mockResolvedValue(paidPayment as never)
    vi.mocked(generateReceiptPdf).mockResolvedValue(Buffer.from('%PDF-1.4'))

    const response = await GET(bearerRequest(), { params: Promise.resolve({ id: 'payment-1' }) })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
  })

  it('accepts a valid short-lived receipt query token', async () => {
    vi.mocked(Payment.findById).mockResolvedValue(paidPayment as never)
    vi.mocked(generateReceiptPdf).mockResolvedValue(Buffer.from('%PDF-1.4'))

    const response = await GET(tokenRequest('payment-1'), { params: Promise.resolve({ id: 'payment-1' }) })

    expect(response.status).toBe(200)
  })

  it('rejects an invalid/expired receipt token with 401', async () => {
    const request = new NextRequest('http://localhost/api/tenant/payments/payment-1/receipt?token=garbage')

    const response = await GET(request, { params: Promise.resolve({ id: 'payment-1' }) })

    expect(response.status).toBe(401)
  })

  it("returns 404 when the payment doesn't belong to the caller", async () => {
    vi.mocked(Payment.findById).mockResolvedValue({ ...paidPayment, tenantId: 'other-tenant' } as never)

    const response = await GET(bearerRequest('tenant-1'), { params: Promise.resolve({ id: 'payment-1' }) })

    expect(response.status).toBe(404)
  })

  it('returns 404 when the payment is not paid yet', async () => {
    vi.mocked(Payment.findById).mockResolvedValue({ ...paidPayment, status: 'pending' } as never)

    const response = await GET(bearerRequest(), { params: Promise.resolve({ id: 'payment-1' }) })

    expect(response.status).toBe(404)
    expect(generateReceiptPdf).not.toHaveBeenCalled()
  })

  it('returns 401 when there is neither a Bearer token nor a query token', async () => {
    const request = new NextRequest('http://localhost/api/tenant/payments/payment-1/receipt')
    const response = await GET(request, { params: Promise.resolve({ id: 'payment-1' }) })
    expect(response.status).toBe(401)
  })
})
