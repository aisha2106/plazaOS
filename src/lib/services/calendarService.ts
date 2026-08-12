import { api } from '../api'
import type { CalendarEvent } from '../types'

export const calendarService = {
  async list(): Promise<CalendarEvent[]> {
    return await api.get('/tenant/calendar')
  },
}
