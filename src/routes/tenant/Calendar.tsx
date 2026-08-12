import { Button, Card, Text } from '../../components'
import { useCalendar } from '../../hooks/useCalendar'

export function Calendar() {
  const { data, isLoading, isError, refetch } = useCalendar()

  return (
    <div className="px-4 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Text variant="h1">Calendar</Text>
      </div>

      <Card>
        {isLoading ? (
          <Text variant="body">Loading appointments…</Text>
        ) : isError ? (
          <div className="flex items-center justify-between gap-3">
            <Text variant="bodySmall" className="text-danger">Failed to load calendar events.</Text>
            <Button variant="secondary" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : data?.length === 0 ? (
          <Text variant="bodySmall">No calendar events available.</Text>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data?.map((event) => (
              <div key={event.id} className="rounded border border-slate-200 bg-slate-50 p-4">
                <Text variant="h3">{event.title}</Text>
                <Text variant="bodySmall" className="text-slate-500">
                  {event.date}{event.time ? ` · ${event.time}` : ''}
                </Text>
                {event.location ? <Text variant="bodySmall" className="mt-2">{event.location}</Text> : null}
                {event.notes ? <Text variant="bodySmall" className="mt-2 text-slate-600">{event.notes}</Text> : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
