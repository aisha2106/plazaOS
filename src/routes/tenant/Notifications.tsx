import { Button, Card, Text, StatusBadge } from '../../components'
import { useNotifications } from '../../hooks/useNotifications'
import { useMemo } from 'react'
import { formatDate, formatDateTime } from '../../lib/formatting'
import type { NotificationItem, NotificationType } from '../../lib/types'

function groupByDate(items: NotificationItem[]) {
  const groups: Record<string, NotificationItem[]> = {}
  for (const it of items) {
    const date = new Date(it.date).toDateString()
    groups[date] = groups[date] || []
    groups[date].push(it)
  }
  return groups
}

const typeVariantMap: Record<NotificationType, 'success' | 'warning' | 'info' | 'danger'> = {
  payment: 'success',
  maintenance: 'info',
  announcement: 'info',
  appointment: 'warning',
}

export function Notifications() {
  const { data, isLoading, isError, markRead, markAll, refetch } = useNotifications()
  const grouped = useMemo(() => groupByDate(data ?? []), [data])
  const unreadCount = data?.filter(n => !n.read).length ?? 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text variant="h1">Notifications</Text>
          {unreadCount > 0 && (
            <Text variant="body" className="mt-2 text-slate-600">
              {unreadCount} unread
            </Text>
          )}
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            {markAll.isPending ? 'Marking…' : 'Mark all as read'}
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Text variant="body" className="text-slate-500">Loading notifications…</Text>
          </div>
        </Card>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <Text variant="bodySmall" className="text-danger font-medium">Failed to load notifications.</Text>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>
          </div>
        </Card>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Text variant="h3" className="text-slate-400 mb-2">📬</Text>
            <Text variant="body" className="text-slate-600">No notifications yet</Text>
            <Text variant="bodySmall" className="mt-1 text-slate-500">You'll see updates here when you receive messages</Text>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <Text variant="caption" className="mb-3 block text-slate-700 font-bold uppercase">
                {formatDate(date)}
              </Text>
              <div className="space-y-3">
                {items.map((n) => (
                  <Card key={n.id} className={`transition-all ${n.read ? 'bg-slate-50' : 'border-primary-light bg-indigo-50/50'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Text variant="body" className={`font-semibold ${n.read ? 'text-slate-600' : 'text-slate-900'}`}>
                            {n.title}
                          </Text>
                          {!n.read && (
                            <div className="flex-none">
                              <div className="h-2 w-2 rounded-full bg-primary"></div>
                            </div>
                          )}
                        </div>
                        {n.body && (
                          <Text variant="bodySmall" className="mt-2 text-slate-600 line-clamp-2">
                            {n.body}
                          </Text>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <StatusBadge variant={typeVariantMap[n.type]} label={n.type} />
                          <Text variant="caption" className="text-slate-500">
                            {formatDateTime(n.date)}
                          </Text>
                        </div>
                      </div>
                      {!n.read && (
                        <Button size="sm" variant="secondary" onClick={() => markRead.mutate(n.id)} disabled={markRead.isPending} className="flex-none">
                          Mark read
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(markRead.isError || markAll.isError) && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <Text variant="bodySmall" className="text-danger font-medium">Unable to update notifications. Please try again.</Text>
        </Card>
      )}
    </div>
  )
}
