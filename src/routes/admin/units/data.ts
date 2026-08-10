import { mockUnits } from '../data/mockData'
import type { Unit, UnitStatus } from '../data/types'

export type UnitSortField = 'unitNumber' | 'floor' | 'sizeSqft' | 'monthlyRent' | 'status'
export type SortDirection = 'asc' | 'desc'

export interface GetUnitsParams {
  search?: string
  status?: 'all' | UnitStatus
  // Unit.floor is stored as a string (mock floors are "1", "2", "3"), so the
  // filter value matches that rather than a number.
  floor?: 'all' | string
  sortBy?: UnitSortField
  sortDir?: SortDirection
  page?: number
  pageSize?: number
}

export interface GetUnitsResult {
  data: Unit[]
  total: number
  page: number
  pageSize: number
}

function compareUnits(a: Unit, b: Unit, sortBy: UnitSortField): number {
  switch (sortBy) {
    case 'sizeSqft':
      return a.sizeSqft - b.sizeSqft
    case 'monthlyRent':
      return a.monthlyRent - b.monthlyRent
    case 'floor':
      return a.floor.localeCompare(b.floor, undefined, { numeric: true })
    case 'status':
      return a.status.localeCompare(b.status)
    case 'unitNumber':
    default:
      return a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true })
  }
}

/**
 * The only function that reads/searches/filters/sorts/paginates the units
 * collection — every other file gets units through this. The signature
 * mirrors a future `GET /units?search=&status=&floor=&sortBy=&sortDir=&page=&pageSize=`:
 * when the real backend exists, only this function's body changes (to an
 * api.get() call) — callers and the return shape stay the same.
 */
export function getUnits(params: GetUnitsParams = {}): GetUnitsResult {
  const { search = '', status = 'all', floor = 'all', sortBy = 'unitNumber', sortDir = 'asc', page = 1, pageSize = 20 } = params

  let filtered = mockUnits

  const query = search.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter((unit) => unit.unitNumber.toLowerCase().includes(query))
  }
  if (status !== 'all') {
    filtered = filtered.filter((unit) => unit.status === status)
  }
  if (floor !== 'all') {
    filtered = filtered.filter((unit) => unit.floor === floor)
  }

  const sorted = [...filtered].sort((a, b) => {
    const comparison = compareUnits(a, b, sortBy)
    return sortDir === 'asc' ? comparison : -comparison
  })

  const total = sorted.length
  const start = (page - 1) * pageSize

  return { data: sorted.slice(start, start + pageSize), total, page, pageSize }
}

/** All distinct floor values currently in the collection, for the floor filter. */
export function getAvailableFloors(): string[] {
  const floors = new Set(mockUnits.map((unit) => unit.floor))
  return Array.from(floors).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

/** TODO: becomes `GET /units/:unitId` once the backend is reachable — signature stays the same. */
export function getUnit(unitId: string): Unit | undefined {
  return mockUnits.find((unit) => unit.id === unitId)
}

export interface AddUnitInput {
  unitNumber: string
  floor: string
  sizeSqft: number
  monthlyRent: number
  status: UnitStatus
}

/** TODO: becomes `POST /units` once the backend is reachable — signature stays the same. */
export function addUnit(input: AddUnitInput): Unit {
  const newUnit: Unit = {
    id: `unit-${Date.now()}`,
    ...input,
  }
  mockUnits.push(newUnit)
  return newUnit
}

export interface UpdateUnitInput {
  floor?: string
  sizeSqft?: number
  monthlyRent?: number
  status?: UnitStatus
  tenantId?: string
  tenantName?: string
}

/** TODO: becomes `PATCH /units/:unitId` once the backend is reachable — signature stays the same. */
export function updateUnit(unitId: string, updates: UpdateUnitInput): Unit | undefined {
  const unit = mockUnits.find((existing) => existing.id === unitId)
  if (!unit) return undefined
  Object.assign(unit, updates)
  return unit
}
