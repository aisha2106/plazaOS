import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const sendMock = vi.fn()
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

describe('sendEmail', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('skips sending (never throws) when RESEND_API_KEY is unset', async () => {
    delete process.env.RESEND_API_KEY
    const { sendEmail } = await import('@/lib/email')

    await expect(sendEmail({ to: 'tenant@example.com', subject: 'Hi', html: '<p>Hi</p>' })).resolves.toBeUndefined()
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('skips sending when RESEND_API_KEY is still the placeholder value', async () => {
    process.env.RESEND_API_KEY = 're_replace_me'
    const { sendEmail } = await import('@/lib/email')

    await sendEmail({ to: 'tenant@example.com', subject: 'Hi', html: '<p>Hi</p>' })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends via Resend when a real API key is configured', async () => {
    process.env.RESEND_API_KEY = 'real-key'
    process.env.RESEND_FROM_EMAIL = 'noreply@plaza.test'
    sendMock.mockResolvedValue({ data: { id: 'email-1' } })
    const { sendEmail } = await import('@/lib/email')

    await sendEmail({ to: 'tenant@example.com', subject: 'Hi', html: '<p>Hi</p>' })

    expect(sendMock).toHaveBeenCalledWith({
      from: 'noreply@plaza.test',
      to: 'tenant@example.com',
      subject: 'Hi',
      html: '<p>Hi</p>',
    })
  })

  it('never throws even if the Resend API call fails', async () => {
    process.env.RESEND_API_KEY = 'real-key'
    sendMock.mockRejectedValue(new Error('network error'))
    const { sendEmail } = await import('@/lib/email')

    await expect(sendEmail({ to: 'tenant@example.com', subject: 'Hi', html: '<p>Hi</p>' })).resolves.toBeUndefined()
  })
})
