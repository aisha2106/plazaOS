import { api } from '../../../lib/api'
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

// Mirrors GET /calendar's own in-memory filter/sort/paginate logic — used
// only as a DEV-mode fallback (see getCalendarEvents()) when the backend
// isn't reachable.
function mockGetCalendarEvents(params: GetCalendarEventsParams): GetCalendarEventsResult {
  const { search = '', type = 'all', dateFrom = '', dateTo = '', sortDir = 'asc', page = 1, pageSize = 20 } = params

  let filtered = mockCalendarEvents
  const query = search.trim().toLowerCase()
  if (query) filtered = filtered.filter((event) => event.title.toLowerCase().includes(query))
  if (type !== 'all') filtered = filtered.filter((event) => event.type === type)
  // CalendarEvent.date is stored as an ISO "YYYY-MM-DD" string, so it
  // compares lexicographically the same as chronologically.
  if (dateFrom) filtered = filtered.filter((event) => event.date >= dateFrom)
  if (dateTo) filtered = filtered.filter((event) => event.date <= dateTo)

  const sorted = [...filtered].sort((a, b) => {
    const comparison = a.date.localeCompare(b.date)
    return sortDir === 'asc' ? comparison : -comparison
  })

  const total = sorted.length
  const start = (page - 1) * pageSize
  return { data: sorted.slice(start, start + pageSize), total, page, pageSize }
}

/**
 * The only function that reads/searches/filters/sorts/paginates the
 * calendar events collection — every other file gets events through this.
 * Calls `GET /calendar?search=&type=&dateFrom=&dateTo=&sortDir=&page=&pageSize=`;
 * falls back to the mock dataset in dev if the backend isn't reachable.
 */
export async function getCalendarEvents(params: GetCalendarEventsParams = {}): Promise<GetCalendarEventsResult> {
  const { search = '', type = 'all', dateFrom = '', dateTo = '', sortDir = 'asc', page = 1, pageSize = 20 } = params
  const query = new URLSearchParams()
  if (search) query.set('search', search)
  if (type !== 'all') query.set('type', type)
  if (dateFrom) query.set('dateFrom', dateFrom)
  if (dateTo) query.set('dateTo', dateTo)
  query.set('sortDir', sortDir)
  query.set('page', String(page))
  query.set('pageSize', String(pageSize))

  try {
    return await api.get<GetCalendarEventsResult>(`/calendar?${query.toString()}`)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    return mockGetCalendarEvents(params)
  }
}

export interface AddCalendarEventInput {
  title: string
  type: CalendarEventType
  date: string
  relatedLabel?: string
}

/** `POST /calendar`. */
export async function addCalendarEvent(input: AddCalendarEventInput): Promise<CalendarEvent> {
  try {
    const result = await api.post<{ success: boolean; id: string }>('/calendar', input)
    return { id: result.id, ...input }
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    const newEvent: CalendarEvent = { id: `event-${Date.now()}`, ...input }
    mockCalendarEvents.push(newEvent)
    return newEvent
  }
}

