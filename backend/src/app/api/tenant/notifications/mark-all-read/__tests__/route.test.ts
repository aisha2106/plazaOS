import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/tenant/notifications/mark-all-read/route'
import { signToken } from '@/lib/jwt'
import { Notification } from '@/models/Notification'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Notification', () => ({ Notification: { updateMany: vi.fn() } }))

function tenantRequest(sub = 'tenant-1') {
  const token = signToken({ sub, role: 'tenant' })
  return new NextRequest('http://localhost/api/tenant/notifications/mark-all-read', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  })
}

describe('POST /tenant/notifications/mark-all-read', () => {
  beforeEach(() => vi.clearAllMocks())

  it("marks only this tenant's own unread notifications as read", async () => {
    vi.mocked(Notification.updateMany).mockResolvedValue({ modifiedCount: 2 } as never)

    const response = await POST(tenantRequest('tenant-1'), undefined as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ success: true })
    expect(Notification.updateMany).toHaveBeenCalledWith(
      { audience: 'tenant', recipientId: 'tenant-1', read: false },
      { $set: { read: true } },
    )
  })

  it('rejects an admin-role token with 403', async () => {
    const token = signToken({ sub: 'admin-1', role: 'admin' })
    const response = await POST(
      new NextRequest('http://localhost/api/tenant/notifications/mark-all-read', { method: 'POST', headers: { authorization: `Bearer ${token}` } }),
      undefined as never,
    )
    expect(response.status).toBe(403)
  })
})
