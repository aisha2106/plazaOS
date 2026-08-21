import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/rent-charges/route'
import { signToken } from '@/lib/jwt'
import { RentCharge } from '@/models/RentCharge'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/RentCharge', () => ({ RentCharge: { find: vi.fn() } }))

function adminRequest(url: string) {
  const token = signToken({ sub: 'admin-1', role: 'admin' })
  return new NextRequest(url, { headers: { authorization: `Bearer ${token}` } })
}

describe('GET /rent-charges (admin)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects a request with no tenantId with 400', async () => {
    const response = await GET(adminRequest('http://localhost/api/rent-charges'), undefined as never)
    expect(response.status).toBe(400)
    expect(RentCharge.find).not.toHaveBeenCalled()
  })

  it('returns the tenant\'s non-paid rent charges sorted by dueDate', async () => {
    const sort = vi.fn().mockResolvedValue([
      { _id: 'rc-1', period: '2026-08', amount: 1200, dueDate: '2026-08-01', status: 'due' },
    ])
    vi.mocked(RentCharge.find).mockReturnValue({ sort } as never)

    const response = await GET(adminRequest('http://localhost/api/rent-charges?tenantId=tenant-1'), undefined as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(RentCharge.find).toHaveBeenCalledWith({ tenantId: 'tenant-1', status: { $ne: 'paid' } })
    expect(sort).toHaveBeenCalledWith({ dueDate: 1 })
    expect(json.data[0]).toMatchObject({ id: 'rc-1', period: '2026-08' })
  })

  it('rejects a tenant-role token with 403', async () => {
    const token = signToken({ sub: 'tenant-1', role: 'tenant' })
    const response = await GET(
      new NextRequest('http://localhost/api/rent-charges?tenantId=tenant-1', { headers: { authorization: `Bearer ${token}` } }),
      undefined as never,
    )
    expect(response.status).toBe(403)
  })
})
