// Shared helper for §3.2/§4's admin list-endpoint contract: always
// `{ data, total, page, pageSize }`, never a bare array — see
// BACKEND_BUILD_PLAN.md §4. A plaza's data volume is small enough that
// fetching the full filtered/sorted set and slicing in memory is fine (no
// need for Atlas Search or DB-level skip/limit for the cross-collection
// joins some of these endpoints need).
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export function paginate<T>(sorted: T[], page: number, pageSize: number): PaginatedResult<T> {
  const start = (page - 1) * pageSize
  return { data: sorted.slice(start, start + pageSize), total: sorted.length, page, pageSize }
}

export function parsePageParams(searchParams: URLSearchParams): { page: number; pageSize: number } {
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get('pageSize') ?? '20') || 20))
  return { page, pageSize }
}

// Escapes user-supplied search text before dropping it into a MongoDB $regex.
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
