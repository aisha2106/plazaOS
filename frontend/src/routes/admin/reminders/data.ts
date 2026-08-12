import { mockReminders } from '../data/mockData'
import type { Reminder, ReminderStatus, ReminderType } from '../data/types'

export type ReminderSortField = 'scheduledFor' | 'title' | 'status'
export type SortDirection = 'asc' | 'desc'

export interface GetRemindersParams {
  search?: string
  status?: 'all' | ReminderStatus
  type?: 'all' | ReminderType
  sortBy?: ReminderSortField
  sortDir?: SortDirection
  page?: number
  pageSize?: number
}

export interface GetRemindersResult {
  data: Reminder[]
  total: number
  page: number
  pageSize: number
}

const statusRank: Record<ReminderStatus, number> = { scheduled: 0, sent: 1, failed: 2 }

function compareReminders(a: Reminder, b: Reminder, sortBy: ReminderSortField): number {
  switch (sortBy) {
    case 'title':
      return a.title.localeCompare(b.title)
    case 'status':
      return statusRank[a.status] - statusRank[b.status]
    case 'scheduledFor':
    default:
      return a.scheduledFor.localeCompare(b.scheduledFor)
  }
}

/**
 * The only function that reads/searches/filters/sorts/paginates the
 * reminders collection — every other file gets reminders through this. The
 * signature mirrors a future
 * `GET /reminders?search=&status=&type=&sortBy=&sortDir=&page=&pageSize=`:
 * when the real backend exists, only this function's body changes (to an
 * api.get() call) — callers and the return shape stay the same.
 */
export function getReminders(params: GetRemindersParams = {}): GetRemindersResult {
  const { search = '', status = 'all', type = 'all', sortBy = 'scheduledFor', sortDir = 'asc', page = 1, pageSize = 20 } = params

  let filtered = mockReminders

  const query = search.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter(
      (reminder) => reminder.title.toLowerCase().includes(query) || reminder.targetLabel.toLowerCase().includes(query),
    )
  }
  if (status !== 'all') {
    filtered = filtered.filter((reminder) => reminder.status === status)
  }
  if (type !== 'all') {
    filtered = filtered.filter((reminder) => reminder.type === type)
  }

  const sorted = [...filtered].sort((a, b) => {
    const comparison = compareReminders(a, b, sortBy)
    return sortDir === 'asc' ? comparison : -comparison
  })

  const total = sorted.length
  const start = (page - 1) * pageSize

  return { data: sorted.slice(start, start + pageSize), total, page, pageSize }
}
