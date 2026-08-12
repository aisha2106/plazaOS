import { mockPayments } from '../data/mockData'
import type { Payment, PaymentMethod, PaymentStatus } from '../data/types'

export type PaymentSortField = 'date' | 'tenantName' | 'amount'
export type SortDirection = 'asc' | 'desc'

export interface GetPaymentsParams {
  search?: string
  status?: 'all' | PaymentStatus
  method?: 'all' | PaymentMethod
  sortBy?: PaymentSortField
  sortDir?: SortDirection
  page?: number
  pageSize?: number
}

export interface GetPaymentsResult {
  data: Payment[]
  total: number
  page: number
  pageSize: number
}

function comparePayments(a: Payment, b: Payment, sortBy: PaymentSortField): number {
  switch (sortBy) {
    case 'tenantName':
      return a.tenantName.localeCompare(b.tenantName)
    case 'amount':
      return a.amount - b.amount
    case 'date':
    default:
      return a.date.localeCompare(b.date)
  }
}

/**
 * The only function that reads/searches/filters/sorts/paginates the payments
 * collection — every other file gets payments through this. The signature
 * mirrors a future `GET /payments?search=&status=&method=&sortBy=&sortDir=&page=&pageSize=`:
 * when the real backend exists, only this function's body changes (to an
 * api.get() call) — callers and the return shape stay the same.
 */
export function getPayments(params: GetPaymentsParams = {}): GetPaymentsResult {
  const { search = '', status = 'all', method = 'all', sortBy = 'date', sortDir = 'asc', page = 1, pageSize = 20 } = params

  let filtered = mockPayments

  const query = search.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter(
      (payment) => payment.tenantName.toLowerCase().includes(query) || payment.unitNumber.toLowerCase().includes(query),
    )
  }
  if (status !== 'all') {
    filtered = filtered.filter((payment) => payment.status === status)
  }
  if (method !== 'all') {
    filtered = filtered.filter((payment) => payment.method === method)
  }

  const sorted = [...filtered].sort((a, b) => {
    const comparison = comparePayments(a, b, sortBy)
    return sortDir === 'asc' ? comparison : -comparison
  })

  const total = sorted.length
  const start = (page - 1) * pageSize

  return { data: sorted.slice(start, start + pageSize), total, page, pageSize }
}
