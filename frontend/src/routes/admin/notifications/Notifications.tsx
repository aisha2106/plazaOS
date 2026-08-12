import { useMemo } from 'react'
import { Button, Card, StatusBadge, Text } from '../../../components'
import { PageHeader } from '../components/PageHeader'
import { useAdminNotifications } from '../../../hooks/useAdminNotifications'
import type { AdminNotificationItem, AdminNotificationType } from '../../../lib/services/adminNotificationService'

const typeLabel: Record<AdminNotificationType, string> = {
  payment: 'Payment',
  maintenance: 'Maintenance',
  announcement: 'Announcement',
  reminder: 'Reminder',
}

const typeVariant: Record<AdminNotificationType, 'success' | 'warning' | 'info' | 'danger'> = {
  payment: 'success',
  maintenance: 'warning',
  announcement: 'info',
  reminder: 'danger',
}

function groupByDate(items: AdminNotificationItem[]): Record<string, AdminNotificationItem[]> {
  const groups: Record<string, AdminNotificationItem[]> = {}
  for (const item of items) {
    const date = new Date(item.date).toDateString()
    groups[date] = groups[date] ?? []
    groups[date].push(item)
  }
  return groups
}

// TODO: fetch from GET /admin/notifications once the backend is reachable — see adminNotificationService.ts.
export function Notifications() {
  const { data, isLoading, isError, markRead, markAll, refetch } = useAdminNotifications()
  const grouped = useMemo(() => groupByDate(data ?? []), [data])

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="In-app notifications for admin-relevant events."
        action={
          <Button variant="secondary" onClick={() => markAll.mutate()}>
            Mark all read
          </Button>
        }
      />
      <Card>
        {isLoading ? (
          <Text variant="body">Loading…</Text>
        ) : isError ? (
          <div className="flex items-center justify-between">
            <Text variant="bodySmall" className="text-danger">
              Failed to load notifications.
            </Text>
            <Button variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <Text variant="bodySmall">No notifications</Text>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <Text variant="caption">{date}</Text>
                <div className="mt-2 space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex flex-col gap-2 rounded border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between ${
                        item.read ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Text variant="body" className="truncate">
                            {item.title}
                          </Text>
                          <StatusBadge variant={typeVariant[item.type]} label={typeLabel[item.type]} />
                        </div>
                        {item.body ? (
                          <Text variant="bodySmall" className="text-slate-500">
                            {item.body}
                          </Text>
                        ) : null}
                      </div>
                      {!item.read ? (
                        <Button variant="secondary" onClick={() => markRead.mutate(item.id)}>
                          Mark read
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
