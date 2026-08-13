import { api } from '../../../lib/api'
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

// Mirrors GET /maintenance's own in-memory filter/sort/paginate logic — used
// only as a DEV-mode fallback (see getMaintenanceRequests()) when the
// backend isn't reachable.
function mockGetMaintenanceRequests(params: GetMaintenanceRequestsParams): GetMaintenanceRequestsResult {
  const { search = '', status = 'all', priority = 'all', sortBy = 'createdAt', sortDir = 'asc', page = 1, pageSize = 20 } = params

  let filtered = mockMaintenanceRequests
  const query = search.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter(
      (request) => request.title.toLowerCase().includes(query) || request.tenantName.toLowerCase().includes(query),
    )
  }
  if (status !== 'all') filtered = filtered.filter((request) => request.status === status)
  if (priority !== 'all') filtered = filtered.filter((request) => request.priority === priority)

  const sorted = [...filtered].sort((a, b) => {
    const comparison = compareMaintenanceRequests(a, b, sortBy)
    return sortDir === 'asc' ? comparison : -comparison
  })

  const total = sorted.length
  const start = (page - 1) * pageSize
  return { data: sorted.slice(start, start + pageSize), total, page, pageSize }
}

/**
 * The only function that reads/searches/filters/sorts/paginates the
 * maintenance requests collection — every other file gets requests through
 * this. Calls `GET /maintenance?search=&status=&priority=&sortBy=&sortDir=&page=&pageSize=`;
 * falls back to the mock dataset in dev if the backend isn't reachable.
 */
export async function getMaintenanceRequests(params: GetMaintenanceRequestsParams = {}): Promise<GetMaintenanceRequestsResult> {
  const { search = '', status = 'all', priority = 'all', sortBy = 'createdAt', sortDir = 'asc', page = 1, pageSize = 20 } = params
  const query = new URLSearchParams()
  if (search) query.set('search', search)
  if (status !== 'all') query.set('status', status)
  if (priority !== 'all') query.set('priority', priority)
  query.set('sortBy', sortBy)
  query.set('sortDir', sortDir)
  query.set('page', String(page))
  query.set('pageSize', String(pageSize))

  try {
    return await api.get<GetMaintenanceRequestsResult>(`/maintenance?${query.toString()}`)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    return mockGetMaintenanceRequests(params)
  }
}

/** All requests for a single tenant (used by TenantDetail's request list). */
export async function getMaintenanceRequestsByTenant(tenantId: string): Promise<MaintenanceRequest[]> {
  const { data } = await getMaintenanceRequests({ pageSize: 200 })
  return data.filter((request) => request.tenantId === tenantId)
}

/** `GET /maintenance/:requestId`. */
export async function getMaintenanceRequest(requestId: string): Promise<MaintenanceRequest | undefined> {
  try {
    return await api.get<MaintenanceRequest>(`/maintenance/${requestId}`)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    return mockMaintenanceRequests.find((request) => request.id === requestId)
  }
}

export interface UpdateMaintenanceRequestInput {
  status?: MaintenanceStatus
  priority?: MaintenancePriority
  notes?: string
  resolvedAt?: string | null
}

/** `PATCH /maintenance/:requestId`. */
export async function updateMaintenanceRequest(
  requestId: string,
  updates: UpdateMaintenanceRequestInput,
): Promise<MaintenanceRequest | undefined> {
  try {
    return await api.patch<MaintenanceRequest>(`/maintenance/${requestId}`, updates)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    const request = mockMaintenanceRequests.find((existing) => existing.id === requestId)
    if (!request) return undefined
    Object.assign(request, updates)
    return request
  }
}

