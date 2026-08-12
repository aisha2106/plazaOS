import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, StatusBadge, Table, Text } from '../../components'
import { useProfile } from '../../hooks/useProfile'
import { usePayments } from '../../hooks/usePayments'
import { useMaintenance } from '../../hooks/useMaintenance'
import { useAnnouncements } from '../../hooks/useAnnouncements'
import { useNotifications } from '../../hooks/useNotifications'
import type { Payment, Announcement, NotificationItem, MaintenanceRequest, MaintenanceStatus } from '../../lib/types'

const maintenanceStatusVariantMap: Record<MaintenanceStatus, 'info' | 'warning' | 'success'> = {
  open: 'info',
  in_progress: 'warning',
  closed: 'success',
}

export function TenantHome() {
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  const payments = usePayments()
  const maintenance = useMaintenance()
  const announcements = useAnnouncements()
  const notifications = useNotifications()

  const recentPayments = payments.data?.data.slice(0, 3) ?? []
  const recentMaintenance = maintenance.data?.data.slice(0, 3) ?? []
  const latestAnnouncements = announcements.data?.data.slice(0, 3) ?? []
  const notificationsList = notifications.data ?? []

  const paymentSummary = useMemo(() => {
    const rows: Payment[] = payments.data?.data ?? []
    const summary = { paid: 0, pending: 0, overdue: 0 }
    for (const p of rows) {
      summary[p.status] += 1
    }
    return summary
  }, [payments.data])

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text variant="h1">Welcome back, {profile?.name ?? 'Tenant'}</Text>
          <Text variant="body" className="mt-1 text-slate-500">
            {profile?.unit} · Lease: {profile?.leaseStart ?? '—'} to {profile?.leaseEnd ?? '—'}
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => navigate('/tenant/payments')}>Pay Rent</Button>
          <Button variant="secondary" onClick={() => navigate('/tenant/maintenance/new')}>
            Submit Maintenance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="h-full">
          <Text variant="h3">Rent summary</Text>
          <div className="mt-3 flex flex-col gap-2">
            {payments.isError ? (
              <div className="flex items-center justify-between">
                <Text variant="bodySmall" className="text-danger">Failed to load payments summary.</Text>
                <Button variant="secondary" onClick={() => payments.refetch()}>Retry</Button>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <Text variant="body">Monthly rent</Text>
              <Text variant="body">{profile?.monthlyRent != null ? `$${profile.monthlyRent}` : 'Unavailable'}</Text>
            </div>
            <div className="flex items-center justify-between">
              <Text variant="body">Next due</Text>
              <Text variant="body">{profile?.nextDueDate ?? 'Unavailable'}</Text>
            </div>
            <div className="flex items-center justify-between">
              <Text variant="body">Balance</Text>
              <Text variant="body">{profile?.balance != null ? `$${profile.balance}` : 'Unavailable'}</Text>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <Text variant="caption">Paid</Text>
                <Text variant="h3">{paymentSummary.paid}</Text>
              </div>
              <div>
                <Text variant="caption">Pending</Text>
                <Text variant="h3">{paymentSummary.pending}</Text>
              </div>
              <div>
                <Text variant="caption">Overdue</Text>
                <Text variant="h3">{paymentSummary.overdue}</Text>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <Text variant="h3">Recent payments</Text>
          <div className="mt-3">
            {payments.isError ? (
              <div className="flex items-center justify-between">
                <Text variant="bodySmall" className="text-danger">Failed to load recent payments.</Text>
                <Button variant="secondary" onClick={() => payments.refetch()}>Retry</Button>
              </div>
            ) : (
              <Table<Payment>
                columns={[{ key: 'date', header: 'Date' }, { key: 'amount', header: 'Amount' }]}
                data={recentPayments}
                getRowKey={(r) => r.id}
              />
            )}
          </div>
        </Card>

        <Card>
          <Text variant="h3">Recent maintenance</Text>
          <div className="mt-3">
            {maintenance.isError ? (
              <div className="flex items-center justify-between">
                <Text variant="bodySmall" className="text-danger">Failed to load maintenance.</Text>
                <Button variant="secondary" onClick={() => maintenance.refetch()}>Retry</Button>
              </div>
            ) : (
              <Table<MaintenanceRequest>
                columns={[
                  { key: 'title', header: 'Title' },
                  { key: 'status', header: 'Status', render: (request) => <StatusBadge variant={maintenanceStatusVariantMap[request.status]} label={request.status} /> },
                ]}
                data={recentMaintenance}
                getRowKey={(r) => r.id}
              />
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="h-full">
          <Text variant="h3">Announcements</Text>
          <div className="mt-3 space-y-3">
            {announcements.isError ? (
              <div className="flex items-center justify-between">
                <Text variant="bodySmall" className="text-danger">Failed to load announcements.</Text>
                <Button variant="secondary" onClick={() => announcements.refetch()}>Retry</Button>
              </div>
            ) : (
              latestAnnouncements.map((a: Announcement) => (
                <div key={a.id} className="flex flex-col gap-3 rounded border border-slate-200 p-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Text variant="h3" className="truncate">{a.title}</Text>
                    <Text variant="bodySmall" className="mt-1 text-slate-500">
                      {a.body}
                    </Text>
                  </div>
                  {a.important ? <StatusBadge variant="warning" label="Important" /> : null}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="h-full">
          <Text variant="h3">Notifications</Text>
          <div className="mt-3 space-y-3">
            {notificationsList.slice(0, 5).map((n: NotificationItem) => (
              <div key={n.id} className={`flex flex-col gap-2 rounded border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between ${n.read ? 'opacity-60' : ''}`}>
                <div className="min-w-0">
                  <Text variant="body" className="truncate">{n.title}</Text>
                  <Text variant="bodySmall" className="text-slate-500">{n.date}</Text>
                </div>
                <div className="text-xs text-slate-500">{n.type}</div>
              </div>
            ))}
            {notificationsList.length === 0 ? (
              <Text variant="bodySmall" className="text-slate-500">No notifications</Text>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
