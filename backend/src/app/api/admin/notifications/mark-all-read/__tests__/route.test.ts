import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/notifications/mark-all-read/route'
import { signToken } from '@/lib/jwt'
import { Notification } from '@/models/Notification'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Notification', () => ({ Notification: { updateMany: vi.fn() } }))

function adminRequest(sub = 'admin-1') {
  const token = signToken({ sub, role: 'admin' })
  return new NextRequest('http://localhost/api/admin/notifications/mark-all-read', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  })
}

describe('POST /admin/notifications/mark-all-read', () => {
  beforeEach(() => vi.clearAllMocks())

  it('marks every unread admin notification (broadcast or own) as read', async () => {
    vi.mocked(Notification.updateMany).mockResolvedValue({ modifiedCount: 3 } as never)

    const response = await POST(adminRequest('admin-1'), undefined as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ success: true })
    expect(Notification.updateMany).toHaveBeenCalledWith(
      { audience: 'admin', $or: [{ recipientId: null }, { recipientId: 'admin-1' }], read: false },
      { $set: { read: true } },
    )
  })

  it('rejects a tenant-role token with 403', async () => {
    const token = signToken({ sub: 'tenant-1', role: 'tenant' })
    const response = await POST(
      new NextRequest('http://localhost/api/admin/notifications/mark-all-read', { method: 'POST', headers: { authorization: `Bearer ${token}` } }),
      undefined as never,
    )
    expect(response.status).toBe(403)
  })
})
