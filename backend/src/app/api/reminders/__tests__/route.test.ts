import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/reminders/route'
import { signToken } from '@/lib/jwt'
import { Reminder } from '@/models/Reminder'
import { User } from '@/models/User'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Reminder', () => ({ Reminder: { create: vi.fn() } }))
vi.mock('@/models/User', () => ({ User: { findOne: vi.fn(), find: vi.fn() } }))

function adminRequest(body: unknown) {
  const token = signToken({ sub: 'admin-1', role: 'admin' })
  return new NextRequest('http://localhost/api/reminders', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /reminders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects target "tenant" with no tenantId', async () => {
    const response = await POST(
      adminRequest({ title: 'Reminder', message: 'msg', target: 'tenant', scheduledFor: '2026-08-01' }),
      undefined as never,
    )

    expect(response.status).toBe(400)
    expect(Reminder.create).not.toHaveBeenCalled()
  })

  it('rejects target "group" with an empty groupTenantIds', async () => {
    const response = await POST(
      adminRequest({ title: 'Reminder', message: 'msg', target: 'group', groupTenantIds: [], scheduledFor: '2026-08-01' }),
      undefined as never,
    )

    expect(response.status).toBe(400)
    expect(Reminder.create).not.toHaveBeenCalled()
  })

  it('accepts target "everyone" with neither tenantId nor groupTenantIds', async () => {
    vi.mocked(Reminder.create).mockResolvedValue({ _id: 'reminder-1' } as never)

    const response = await POST(
      adminRequest({ title: 'Reminder', message: 'msg', target: 'everyone', scheduledFor: '2026-08-01' }),
      undefined as never,
    )

    expect(response.status).toBe(200)
    expect(Reminder.create).toHaveBeenCalledWith(expect.objectContaining({ target: 'everyone', type: 'manual', status: 'scheduled' }))
  })

  it('accepts target "tenant" with a valid tenantId', async () => {
    vi.mocked(User.findOne).mockResolvedValue({ _id: 'tenant-1', name: 'Jane Cooper' } as never)
    vi.mocked(Reminder.create).mockResolvedValue({ _id: 'reminder-1' } as never)

    const response = await POST(
      adminRequest({ title: 'Reminder', message: 'msg', target: 'tenant', tenantId: 'tenant-1', scheduledFor: '2026-08-01' }),
      undefined as never,
    )

    expect(response.status).toBe(200)
    expect(Reminder.create).toHaveBeenCalledWith(expect.objectContaining({ targetLabel: 'Jane Cooper', targetTenantIds: ['tenant-1'] }))
  })
})
