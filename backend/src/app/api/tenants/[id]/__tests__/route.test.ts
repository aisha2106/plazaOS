import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/tenants/[id]/route'
import { signToken } from '@/lib/jwt'
import { User } from '@/models/User'
import { Lease } from '@/models/Lease'
import { RentCharge } from '@/models/RentCharge'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/User', () => ({ User: { findOne: vi.fn() } }))
vi.mock('@/models/Lease', () => ({ Lease: { findOne: vi.fn() } }))
vi.mock('@/models/RentCharge', () => ({ RentCharge: { find: vi.fn() } }))

function adminRequest(body: unknown) {
  const token = signToken({ sub: 'admin-1', role: 'admin' })
  return new NextRequest('http://localhost/api/tenants/tenant-1', {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /tenants/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(RentCharge.find).mockResolvedValue([])
  })

  // `rentStatus` must only ever change as a side effect of a real settled
  // Payment (see POST /payments) — never a raw admin field edit. This is an
  // intentional deviation from BACKEND_BUILD_PLAN.md §3.2's original table.
  it('rejects a request body containing rentStatus (unknown key under .strict())', async () => {
    vi.mocked(User.findOne).mockResolvedValue({ _id: 'tenant-1', role: 'tenant', save: vi.fn() } as never)
    vi.mocked(Lease.findOne).mockResolvedValue(null)

    const response = await PATCH(adminRequest({ rentStatus: 'paid' }), { params: Promise.resolve({ id: 'tenant-1' }) })

    expect(response.status).toBe(400)
  })

  it('updates the active lease when leaseEnd/monthlyRent are provided', async () => {
    const userSave = vi.fn().mockResolvedValue(undefined)
    const leaseSave = vi.fn().mockResolvedValue(undefined)
    vi.mocked(User.findOne).mockResolvedValue({ _id: 'tenant-1', role: 'tenant', save: userSave } as never)
    vi.mocked(Lease.findOne).mockReturnValue({
      sort: vi.fn().mockResolvedValue({ tenantId: 'tenant-1', endDate: '2027-07-31', rentAmount: 1200, save: leaseSave }),
    } as never)

    const response = await PATCH(adminRequest({ leaseEnd: '2028-01-31', monthlyRent: 1500 }), {
      params: Promise.resolve({ id: 'tenant-1' }),
    })

    expect(response.status).toBe(200)
    expect(leaseSave).toHaveBeenCalledOnce()
  })

  it('409s when updating lease fields for a tenant with no active lease', async () => {
    vi.mocked(User.findOne).mockResolvedValue({ _id: 'tenant-1', role: 'tenant', save: vi.fn() } as never)
    vi.mocked(Lease.findOne).mockReturnValue({ sort: vi.fn().mockResolvedValue(null) } as never)

    const response = await PATCH(adminRequest({ monthlyRent: 1500 }), { params: Promise.resolve({ id: 'tenant-1' }) })

    expect(response.status).toBe(409)
  })
})
