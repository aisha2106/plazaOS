import { mockTenants } from '../data/mockData'
import type { AccountStatus, RentStatus, Tenant } from '../data/types'

export type TenantSortField = 'name' | 'unitNumber' | 'leaseEnd' | 'rentStatus'
export type SortDirection = 'asc' | 'desc'

export interface GetTenantsParams {
  search?: string
  rentStatus?: 'all' | RentStatus
  accountStatus?: 'all' | AccountStatus
  sortBy?: TenantSortField
  sortDir?: SortDirection
  page?: number
  pageSize?: number
}

export interface GetTenantsResult {
  data: Tenant[]
  total: number
  page: number
  pageSize: number
}

function compareTenants(a: Tenant, b: Tenant, sortBy: TenantSortField): number {
  switch (sortBy) {
    case 'unitNumber':
      return a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true })
    case 'leaseEnd':
      return a.leaseEnd.localeCompare(b.leaseEnd)
    case 'rentStatus':
      return a.rentStatus.localeCompare(b.rentStatus)
    case 'name':
    default:
      return a.name.localeCompare(b.name)
  }
}

/**
 * The only function that reads/searches/filters/sorts/paginates the tenants
 * collection — every other file gets tenants through this. The signature
 * mirrors a future `GET /tenants?search=&rentStatus=&accountStatus=&sortBy=&sortDir=&page=&pageSize=`:
 * when the real backend exists, only this function's body changes (to an
 * api.get() call) — callers and the return shape stay the same.
 */
export function getTenants(params: GetTenantsParams = {}): GetTenantsResult {
  const {
    search = '',
    rentStatus = 'all',
    accountStatus = 'all',
    sortBy = 'name',
    sortDir = 'asc',
    page = 1,
    pageSize = 20,
  } = params

  let filtered = mockTenants

  const query = search.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter(
      (tenant) => tenant.name.toLowerCase().includes(query) || tenant.email.toLowerCase().includes(query),
    )
  }
  if (rentStatus !== 'all') {
    filtered = filtered.filter((tenant) => tenant.rentStatus === rentStatus)
  }
  if (accountStatus !== 'all') {
    filtered = filtered.filter((tenant) => tenant.accountStatus === accountStatus)
  }

  const sorted = [...filtered].sort((a, b) => {
    const comparison = compareTenants(a, b, sortBy)
    return sortDir === 'asc' ? comparison : -comparison
  })

  const total = sorted.length
  const start = (page - 1) * pageSize

  return { data: sorted.slice(start, start + pageSize), total, page, pageSize }
}

/** TODO: becomes `GET /tenants/:tenantId` once the backend is reachable — signature stays the same. */
export function getTenant(tenantId: string): Tenant | undefined {
  return mockTenants.find((tenant) => tenant.id === tenantId)
}

export interface AddTenantInput {
  name: string
  email: string
  phone: string
  unitId: string
  unitNumber: string
  leaseStart: string
  leaseEnd: string
  monthlyRent: number
}

/**
 * TODO: becomes `POST /tenants` once the backend is reachable — signature
 * stays the same. New accounts always start on a temporary password.
 */
export function addTenant(input: AddTenantInput): Tenant {
  const newTenant: Tenant = {
    id: `tenant-${Date.now()}`,
    ...input,
    rentStatus: 'due',
    status: 'active',
    accountStatus: 'temporary',
    mustChangePassword: true,
  }
  mockTenants.push(newTenant)
  return newTenant
}

export interface UpdateTenantInput {
  leaseEnd?: string
  monthlyRent?: number
  rentStatus?: RentStatus
  accountStatus?: AccountStatus
  mustChangePassword?: boolean
}

/** TODO: becomes `PATCH /tenants/:tenantId` once the backend is reachable — signature stays the same. */
export function updateTenant(tenantId: string, updates: UpdateTenantInput): Tenant | undefined {
  const tenant = mockTenants.find((existing) => existing.id === tenantId)
  if (!tenant) return undefined
  Object.assign(tenant, updates)
  return tenant
}

const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789' // omits 0/O/1/l/I to avoid ambiguity

/**
 * TODO: the real backend must generate this (and hash it before storing)
 * server-side — this client-side version exists only so the mock UI has
 * something to display.
 */
export function generateTempPassword(length = 8): string {
  let password = ''
  for (let i = 0; i < length; i += 1) {
    password += TEMP_PASSWORD_CHARS[Math.floor(Math.random() * TEMP_PASSWORD_CHARS.length)]
  }
  return password
}
