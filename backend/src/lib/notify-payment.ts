import { Notification } from '@/models/Notification'
import { User } from '@/models/User'
import { sendEmail } from './email'

interface PaymentSummary {
  tenantId: unknown
  tenantName: string
  unitNumber: string
  amount: number
}

// Creates the matching tenant + admin Notification documents for a payment
// reaching a terminal state, per BACKEND_BUILD_PLAN.md §7/§9.
export async function notifyPaymentOutcome(payment: PaymentSummary, status: 'paid' | 'failed'): Promise<void> {
  const date = new Date().toISOString().slice(0, 10)
  const amount = payment.amount.toFixed(2)
  const title = status === 'paid' ? 'Payment received' : 'Payment failed'
  const tenantBody =
    status === 'paid'
      ? `Your payment of $${amount} was received.`
      : `Your payment of $${amount} could not be processed.`

  await Notification.create([
    {
      audience: 'tenant',
      recipientId: payment.tenantId,
      type: 'payment',
      title,
      body: tenantBody,
      date,
      read: false,
    },
    {
      audience: 'admin',
      type: 'payment',
      title: status === 'paid' ? `Payment received — ${payment.tenantName}` : `Payment failed — ${payment.tenantName}`,
      body: `Unit ${payment.unitNumber} — $${amount}`,
      date,
      read: false,
    },
  ])

  // Email is decoupled from notification creation — a provider outage must
  // never block a payment from settling (see src/lib/email.ts).
  const tenant = await User.findById(payment.tenantId).select('email').lean()
  if (tenant?.email) {
    await sendEmail({ to: tenant.email, subject: title, html: `<p>${tenantBody}</p>` })
  }
}
