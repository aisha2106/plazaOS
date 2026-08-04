import { Link } from 'react-router-dom'
import { Card, StatusBadge, Text } from '../../components'
import { PageHeader } from './components/PageHeader'
import { mockCalendarEvents, mockMaintenanceRequests, mockPayments, mockTenants, mockUnits } from './data/mockData'

// TODO: replace these derived stats with a real summary endpoint once the
// backend is reachable.
const totalUnits = mockUnits.length
const occupiedUnits = mockUnits.filter((unit) => unit.status === 'occupied').length
const vacantUnits = mockUnits.filter((unit) => unit.status === 'vacant').length
const overdueTenants = mockTenants.filter((tenant) => tenant.rentStatus === 'overdue').length
const openMaintenance = mockMaintenanceRequests.filter((request) => request.status === 'open').length

const recentPayments = [...mockPayments]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 4)

const upcomingEvents = [...mockCalendarEvents].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)

const paymentStatusLabel: Record<(typeof mockPayments)[number]['status'], string> = {
  paid: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
}

const paymentStatusVariant: Record<(typeof mockPayments)[number]['status'], 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  failed: 'danger',
}

export function AdminDashboard() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Plaza overview at a glance." />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <Text variant="caption" className="text-slate-500">
            Units
          </Text>
          <Text variant="display" className="mt-1 text-slate-900">
            {totalUnits}
          </Text>
          <Text variant="bodySmall" className="mt-1 text-slate-500">
            {occupiedUnits} occupied · {vacantUnits} vacant
          </Text>
        </Card>
        <Card>
          <Text variant="caption" className="text-slate-500">
            Active tenants
          </Text>
          <Text variant="display" className="mt-1 text-slate-900">
            {mockTenants.filter((tenant) => tenant.status === 'active').length}
          </Text>
          <Text variant="bodySmall" className="mt-1 text-slate-500">
            of {mockTenants.length} total
          </Text>
        </Card>
        <Card>
          <Text variant="caption" className="text-slate-500">
            Rent overdue
          </Text>
          <Text variant="display" className="mt-1 text-danger">
            {overdueTenants}
          </Text>
          <Text variant="bodySmall" className="mt-1 text-slate-500">
            tenant{overdueTenants === 1 ? '' : 's'} behind on rent
          </Text>
        </Card>
        <Card>
          <Text variant="caption" className="text-slate-500">
            Open maintenance
          </Text>
          <Text variant="display" className="mt-1 text-slate-900">
            {openMaintenance}
          </Text>
          <Text variant="bodySmall" className="mt-1 text-slate-500">
            request{openMaintenance === 1 ? '' : 's'} awaiting action
          </Text>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <Text variant="h3">Recent payments</Text>
            <Link to="/admin/payments" className="text-[13px] font-medium text-primary hover:text-primary-light">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentPayments.map((payment) => (
              <Link
                key={payment.id}
                to={`/admin/payments/${payment.id}`}
                className="flex items-center justify-between rounded-button px-2 py-2 hover:bg-slate-200/40"
              >
                <div>
                  <Text variant="body" className="text-slate-900">
                    {payment.tenantName}
                  </Text>
                  <Text variant="caption" className="text-slate-500">
                    {payment.unitNumber} · {payment.date}
                  </Text>
                </div>
                <StatusBadge variant={paymentStatusVariant[payment.status]} label={paymentStatusLabel[payment.status]} />
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <Text variant="h3">Upcoming calendar</Text>
            <Link to="/admin/calendar" className="text-[13px] font-medium text-primary hover:text-primary-light">
              View calendar
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between px-2 py-2">
                <div>
                  <Text variant="body" className="text-slate-900">
                    {event.title}
                  </Text>
                  {event.relatedLabel ? (
                    <Text variant="caption" className="text-slate-500">
                      {event.relatedLabel}
                    </Text>
                  ) : null}
                </div>
                <Text variant="bodySmall" className="text-slate-500">
                  {event.date}
                </Text>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
