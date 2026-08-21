import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/tenant/payments/verify/route'
import { signToken } from '@/lib/jwt'
import { Payment } from '@/models/Payment'
import { verifyTransaction } from '@/lib/paystack'
import { settlePaymentByReference } from '@/lib/settle-payment'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Payment', () => ({ Payment: { findOne: vi.fn(), findById: vi.fn() } }))
vi.mock('@/lib/paystack', () => ({ verifyTransaction: vi.fn() }))
vi.mock('@/lib/settle-payment', () => ({ settlePaymentByReference: vi.fn() }))

function tenantRequest(url: string, sub = 'tenant-1') {
  const token = signToken({ sub, role: 'tenant' })
  return new NextRequest(url, { headers: { authorization: `Bearer ${token}` } })
}

describe('GET /tenant/payments/verify', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects a request with no reference with 400', async () => {
    const response = await GET(tenantRequest('http://localhost/api/tenant/payments/verify'), undefined as never)
    expect(response.status).toBe(400)
  })

  it("returns 404 when the payment doesn't exist or belong to this tenant", async () => {
    vi.mocked(Payment.findOne).mockResolvedValue(null as never)
    const response = await GET(tenantRequest('http://localhost/api/tenant/payments/verify?reference=ref-1'), undefined as never)
    expect(response.status).toBe(404)
  })

  it('returns 404 when the payment belongs to a different tenant', async () => {
    vi.mocked(Payment.findOne).mockResolvedValue({ _id: 'payment-1', tenantId: 'other-tenant', status: 'pending' } as never)
    const response = await GET(tenantRequest('http://localhost/api/tenant/payments/verify?reference=ref-1', 'tenant-1'), undefined as never)
    expect(response.status).toBe(404)
  })

  it('re-verifies via Paystack and settles when the payment is still pending', async () => {
    vi.mocked(Payment.findOne).mockResolvedValue({ _id: 'payment-1', tenantId: 'tenant-1', status: 'pending' } as never)
    vi.mocked(verifyTransaction).mockResolvedValue({ status: 'success', reference: 'ref-1', amount: 1200 } as never)
    vi.mocked(Payment.findById).mockResolvedValue({ _id: 'payment-1', status: 'paid' } as never)

    const response = await GET(tenantRequest('http://localhost/api/tenant/payments/verify?reference=ref-1'), undefined as never)
    const json = await response.json()

    expect(verifyTransaction).toHaveBeenCalledWith('ref-1')
    expect(settlePaymentByReference).toHaveBeenCalledWith('ref-1', 'paid')
    expect(json).toEqual({ id: 'payment-1', status: 'paid' })
  })

  it('settles as failed when Paystack reports a non-success status', async () => {
    vi.mocked(Payment.findOne).mockResolvedValue({ _id: 'payment-1', tenantId: 'tenant-1', status: 'pending' } as never)
    vi.mocked(verifyTransaction).mockResolvedValue({ status: 'failed', reference: 'ref-1', amount: 1200 } as never)
    vi.mocked(Payment.findById).mockResolvedValue({ _id: 'payment-1', status: 'failed' } as never)

    await GET(tenantRequest('http://localhost/api/tenant/payments/verify?reference=ref-1'), undefined as never)

    expect(settlePaymentByReference).toHaveBeenCalledWith('ref-1', 'failed')
  })

  it('does not re-verify a payment that is already settled', async () => {
    vi.mocked(Payment.findOne).mockResolvedValue({ _id: 'payment-1', tenantId: 'tenant-1', status: 'paid' } as never)
    vi.mocked(Payment.findById).mockResolvedValue({ _id: 'payment-1', status: 'paid' } as never)

    await GET(tenantRequest('http://localhost/api/tenant/payments/verify?reference=ref-1'), undefined as never)

    expect(verifyTransaction).not.toHaveBeenCalled()
    expect(settlePaymentByReference).not.toHaveBeenCalled()
  })

  it('rejects an admin-role token with 403', async () => {
    const token = signToken({ sub: 'admin-1', role: 'admin' })
    const response = await GET(
      new NextRequest('http://localhost/api/tenant/payments/verify?reference=ref-1', { headers: { authorization: `Bearer ${token}` } }),
      undefined as never,
    )
    expect(response.status).toBe(403)
  })
})
