import { StatusBadge, Table } from '../../../components'
import type { TableColumn } from '../../../components'
import { PageHeader } from '../components/PageHeader'
import { mockCalendarEvents } from '../data/mockData'
import type { CalendarEvent, CalendarEventType } from '../data/types'

const typeLabel: Record<CalendarEventType, string> = {
  lease_renewal: 'Lease renewal',
  reminder: 'Reminder',
  payment_due: 'Payment due',
  other: 'Other',
}

const typeVariant: Record<CalendarEventType, 'info' | 'warning' | 'success' | 'danger'> = {
  lease_renewal: 'info',
  reminder: 'warning',
  payment_due: 'danger',
  other: 'success',
}

const columns: TableColumn<CalendarEvent>[] = [
  { key: 'date', header: 'Date', sortable: true },
  { key: 'title', header: 'Event', sortable: true },
  { key: 'relatedLabel', header: 'Related to', render: (event) => event.relatedLabel ?? '—' },
  {
    key: 'type',
    header: 'Type',
    render: (event) => <StatusBadge variant={typeVariant[event.type]} label={typeLabel[event.type]} />,
  },
]

const sortedEvents = [...mockCalendarEvents].sort((a, b) => a.date.localeCompare(b.date))

// TODO: fetch events from GET /calendar once the backend is reachable.
export function AdminCalendar() {
  return (
    <div>
      <PageHeader title="Calendar" description="Lease renewals, reminders, and other plaza events." />
      <Table columns={columns} data={sortedEvents} getRowKey={(event) => event.id} emptyMessage="No upcoming events" />
    </div>
  )
}
