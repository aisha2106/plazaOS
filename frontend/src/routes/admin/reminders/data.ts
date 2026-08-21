import { api } from '../../../lib/api'
import { mockReminders } from '../data/mockData'
import type { Reminder, ReminderStatus, ReminderTarget, ReminderType } from '../data/types'

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

// Mirrors GET /reminders's own in-memory filter/sort/paginate logic — used
// only as a DEV-mode fallback (see getReminders()) when the backend isn't
// reachable.
function mockGetReminders(params: GetRemindersParams): GetRemindersResult {
  const { search = '', status = 'all', type = 'all', sortBy = 'scheduledFor', sortDir = 'asc', page = 1, pageSize = 20 } = params

  let filtered = mockReminders
  const query = search.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter(
      (reminder) => reminder.title.toLowerCase().includes(query) || reminder.targetLabel.toLowerCase().includes(query),
    )
  }
  if (status !== 'all') filtered = filtered.filter((reminder) => reminder.status === status)
  if (type !== 'all') filtered = filtered.filter((reminder) => reminder.type === type)

  const sorted = [...filtered].sort((a, b) => {
    const comparison = compareReminders(a, b, sortBy)
    return sortDir === 'asc' ? comparison : -comparison
  })

  const total = sorted.length
  const start = (page - 1) * pageSize
  return { data: sorted.slice(start, start + pageSize), total, page, pageSize }
}

/**
 * The only function that reads/searches/filters/sorts/paginates the
 * reminders collection — every other file gets reminders through this.
 * Calls `GET /reminders?search=&status=&type=&sortBy=&sortDir=&page=&pageSize=`;
 * falls back to the mock dataset in dev if the backend isn't reachable.
 */
export async function getReminders(params: GetRemindersParams = {}): Promise<GetRemindersResult> {
  const { search = '', status = 'all', type = 'all', sortBy = 'scheduledFor', sortDir = 'asc', page = 1, pageSize = 20 } = params
  const query = new URLSearchParams()
  if (search) query.set('search', search)
  if (status !== 'all') query.set('status', status)
  if (type !== 'all') query.set('type', type)
  query.set('sortBy', sortBy)
  query.set('sortDir', sortDir)
  query.set('page', String(page))
  query.set('pageSize', String(pageSize))

  try {
    return await api.get<GetRemindersResult>(`/reminders?${query.toString()}`)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    return mockGetReminders(params)
  }
}

/** `GET /reminders/:reminderId`. */
export async function getReminder(reminderId: string): Promise<Reminder | undefined> {
  try {
    return await api.get<Reminder>(`/reminders/${reminderId}`)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    return mockReminders.find((reminder) => reminder.id === reminderId)
  }
}

export interface AddReminderInput {
  title: string
  message: string
  scheduledFor: string
  target: ReminderTarget
  tenantId?: string
  groupTenantIds?: string[]
}

/** `POST /reminders` — always creates a `type: 'manual'` reminder server-side. */
export async function addReminder(input: AddReminderInput): Promise<Reminder> {
  try {
    const result = await api.post<{ success: boolean; id: string; targetLabel: string }>('/reminders', input)
    return {
      id: result.id,
      title: input.title,
      message: input.message,
      scheduledFor: input.scheduledFor,
      type: 'manual',
      target: input.target,
      status: 'scheduled',
      targetLabel: result.targetLabel,
    }
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    const newReminder: Reminder = {
      id: `reminder-${Date.now()}`,
      title: input.title,
      message: input.message,
      scheduledFor: input.scheduledFor,
      type: 'manual',
      target: input.target,
      status: 'scheduled',
      targetLabel:
        input.target === 'everyone' ? 'All tenants' : input.target === 'group' ? `${input.groupTenantIds?.length ?? 0} tenants` : 'Tenant',
    }
    mockReminders.push(newReminder)
    return newReminder
  }
}

