import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processReminders } from '@/lib/process-reminders'
import { Reminder } from '@/models/Reminder'
import { Notification } from '@/models/Notification'
import { User } from '@/models/User'
import { sendEmail } from '@/lib/email'

vi.mock('@/models/Reminder', () => ({
  Reminder: { find: vi.fn(), findOneAndUpdate: vi.fn(), findByIdAndUpdate: vi.fn() },
}))
vi.mock('@/models/Notification', () => ({ Notification: { insertMany: vi.fn(), create: vi.fn() } }))
vi.mock('@/models/User', () => ({ User: { find: vi.fn() } }))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn() }))

function mockSelectLean(result: unknown) {
  return { select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(result) }) }
}

describe('processReminders', () => {
  beforeEach(() => {
    // resetAllMocks (not clearAllMocks) so a mockRejectedValue/mockResolvedValue
    // set by one test can't leak its implementation into the next test.
    vi.resetAllMocks()
  })

  it('sends a due reminder exactly once: claims it, notifies, emails, and reports it as sent', async () => {
    const reminder = {
      _id: 'reminder-1',
      status: 'scheduled',
      scheduledFor: '2026-08-01',
      target: 'tenant',
      targetTenantIds: ['tenant-1'],
      targetLabel: 'Jane Cooper',
      title: 'Rent due',
      message: 'Your rent is due',
    }
    vi.mocked(Reminder.find).mockResolvedValue([reminder] as never)
    vi.mocked(Reminder.findOneAndUpdate).mockResolvedValue(reminder as never)
    vi.mocked(User.find).mockReturnValue(mockSelectLean([{ email: 'jane@example.com' }]) as never)

    const result = await processReminders(new Date('2026-08-13'))

    expect(result).toEqual({ sent: 1, failed: 0 })
    expect(Reminder.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'reminder-1', status: 'scheduled' }, { status: 'sent' })
    expect(Notification.insertMany).toHaveBeenCalledWith([expect.objectContaining({ audience: 'tenant', recipientId: 'tenant-1' })])
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({ audience: 'admin' }))
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'jane@example.com' }))
  })

  it('skips a reminder a concurrent run already claimed, without double-sending', async () => {
    const reminder = { _id: 'reminder-1', status: 'scheduled', scheduledFor: '2026-08-01', target: 'tenant', targetTenantIds: ['tenant-1'] }
    vi.mocked(Reminder.find).mockResolvedValue([reminder] as never)
    // Another process already flipped it to 'sent' between the query and the claim attempt.
    vi.mocked(Reminder.findOneAndUpdate).mockResolvedValue(null as never)

    const result = await processReminders(new Date('2026-08-13'))

    expect(result).toEqual({ sent: 0, failed: 0 })
    expect(Notification.insertMany).not.toHaveBeenCalled()
  })

  it('marks a reminder failed (not sent) if notification/email delivery throws, and keeps processing', async () => {
    const reminder = { _id: 'reminder-1', status: 'scheduled', scheduledFor: '2026-08-01', target: 'tenant', targetTenantIds: ['tenant-1'] }
    vi.mocked(Reminder.find).mockResolvedValue([reminder] as never)
    vi.mocked(Reminder.findOneAndUpdate).mockResolvedValue(reminder as never)
    vi.mocked(Notification.insertMany).mockRejectedValue(new Error('db down'))

    const result = await processReminders(new Date('2026-08-13'))

    expect(result).toEqual({ sent: 0, failed: 1 })
    expect(Reminder.findByIdAndUpdate).toHaveBeenCalledWith('reminder-1', { status: 'failed' })
  })

  it('broadcasts to every tenant when target is "everyone"', async () => {
    const reminder = {
      _id: 'reminder-1',
      status: 'scheduled',
      scheduledFor: '2026-08-01',
      target: 'everyone',
      targetTenantIds: [],
      targetLabel: 'Everyone',
      title: 'Building notice',
      message: 'Water shutoff tomorrow',
    }
    vi.mocked(Reminder.find).mockResolvedValue([reminder] as never)
    vi.mocked(Reminder.findOneAndUpdate).mockResolvedValue(reminder as never)
    vi.mocked(User.find).mockReturnValue(mockSelectLean([{ email: 'a@example.com' }, { email: 'b@example.com' }]) as never)

    const result = await processReminders(new Date('2026-08-13'))

    expect(result).toEqual({ sent: 1, failed: 0 })
    expect(User.find).toHaveBeenCalledWith({ role: 'tenant' })
    expect(sendEmail).toHaveBeenCalledTimes(2)
  })

  it('only queries reminders that are scheduled and due by now', async () => {
    vi.mocked(Reminder.find).mockResolvedValue([] as never)

    await processReminders(new Date('2026-08-13'))

    expect(Reminder.find).toHaveBeenCalledWith({ status: 'scheduled', scheduledFor: { $lte: '2026-08-13' } })
  })
})
