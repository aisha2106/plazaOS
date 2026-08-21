import { useQuery } from '@tanstack/react-query'
import { calendarService } from '../lib/services/calendarService'
import type { CalendarEvent } from '../lib/services/calendarService'

export function useCalendar() {
  return useQuery<CalendarEvent[]>({
    queryKey: ['calendar'],
    queryFn: () => calendarService.list(),
  })
}
