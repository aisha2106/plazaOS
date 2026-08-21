import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/cron/process-reminders/route'
import { processReminders } from '@/lib/process-reminders'
import { createAutomaticRentReminders } from '@/lib/auto-rent-reminders'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/lib/process-reminders', () => ({ processReminders: vi.fn() }))
vi.mock('@/lib/auto-rent-reminders', () => ({ createAutomaticRentReminders: vi.fn() }))

function cronRequest(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/cron/process-reminders', { method: 'POST', headers })
}

describe('POST /cron/process-reminders', () => {
  const originalSecret = process.env.CRON_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'test-cron-secret'
  })

  afterAll(() => {
    process.env.CRON_SECRET = originalSecret
  })

  it('rejects a request with no Authorization header', async () => {
    const response = await POST(cronRequest(), undefined as never)
    expect(response.status).toBe(401)
  })

  it('rejects a request with the wrong bearer secret', async () => {
    const response = await POST(cronRequest({ authorization: 'Bearer wrong-secret' }), undefined as never)
    expect(response.status).toBe(401)
  })

  it('rejects every request when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET
    const response = await POST(cronRequest({ authorization: 'Bearer anything' }), undefined as never)
    expect(response.status).toBe(401)
  })

  it('creates automatic reminders before sweeping/sending, and returns combined counts', async () => {
    vi.mocked(createAutomaticRentReminders).mockResolvedValue({ created: 2 })
    vi.mocked(processReminders).mockResolvedValue({ sent: 3, failed: 1 })

    const response = await POST(cronRequest({ authorization: 'Bearer test-cron-secret' }), undefined as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ sent: 3, failed: 1, created: 2 })
    expect(createAutomaticRentReminders).toHaveBeenCalled()
    expect(processReminders).toHaveBeenCalled()
  })
})
