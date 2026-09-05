import { mockMaintenanceRequests } from '../data/mockData'
import type { MaintenancePriority, MaintenanceRequest, MaintenanceStatus } from '../data/types'

export type MaintenanceSortField = 'createdAt' | 'priority' | 'status'
export type SortDirection = 'asc' | 'desc'

export interface GetMaintenanceRequestsParams {
  search?: string
  status?: 'all' | MaintenanceStatus
  priority?: 'all' | MaintenancePriority
  sortBy?: MaintenanceSortField
  sortDir?: SortDirection
  page?: number
  pageSize?: number
}

export interface GetMaintenanceRequestsResult {
  data: MaintenanceRequest[]
  total: number
  page: number
  pageSize: number
}

const priorityRank: Record<MaintenancePriority, number> = { low: 0, medium: 1, high: 2 }
const statusRank: Record<MaintenanceStatus, number> = { open: 0, in_progress: 1, resolved: 2 }

function compareMaintenanceRequests(a: MaintenanceRequest, b: MaintenanceRequest, sortBy: MaintenanceSortField): number {
  switch (sortBy) {
    case 'priority':
      return priorityRank[a.priority] - priorityRank[b.priority]
    case 'status':
      return statusRank[a.status] - statusRank[b.status]
    case 'createdAt':
    default:
      return a.createdAt.localeCompare(b.createdAt)
  }
}

/**
 * The only function that reads/searches/filters/sorts/paginates the
 * maintenance requests collection — every other file gets requests through
 * this. The signature mirrors a future
 * `GET /maintenance?search=&status=&priority=&sortBy=&sortDir=&page=&pageSize=`:
 * when the real backend exists, only this function's body changes (to an
 * api.get() call) — callers and the return shape stay the same.
 */
export function getMaintenanceRequests(params: GetMaintenanceRequestsParams = {}): GetMaintenanceRequestsResult {
  const { search = '', status = 'all', priority = 'all', sortBy = 'createdAt', sortDir = 'asc', page = 1, pageSize = 20 } = params

  let filtered = mockMaintenanceRequests

  const query = search.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter(
      (request) => request.title.toLowerCase().includes(query) || request.tenantName.toLowerCase().includes(query),
    )
  }
  if (status !== 'all') {
    filtered = filtered.filter((request) => request.status === status)
  }
  if (priority !== 'all') {
    filtered = filtered.filter((request) => request.priority === priority)
  }

  const sorted = [...filtered].sort((a, b) => {
    const comparison = compareMaintenanceRequests(a, b, sortBy)
    return sortDir === 'asc' ? comparison : -comparison
  })

  const total = sorted.length
  const start = (page - 1) * pageSize

  return { data: sorted.slice(start, start + pageSize), total, page, pageSize }
}

/** TODO: becomes `GET /maintenance/:requestId` once the backend is reachable — signature stays the same. */
export function getMaintenanceRequest(requestId: string): MaintenanceRequest | undefined {
  return mockMaintenanceRequests.find((request) => request.id === requestId)
}

export interface UpdateMaintenanceRequestInput {
  status?: MaintenanceStatus
  priority?: MaintenancePriority
  notes?: string
  resolvedAt?: string | null
}

/** TODO: becomes `PATCH /maintenance/:requestId` once the backend is reachable — signature stays the same. */
export function updateMaintenanceRequest(requestId: string, updates: UpdateMaintenanceRequestInput): MaintenanceRequest | undefined {
  const request = mockMaintenanceRequests.find((existing) => existing.id === requestId)
  if (!request) return undefined
  Object.assign(request, updates)
  return request
}
