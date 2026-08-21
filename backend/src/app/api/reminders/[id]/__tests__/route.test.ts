import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/reminders/[id]/route'
import { signToken } from '@/lib/jwt'
import { Reminder } from '@/models/Reminder'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Reminder', () => ({ Reminder: { findById: vi.fn() } }))

function adminRequest() {
  const token = signToken({ sub: 'admin-1', role: 'admin' })
  return new NextRequest('http://localhost/api/reminders/rem-1', { headers: { authorization: `Bearer ${token}` } })
}

describe('GET /reminders/:id (admin)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 when not found', async () => {
    vi.mocked(Reminder.findById).mockResolvedValue(null as never)
    const response = await GET(adminRequest(), { params: Promise.resolve({ id: 'rem-1' }) })
    expect(response.status).toBe(404)
  })

  it('returns the reminder detail when found', async () => {
    vi.mocked(Reminder.findById).mockResolvedValue({
      _id: 'rem-1',
      title: 'Rent due soon',
      message: 'Your rent is due',
      type: 'automatic',
      target: 'tenant',
      targetLabel: 'Jane Cooper',
      scheduledFor: '2026-08-05',
      status: 'scheduled',
    } as never)

    const response = await GET(adminRequest(), { params: Promise.resolve({ id: 'rem-1' }) })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({ id: 'rem-1', title: 'Rent due soon', status: 'scheduled' })
  })

  it('rejects a tenant-role token with 403', async () => {
    const token = signToken({ sub: 'tenant-1', role: 'tenant' })
    const response = await GET(
      new NextRequest('http://localhost/api/reminders/rem-1', { headers: { authorization: `Bearer ${token}` } }),
      { params: Promise.resolve({ id: 'rem-1' }) },
    )
    expect(response.status).toBe(403)
  })
})
