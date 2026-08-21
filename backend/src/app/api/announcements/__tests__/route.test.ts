import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/announcements/route'
import { signToken } from '@/lib/jwt'
import { Announcement } from '@/models/Announcement'
import { User } from '@/models/User'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Announcement', () => ({ Announcement: { create: vi.fn() } }))
vi.mock('@/models/User', () => ({ User: { findById: vi.fn() } }))

function adminRequest(body: unknown) {
  const token = signToken({ sub: 'admin-1', role: 'admin' })
  return new NextRequest('http://localhost/api/announcements', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /announcements', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects audience "selected" with an empty audienceTenantIds', async () => {
    const response = await POST(adminRequest({ title: 'Notice', body: 'Body', audience: 'selected', audienceTenantIds: [] }), undefined as never)

    expect(response.status).toBe(400)
    expect(Announcement.create).not.toHaveBeenCalled()
  })

  it('accepts audience "selected" with a non-empty audienceTenantIds', async () => {
    vi.mocked(User.findById).mockResolvedValue({ name: 'Admin User' } as never)
    vi.mocked(Announcement.create).mockResolvedValue({ _id: 'announcement-1' } as never)

    const response = await POST(
      adminRequest({ title: 'Notice', body: 'Body', audience: 'selected', audienceTenantIds: ['tenant-1'] }),
      undefined as never,
    )

    expect(response.status).toBe(200)
    expect(Announcement.create).toHaveBeenCalledOnce()
  })

  it('accepts audience "all" with no audienceTenantIds', async () => {
    vi.mocked(User.findById).mockResolvedValue({ name: 'Admin User' } as never)
    vi.mocked(Announcement.create).mockResolvedValue({ _id: 'announcement-1' } as never)

    const response = await POST(adminRequest({ title: 'Notice', body: 'Body', audience: 'all' }), undefined as never)

    expect(response.status).toBe(200)
  })
})
