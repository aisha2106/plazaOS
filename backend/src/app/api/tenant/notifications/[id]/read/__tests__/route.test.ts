import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/tenant/notifications/[id]/read/route'
import { signToken } from '@/lib/jwt'
import { Notification } from '@/models/Notification'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Notification', () => ({ Notification: { findOne: vi.fn() } }))

function tenantRequest(sub = 'tenant-1') {
  const token = signToken({ sub, role: 'tenant' })
  return new NextRequest('http://localhost/api/tenant/notifications/notif-1/read', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  })
}

describe('POST /tenant/notifications/:id/read', () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 404 when the notification doesn't exist or belong to this tenant", async () => {
    vi.mocked(Notification.findOne).mockResolvedValue(null as never)
    const response = await POST(tenantRequest(), { params: Promise.resolve({ id: 'notif-1' }) })
    expect(response.status).toBe(404)
  })

  it('scopes the lookup strictly to audience:tenant and recipientId:self (cannot read another tenant\'s notification)', async () => {
    vi.mocked(Notification.findOne).mockResolvedValue(null as never)
    await POST(tenantRequest('tenant-1'), { params: Promise.resolve({ id: 'notif-1' }) })

    expect(Notification.findOne).toHaveBeenCalledWith({ _id: 'notif-1', audience: 'tenant', recipientId: 'tenant-1' })
  })

  it('marks the notification read', async () => {
    const doc = { read: false, save: vi.fn().mockResolvedValue(undefined) }
    vi.mocked(Notification.findOne).mockResolvedValue(doc as never)

    const response = await POST(tenantRequest(), { params: Promise.resolve({ id: 'notif-1' }) })

    expect(response.status).toBe(200)
    expect(doc.read).toBe(true)
    expect(doc.save).toHaveBeenCalledOnce()
  })

  it('rejects an admin-role token with 403', async () => {
    const token = signToken({ sub: 'admin-1', role: 'admin' })
    const request = new NextRequest('http://localhost/api/tenant/notifications/notif-1/read', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    })
    const response = await POST(request, { params: Promise.resolve({ id: 'notif-1' }) })
    expect(response.status).toBe(403)
  })
})
