import { Link, useNavigate } from 'react-router-dom'
import { Button, StatusBadge, Table } from '../../../components'
import type { TableColumn } from '../../../components'
import { PageHeader } from '../components/PageHeader'
import { mockReminders } from '../data/mockData'
import type { Reminder, ReminderStatus, ReminderType } from '../data/types'

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

const columns: TableColumn<Reminder>[] = [
  {
    key: 'title',
    header: 'Reminder',
    sortable: true,
    render: (reminder) => (
      <Link to={`/admin/reminders/${reminder.id}`} className="font-medium text-primary hover:text-primary-light">
        {reminder.title}
      </Link>
    ),
  },
  { key: 'targetLabel', header: 'Target' },
  { key: 'type', header: 'Type', render: (reminder) => typeLabel[reminder.type] },
  { key: 'scheduledFor', header: 'Scheduled for', sortable: true },
  {
    key: 'status',
    header: 'Status',
    render: (reminder) => <StatusBadge variant={statusVariant[reminder.status]} label={statusLabel[reminder.status]} />,
  },
]

// TODO: fetch reminders from GET /reminders once the backend is reachable.
export function RemindersList() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="Reminders"
        description="Automatic reminders sent by the backend, plus any manual reminders you've sent."
        action={<Button onClick={() => navigate('/admin/reminders/new')}>New reminder</Button>}
      />
      <Table columns={columns} data={mockReminders} getRowKey={(reminder) => reminder.id} emptyMessage="No reminders yet" />
    </div>
  )
}
