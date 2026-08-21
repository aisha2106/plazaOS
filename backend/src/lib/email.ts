import { Resend } from 'resend'

let client: Resend | null = null

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  // Unset/placeholder key (no real Resend account in this sandbox) — skip
  // sending rather than throw, so email is never on the critical path for a
  // payment/reminder to succeed (per BACKEND_BUILD_PLAN.md §9).
  if (!apiKey || apiKey === 're_replace_me') return null
  if (!client) client = new Resend(apiKey)
  return client
}

interface SendEmailInput {
  to: string
  subject: string
  html: string
}

// Fire-and-forget: never throws. A transactional-email-provider outage must
// never block a payment/reminder/webhook from completing successfully.
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const resend = getClient()
  if (!resend) {
    console.log(JSON.stringify({ email: 'skipped (RESEND_API_KEY not configured)', to, subject }))
    return
  }

  try {
    // onboarding@resend.dev is Resend's no-verification-required sandbox sender.
    await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev', to, subject, html })
  } catch (err) {
    console.error(JSON.stringify({ email: 'failed', to, subject }), err)
  }
}
