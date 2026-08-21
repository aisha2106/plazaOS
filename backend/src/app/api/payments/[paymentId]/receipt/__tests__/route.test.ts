import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/payments/[paymentId]/receipt/route'
import { signToken } from '@/lib/jwt'
import { Payment } from '@/models/Payment'
import { generateReceiptPdf } from '@/lib/receipt-pdf'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Payment', () => ({ Payment: { findById: vi.fn() } }))
vi.mock('@/lib/receipt-pdf', () => ({ generateReceiptPdf: vi.fn() }))

function adminRequest() {
  const token = signToken({ sub: 'admin-1', role: 'admin' })
  return new NextRequest('http://localhost/api/payments/payment-1/receipt', { headers: { authorization: `Bearer ${token}` } })
}

describe('GET /payments/:paymentId/receipt (admin)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 when the payment does not exist', async () => {
    vi.mocked(Payment.findById).mockResolvedValue(null as never)
    const response = await GET(adminRequest(), { params: Promise.resolve({ paymentId: 'payment-1' }) })
    expect(response.status).toBe(404)
  })

  it('returns 404 when the payment is not paid yet', async () => {
    vi.mocked(Payment.findById).mockResolvedValue({ _id: 'payment-1', status: 'pending' } as never)
    const response = await GET(adminRequest(), { params: Promise.resolve({ paymentId: 'payment-1' }) })
    expect(response.status).toBe(404)
    expect(generateReceiptPdf).not.toHaveBeenCalled()
  })

  it('returns a PDF when the payment is paid', async () => {
    vi.mocked(Payment.findById).mockResolvedValue({
      _id: 'payment-1',
      status: 'paid',
      tenantName: 'Jane Cooper',
      unitNumber: 'A-101',
      amount: 1200,
      date: '2026-08-01',
      method: 'cash',
    } as never)
    vi.mocked(generateReceiptPdf).mockResolvedValue(Buffer.from('%PDF-1.4'))

    const response = await GET(adminRequest(), { params: Promise.resolve({ paymentId: 'payment-1' }) })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
  })

  it('rejects a tenant-role token with 403', async () => {
    const token = signToken({ sub: 'tenant-1', role: 'tenant' })
    const response = await GET(
      new NextRequest('http://localhost/api/payments/payment-1/receipt', { headers: { authorization: `Bearer ${token}` } }),
      { params: Promise.resolve({ paymentId: 'payment-1' }) },
    )
    expect(response.status).toBe(403)
  })
})
