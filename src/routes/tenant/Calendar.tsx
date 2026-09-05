import { Button, Card, Text } from '../../components'
import { useCalendar } from '../../hooks/useCalendar'
import { formatDate } from '../../lib/formatting'

export function Calendar() {
  const { data, isLoading, isError, refetch } = useCalendar()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Text variant="h1" className="mb-8">Calendar</Text>

      {isLoading ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Text variant="body" className="text-slate-500">Loading calendar events…</Text>
          </div>
        </Card>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <Text variant="bodySmall" className="text-danger font-medium">Failed to load calendar events.</Text>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>
          </div>
        </Card>
      ) : !data || data.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Text variant="h3" className="text-slate-400 mb-2">📅</Text>
            <Text variant="body" className="text-slate-600">No upcoming events</Text>
            <Text variant="bodySmall" className="mt-1 text-slate-500">Check back soon for scheduled appointments</Text>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((event) => (
            <Card key={event.id} className="flex flex-col transition-all hover:shadow-md">
              <div className="mb-3 flex items-start justify-between">
                <Text variant="h3" className="line-clamp-2 flex-1">{event.title}</Text>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                <span>📌</span>
                <Text variant="bodySmall">{formatDate(event.date)}</Text>
                {event.time && (
                  <>
                    <span>·</span>
                    <Text variant="bodySmall">{event.time}</Text>
                  </>
                )}
              </div>

              {event.location && (
                <div className="mb-2 flex items-start gap-2">
                  <span>📍</span>
                  <Text variant="bodySmall" className="text-slate-700">{event.location}</Text>
                </div>
              )}

              {event.notes && (
                <div className="mt-2 border-t border-slate-200 pt-3">
                  <Text variant="bodySmall" className="text-slate-600 leading-relaxed">{event.notes}</Text>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
