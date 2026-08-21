import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH } from '@/app/api/tenant/profile/route'
import { signToken } from '@/lib/jwt'
import { User } from '@/models/User'
import { Lease } from '@/models/Lease'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/User', () => ({ User: { findById: vi.fn() } }))
vi.mock('@/models/Lease', () => ({ Lease: { findOne: vi.fn() } }))

function tenantRequest(method: string, body?: unknown, sub = 'tenant-1') {
  const token = signToken({ sub, role: 'tenant' })
  return new NextRequest('http://localhost/api/tenant/profile', {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe('GET /tenant/profile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 when the user does not exist', async () => {
    vi.mocked(User.findById).mockResolvedValue(null as never)
    const response = await GET(tenantRequest('GET'), undefined as never)
    expect(response.status).toBe(404)
  })

  it('returns the profile merged with the most recent lease', async () => {
    vi.mocked(User.findById).mockResolvedValue({ _id: 'tenant-1', name: 'Jane Cooper', email: 'jane@example.com', phone: '555', unitNumber: 'A-101' } as never)
    vi.mocked(Lease.findOne).mockReturnValue({
      sort: vi.fn().mockResolvedValue({ startDate: '2026-01-01', endDate: '2026-12-31', rentAmount: 1200 }),
    } as never)

    const response = await GET(tenantRequest('GET'), undefined as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({ name: 'Jane Cooper', leaseStart: '2026-01-01', leaseEnd: '2026-12-31', monthlyRent: 1200 })
  })

  it('rejects an admin-role token with 403', async () => {
    const token = signToken({ sub: 'admin-1', role: 'admin' })
    const response = await GET(
      new NextRequest('http://localhost/api/tenant/profile', { headers: { authorization: `Bearer ${token}` } }),
      undefined as never,
    )
    expect(response.status).toBe(403)
  })
})

describe('PATCH /tenant/profile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('accepts an empty update body (all fields optional) and leaves values unchanged', async () => {
    const user = { _id: 'tenant-1', name: 'Old Name', phone: '111', email: 'jane@example.com', unitNumber: 'A-101', save: vi.fn().mockResolvedValue(undefined) }
    vi.mocked(User.findById).mockResolvedValue(user as never)
    vi.mocked(Lease.findOne).mockReturnValue({ sort: vi.fn().mockResolvedValue(null) } as never)

    const response = await PATCH(tenantRequest('PATCH', {}), undefined as never)

    expect(response.status).toBe(200)
    expect(user.save).toHaveBeenCalledOnce()
  })

  it('rejects unknown extra fields (.strict())', async () => {
    const response = await PATCH(tenantRequest('PATCH', { name: 'Jane', role: 'admin' }), undefined as never)
    expect(response.status).toBe(400)
  })

  it('updates only own name/phone', async () => {
    const user = { _id: 'tenant-1', name: 'Old Name', phone: '111', email: 'jane@example.com', unitNumber: 'A-101', save: vi.fn().mockResolvedValue(undefined) }
    vi.mocked(User.findById).mockResolvedValue(user as never)
    vi.mocked(Lease.findOne).mockReturnValue({ sort: vi.fn().mockResolvedValue(null) } as never)

    const response = await PATCH(tenantRequest('PATCH', { name: 'Jane Cooper' }), undefined as never)

    expect(response.status).toBe(200)
    expect(user.name).toBe('Jane Cooper')
    expect(user.save).toHaveBeenCalledOnce()
  })

  it('returns 404 when the user does not exist', async () => {
    vi.mocked(User.findById).mockResolvedValue(null as never)
    const response = await PATCH(tenantRequest('PATCH', { name: 'Jane' }), undefined as never)
    expect(response.status).toBe(404)
  })
})
