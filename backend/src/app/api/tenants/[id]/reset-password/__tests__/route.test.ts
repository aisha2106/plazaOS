import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/tenants/[id]/reset-password/route'
import { signToken } from '@/lib/jwt'
import { User } from '@/models/User'
import { rateLimit } from '@/lib/rate-limit'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/User', () => ({ User: { findOne: vi.fn() } }))
vi.mock('@/lib/password', () => ({
  generateTempPassword: vi.fn(() => 'Temp1234'),
  hashPassword: vi.fn(async () => 'hashed-temp1234'),
}))
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn() }))

function adminRequest(sub = 'admin-1') {
  const token = signToken({ sub, role: 'admin' })
  return new NextRequest('http://localhost/api/tenants/tenant-1/reset-password', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  })
}

describe('POST /tenants/:id/reset-password', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 when the tenant does not exist', async () => {
    vi.mocked(User.findOne).mockResolvedValue(null as never)
    const response = await POST(adminRequest(), { params: Promise.resolve({ id: 'tenant-1' }) })
    expect(response.status).toBe(404)
  })

  it('generates a new temp password, hashes it, and forces mustChangePassword', async () => {
    const user = { _id: 'tenant-1', email: 'jane@example.com', passwordHash: 'old', accountStatus: 'active', mustChangePassword: false, save: vi.fn().mockResolvedValue(undefined) }
    vi.mocked(User.findOne).mockResolvedValue(user as never)

    const response = await POST(adminRequest(), { params: Promise.resolve({ id: 'tenant-1' }) })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ success: true, email: 'jane@example.com', tempPassword: 'Temp1234' })
    expect(user.passwordHash).toBe('hashed-temp1234')
    expect(user.accountStatus).toBe('temporary')
    expect(user.mustChangePassword).toBe(true)
    expect(user.save).toHaveBeenCalledOnce()
  })

  it('is rate-limited per acting admin', async () => {
    vi.mocked(User.findOne).mockResolvedValue({ _id: 'tenant-1', save: vi.fn() } as never)

    await POST(adminRequest('admin-1'), { params: Promise.resolve({ id: 'tenant-1' }) })

    expect(rateLimit).toHaveBeenCalledWith('reset-password:admin-1', 5, 15 * 60_000)
  })

  it('only matches tenant-role users, not admins', async () => {
    vi.mocked(User.findOne).mockResolvedValue(null as never)
    await POST(adminRequest(), { params: Promise.resolve({ id: 'some-admin' }) })

    expect(User.findOne).toHaveBeenCalledWith({ _id: 'some-admin', role: 'tenant' })
  })

  it('rejects a tenant-role token with 403', async () => {
    const token = signToken({ sub: 'tenant-1', role: 'tenant' })
    const request = new NextRequest('http://localhost/api/tenants/tenant-1/reset-password', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    })
    const response = await POST(request, { params: Promise.resolve({ id: 'tenant-1' }) })
    expect(response.status).toBe(403)
  })
})
