import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/notifications/[id]/read/route'
import { signToken } from '@/lib/jwt'
import { Notification } from '@/models/Notification'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Notification', () => ({ Notification: { findOne: vi.fn() } }))

function adminRequest(sub = 'admin-1') {
  const token = signToken({ sub, role: 'admin' })
  return new NextRequest('http://localhost/api/admin/notifications/notif-1/read', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  })
}

describe('POST /admin/notifications/:id/read', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 when the notification does not exist or belong to this admin/broadcast', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue(null as never)
    const response = await POST(adminRequest(), { params: Promise.resolve({ id: 'notif-1' }) })
    expect(response.status).toBe(404)
  })

  it('scopes the lookup to audience:admin and (broadcast OR this admin)', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue(null as never)
    await POST(adminRequest('admin-1'), { params: Promise.resolve({ id: 'notif-1' }) })

    expect(Notification.findOne).toHaveBeenCalledWith({
      _id: 'notif-1',
      audience: 'admin',
      $or: [{ recipientId: null }, { recipientId: 'admin-1' }],
    })
  })

  it('marks the notification read', async () => {
    const doc = { read: false, save: vi.fn().mockResolvedValue(undefined) }
    vi.mocked(Notification.findOne).mockResolvedValue(doc as never)

    const response = await POST(adminRequest(), { params: Promise.resolve({ id: 'notif-1' }) })

    expect(response.status).toBe(200)
    expect(doc.read).toBe(true)
    expect(doc.save).toHaveBeenCalledOnce()
  })

  it('rejects a tenant-role token with 403', async () => {
    const token = signToken({ sub: 'tenant-1', role: 'tenant' })
    const request = new NextRequest('http://localhost/api/admin/notifications/notif-1/read', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    })
    const response = await POST(request, { params: Promise.resolve({ id: 'notif-1' }) })
    expect(response.status).toBe(403)
  })
})
