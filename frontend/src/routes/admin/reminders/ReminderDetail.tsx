import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, StatusBadge, Text } from '../../../components'
import { BackLink } from '../components/BackLink'
import { DetailField } from '../components/DetailField'
import { PageHeader } from '../components/PageHeader'
import type { Reminder, ReminderStatus, ReminderType } from '../data/types'
import { getReminder } from './data'

const statusLabel: Record<ReminderStatus, string> = {
  scheduled: 'Scheduled',
  sent: 'Sent',
  failed: 'Failed',
}

const statusVariant: Record<ReminderStatus, 'info' | 'success' | 'danger'> = {
  scheduled: 'info',
  sent: 'success',
  failed: 'danger',
}

const typeLabel: Record<ReminderType, string> = {
  automatic: 'Automatic',
  manual: 'Manual',
}

// Fetches this reminder from GET /reminders/:reminderId.
export function ReminderDetail() {
  const { reminderId } = useParams<{ reminderId: string }>()
  const [reminder, setReminder] = useState<Reminder | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!reminderId) return
    let cancelled = false
    setLoading(true)
    getReminder(reminderId)
      .then((found) => {
        if (!cancelled) setReminder(found)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reminderId])

  if (loading) {
    return (
      <div>
        <BackLink to="/admin/reminders" label="Back to reminders" />
        <Text variant="body">Loading…</Text>
      </div>
    )
  }

  if (!reminder) {
    return (
      <div>
        <BackLink to="/admin/reminders" label="Back to reminders" />
        <Text variant="body">Reminder not found.</Text>
      </div>
    )
  }

  return (
    <div>
      <BackLink to="/admin/reminders" label="Back to reminders" />
      <PageHeader
        title={reminder.title}
        action={<StatusBadge variant={statusVariant[reminder.status]} label={statusLabel[reminder.status]} />}
      />
      <Card className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <DetailField label="Type">{typeLabel[reminder.type]}</DetailField>
        <DetailField label="Target">{reminder.targetLabel}</DetailField>
        <DetailField label="Scheduled for">{reminder.scheduledFor}</DetailField>
        <div className="sm:col-span-2">
          <DetailField label="Message">{reminder.message}</DetailField>
        </div>
      </Card>
    </div>
  )
}
