import { mockCalendarEvents } from '../data/mockData'
import type { CalendarEvent, CalendarEventType } from '../data/types'

export type SortDirection = 'asc' | 'desc'

export interface GetCalendarEventsParams {
  search?: string
  type?: 'all' | CalendarEventType
  dateFrom?: string
  dateTo?: string
  sortDir?: SortDirection
  page?: number
  pageSize?: number
}

export interface GetCalendarEventsResult {
  data: CalendarEvent[]
  total: number
  page: number
  pageSize: number
}

/**
 * The only function that reads/searches/filters/sorts/paginates the
 * calendar events collection — every other file gets events through this.
 * The signature mirrors a future
 * `GET /calendar?search=&type=&dateFrom=&dateTo=&sortDir=&page=&pageSize=`:
 * when the real backend exists, only this function's body changes (to an
 * api.get() call) — callers and the return shape stay the same.
 */
export function getCalendarEvents(params: GetCalendarEventsParams = {}): GetCalendarEventsResult {
  const { search = '', type = 'all', dateFrom = '', dateTo = '', sortDir = 'asc', page = 1, pageSize = 20 } = params

  let filtered = mockCalendarEvents

  const query = search.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter((event) => event.title.toLowerCase().includes(query))
  }
  if (type !== 'all') {
    filtered = filtered.filter((event) => event.type === type)
  }
  // CalendarEvent.date is stored as an ISO "YYYY-MM-DD" string, so it
  // compares lexicographically the same as chronologically.
  if (dateFrom) {
    filtered = filtered.filter((event) => event.date >= dateFrom)
  }
  if (dateTo) {
    filtered = filtered.filter((event) => event.date <= dateTo)
  }

  const sorted = [...filtered].sort((a, b) => {
    const comparison = a.date.localeCompare(b.date)
    return sortDir === 'asc' ? comparison : -comparison
  })

  const total = sorted.length
  const start = (page - 1) * pageSize

  return { data: sorted.slice(start, start + pageSize), total, page, pageSize }
}

export interface AddCalendarEventInput {
  title: string
  type: CalendarEventType
  date: string
  relatedLabel?: string
}

/** TODO: becomes `POST /calendar` once the backend is reachable — signature stays the same. */
export function addCalendarEvent(input: AddCalendarEventInput): CalendarEvent {
  const newEvent: CalendarEvent = {
    id: `event-${Date.now()}`,
    ...input,
  }
  mockCalendarEvents.push(newEvent)
  return newEvent
}
