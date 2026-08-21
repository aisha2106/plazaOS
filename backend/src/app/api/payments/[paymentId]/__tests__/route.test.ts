import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/payments/[paymentId]/route'
import { signToken } from '@/lib/jwt'
import { Payment } from '@/models/Payment'
import { User } from '@/models/User'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Payment', () => ({ Payment: { findById: vi.fn() } }))
vi.mock('@/models/User', () => ({ User: { findById: vi.fn() } }))

function adminRequest() {
  const token = signToken({ sub: 'admin-1', role: 'admin' })
  return new NextRequest('http://localhost/api/payments/payment-1', { headers: { authorization: `Bearer ${token}` } })
}

describe('GET /payments/:paymentId (admin)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 when not found', async () => {
    vi.mocked(Payment.findById).mockResolvedValue(null as never)
    const response = await GET(adminRequest(), { params: Promise.resolve({ paymentId: 'payment-1' }) })
    expect(response.status).toBe(404)
  })

  it('resolves recordedBy to the admin name when set', async () => {
    vi.mocked(Payment.findById).mockResolvedValue({
      _id: 'payment-1',
      tenantId: 'tenant-1',
      tenantName: 'Jane Cooper',
      unitNumber: 'A-101',
      amount: 1200,
      method: 'cash',
      status: 'paid',
      date: '2026-08-01',
      note: undefined,
      recordedBy: 'admin-1',
    } as never)
    vi.mocked(User.findById).mockResolvedValue({ name: 'Admin User' } as never)

    const response = await GET(adminRequest(), { params: Promise.resolve({ paymentId: 'payment-1' }) })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.recordedBy).toBe('Admin User')
  })

  it('leaves recordedBy undefined when the payment has no recordedBy admin', async () => {
    vi.mocked(Payment.findById).mockResolvedValue({
      _id: 'payment-1',
      tenantId: 'tenant-1',
      tenantName: 'Jane Cooper',
      unitNumber: 'A-101',
      amount: 1200,
      method: 'gateway',
      status: 'paid',
      date: '2026-08-01',
      recordedBy: undefined,
    } as never)

    const response = await GET(adminRequest(), { params: Promise.resolve({ paymentId: 'payment-1' }) })
    const json = await response.json()

    expect(json.recordedBy).toBeUndefined()
    expect(User.findById).not.toHaveBeenCalled()
  })

  it('rejects a tenant-role token with 403', async () => {
    const token = signToken({ sub: 'tenant-1', role: 'tenant' })
    const response = await GET(
      new NextRequest('http://localhost/api/payments/payment-1', { headers: { authorization: `Bearer ${token}` } }),
      { params: Promise.resolve({ paymentId: 'payment-1' }) },
    )
    expect(response.status).toBe(403)
  })
})
