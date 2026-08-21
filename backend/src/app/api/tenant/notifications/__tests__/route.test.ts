import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/tenant/notifications/route'
import { signToken } from '@/lib/jwt'
import { Notification } from '@/models/Notification'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Notification', () => ({ Notification: { find: vi.fn() } }))

function tenantRequest(sub = 'tenant-1') {
  const token = signToken({ sub, role: 'tenant' })
  return new NextRequest('http://localhost/api/tenant/notifications', { headers: { authorization: `Bearer ${token}` } })
}

describe('GET /tenant/notifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('scopes strictly to this tenant (audience:tenant AND recipientId:self)', async () => {
    const sort = vi.fn().mockResolvedValue([])
    vi.mocked(Notification.find).mockReturnValue({ sort } as never)

    await GET(tenantRequest('tenant-1'), undefined as never)

    expect(Notification.find).toHaveBeenCalledWith({ audience: 'tenant', recipientId: 'tenant-1' })
    expect(sort).toHaveBeenCalledWith({ date: -1 })
  })

  it('returns the mapped notification list', async () => {
    const sort = vi.fn().mockResolvedValue([
      { _id: 'notif-1', type: 'payment', title: 'Payment received', body: 'Body', date: '2026-08-01', read: false },
    ])
    vi.mocked(Notification.find).mockReturnValue({ sort } as never)

    const response = await GET(tenantRequest(), undefined as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual([{ id: 'notif-1', type: 'payment', title: 'Payment received', body: 'Body', date: '2026-08-01', read: false }])
  })

  it('rejects an admin-role token with 403', async () => {
    const token = signToken({ sub: 'admin-1', role: 'admin' })
    const response = await GET(
      new NextRequest('http://localhost/api/tenant/notifications', { headers: { authorization: `Bearer ${token}` } }),
      undefined as never,
    )
    expect(response.status).toBe(403)
  })
})
