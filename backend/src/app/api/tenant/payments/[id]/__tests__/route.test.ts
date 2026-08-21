import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/tenant/payments/[id]/route'
import { signToken } from '@/lib/jwt'
import { Payment } from '@/models/Payment'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/lib/receipt-token', () => ({ buildReceiptUrl: vi.fn(() => 'http://localhost/receipt') }))
vi.mock('@/models/Payment', () => ({ Payment: { findById: vi.fn() } }))

const TENANT_A = '507f1f77bcf86cd799439011'
const TENANT_B = '507f1f77bcf86cd799439022'

function requestAs(tenantId: string) {
  const token = signToken({ sub: tenantId, role: 'tenant' })
  return new NextRequest('http://localhost/api/tenant/payments/payment-1', {
    headers: { authorization: `Bearer ${token}` },
  })
}

describe('GET /tenant/payments/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it("404s when the payment belongs to a different tenant", async () => {
    vi.mocked(Payment.findById).mockResolvedValue({ _id: 'payment-1', tenantId: TENANT_B, amount: 1200, status: 'paid' } as never)

    const response = await GET(requestAs(TENANT_A), { params: Promise.resolve({ id: 'payment-1' }) })

    expect(response.status).toBe(404)
  })

  it('returns the payment when it belongs to the authenticated tenant', async () => {
    vi.mocked(Payment.findById).mockResolvedValue({ _id: 'payment-1', tenantId: TENANT_A, amount: 1200, status: 'paid', date: '2026-07-01', method: 'gateway' } as never)

    const response = await GET(requestAs(TENANT_A), { params: Promise.resolve({ id: 'payment-1' }) })

    expect(response.status).toBe(200)
  })
})
