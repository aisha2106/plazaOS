import { Reminder } from '@/models/Reminder'
import { Notification } from '@/models/Notification'
import { User } from '@/models/User'
import { sendEmail } from './email'

interface ProcessRemindersResult {
  sent: number
  failed: number
}

// Plain, reusable function containing the actual reminder-processing logic —
// deliberately decoupled from whichever scheduler calls it (Railway Cron via
// the HTTP route in app/api/cron/process-reminders, a test, a manual run,
// etc.), per BACKEND_BUILD_PLAN.md §8.
export async function processReminders(now: Date = new Date()): Promise<ProcessRemindersResult> {
  const today = now.toISOString().slice(0, 10)
  const due = await Reminder.find({ status: 'scheduled', scheduledFor: { $lte: today } })

  let sent = 0
  let failed = 0

  for (const reminder of due) {
    // Atomic claim so a concurrent/restarted run can't send the same reminder twice.
    const claimed = await Reminder.findOneAndUpdate({ _id: reminder._id, status: 'scheduled' }, { status: 'sent' })
    if (!claimed) continue

    try {
      const date = now.toISOString().slice(0, 10)
      const recipientIds: (typeof reminder.targetTenantIds)[number][] =
        reminder.target === 'everyone' ? [undefined] : (reminder.targetTenantIds ?? [])

      await Notification.insertMany(
        recipientIds.map((recipientId) => ({
          audience: 'tenant',
          recipientId,
          type: 'reminder',
          title: reminder.title,
          body: reminder.message,
          date,
          read: false,
        })),
      )
      await Notification.create({
        audience: 'admin',
        type: 'reminder',
        title: `Reminder sent — ${reminder.title}`,
        body: reminder.targetLabel,
        date,
        read: false,
      })

      // Email is decoupled from notification creation — a provider outage
      // must never block the reminder sweep from completing (src/lib/email.ts).
      const tenants =
        reminder.target === 'everyone'
          ? await User.find({ role: 'tenant' }).select('email').lean()
          : await User.find({ _id: { $in: reminder.targetTenantIds ?? [] } })
              .select('email')
              .lean()
      await Promise.all(
        tenants
          .filter((tenant) => tenant.email)
          .map((tenant) => sendEmail({ to: tenant.email, subject: reminder.title, html: `<p>${reminder.message}</p>` })),
      )

      sent++
    } catch (err) {
      console.error('Failed to send reminder', reminder._id, err)
      await Reminder.findByIdAndUpdate(reminder._id, { status: 'failed' })
      failed++
    }
  }

  return { sent, failed }
}
