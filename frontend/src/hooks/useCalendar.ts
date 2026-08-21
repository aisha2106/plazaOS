import { useQuery } from '@tanstack/react-query'
import { calendarService } from '../lib/services/calendarService'

export function useCalendar() {
  return useQuery({
    queryKey: ['calendar'],
    queryFn: () => calendarService.list(),
  })
}
