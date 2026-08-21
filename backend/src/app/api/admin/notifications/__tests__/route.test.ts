import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/notifications/route'
import { signToken } from '@/lib/jwt'
import { Notification } from '@/models/Notification'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Notification', () => ({ Notification: { find: vi.fn() } }))

function adminRequest(sub = 'admin-1') {
  const token = signToken({ sub, role: 'admin' })
  return new NextRequest('http://localhost/api/admin/notifications', { headers: { authorization: `Bearer ${token}` } })
}

describe('GET /admin/notifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('scopes the query to audience:admin and (broadcast OR this admin)', async () => {
    const sort = vi.fn().mockResolvedValue([])
    vi.mocked(Notification.find).mockReturnValue({ sort } as never)

    await GET(adminRequest('admin-1'), undefined as never)

    expect(Notification.find).toHaveBeenCalledWith({
      audience: 'admin',
      $or: [{ recipientId: null }, { recipientId: 'admin-1' }],
    })
    expect(sort).toHaveBeenCalledWith({ date: -1 })
  })

  it('returns the mapped notification list', async () => {
    const sort = vi.fn().mockResolvedValue([
      { _id: 'notif-1', type: 'payment', title: 'Payment received', body: 'Body', date: '2026-08-01', read: false },
    ])
    vi.mocked(Notification.find).mockReturnValue({ sort } as never)

    const response = await GET(adminRequest(), undefined as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual([{ id: 'notif-1', type: 'payment', title: 'Payment received', body: 'Body', date: '2026-08-01', read: false }])
  })

  it('rejects a tenant-role token with 403', async () => {
    const token = signToken({ sub: 'tenant-1', role: 'tenant' })
    const response = await GET(
      new NextRequest('http://localhost/api/admin/notifications', { headers: { authorization: `Bearer ${token}` } }),
      undefined as never,
    )
    expect(response.status).toBe(403)
  })
})
