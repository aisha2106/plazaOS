import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/tenant/rent-charges/route'
import { signToken } from '@/lib/jwt'
import { RentCharge } from '@/models/RentCharge'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/RentCharge', () => ({ RentCharge: { find: vi.fn() } }))

function tenantRequest(sub = 'tenant-1') {
  const token = signToken({ sub, role: 'tenant' })
  return new NextRequest('http://localhost/api/tenant/rent-charges', { headers: { authorization: `Bearer ${token}` } })
}

describe('GET /tenant/rent-charges', () => {
  beforeEach(() => vi.clearAllMocks())

  it("scopes the query to the authenticated tenant's own non-paid charges", async () => {
    const sort = vi.fn().mockResolvedValue([])
    vi.mocked(RentCharge.find).mockReturnValue({ sort } as never)

    await GET(tenantRequest('tenant-1'), undefined as never)

    expect(RentCharge.find).toHaveBeenCalledWith({ tenantId: 'tenant-1', status: { $ne: 'paid' } })
    expect(sort).toHaveBeenCalledWith({ dueDate: 1 })
  })

  it('returns the mapped rent charge list', async () => {
    const sort = vi.fn().mockResolvedValue([{ _id: 'rc-1', period: '2026-08', amount: 1200, dueDate: '2026-08-01', status: 'due' }])
    vi.mocked(RentCharge.find).mockReturnValue({ sort } as never)

    const response = await GET(tenantRequest(), undefined as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data[0]).toMatchObject({ id: 'rc-1', period: '2026-08', status: 'due' })
  })

  it('rejects an admin-role token with 403', async () => {
    const token = signToken({ sub: 'admin-1', role: 'admin' })
    const response = await GET(
      new NextRequest('http://localhost/api/tenant/rent-charges', { headers: { authorization: `Bearer ${token}` } }),
      undefined as never,
    )
    expect(response.status).toBe(403)
  })
})
