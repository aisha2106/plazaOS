import { Button, Card, Text } from '../../components'
import { useNotifications } from '../../hooks/useNotifications'
import { useMemo } from 'react'
import type { NotificationItem } from '../../lib/services/notificationService'

function groupByDate(items: NotificationItem[]) {
  const groups: Record<string, NotificationItem[]> = {}
  for (const it of items) {
    const date = new Date(it.date).toDateString()
    groups[date] = groups[date] || []
    groups[date].push(it)
  }
  return groups
}

export function Notifications() {
  const { data, isLoading, isError, markRead, markAll, refetch } = useNotifications()
  const grouped = useMemo(() => groupByDate(data ?? []), [data])

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Text variant="h1">Notifications</Text>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => markAll.mutate()}>Mark all read</Button>
        </div>
      </div>
      <Card>
        {isLoading ? (
          <Text variant="body">Loading…</Text>
        ) : isError ? (
          <div className="flex items-center justify-between">
            <Text variant="bodySmall" className="text-danger">Failed to load notifications.</Text>
            <div>
              <Button variant="secondary" onClick={() => refetch()}>Retry</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(grouped).length === 0 ? (
              <Text variant="bodySmall">No notifications</Text>
            ) : (
              Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  <Text variant="caption">{date}</Text>
                  <div className="mt-2 space-y-2">
                    {items.map((n) => (
                      <div key={n.id} className={`flex flex-col gap-2 rounded border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between ${n.read ? 'opacity-60' : ''}`}>
                        <div className="min-w-0">
                          <Text variant="body" className="truncate">{n.title}</Text>
                          <Text variant="bodySmall" className="text-slate-500">{n.type}</Text>
                        </div>
                        {!n.read ? (
                          <Button variant="secondary" onClick={() => markRead.mutate(n.id)}>Mark read</Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
