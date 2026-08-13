import { api } from '../../../lib/api'
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

// Mirrors GET /payments's own in-memory filter/sort/paginate logic — used
// only as a DEV-mode fallback (see getPayments()) when the backend isn't
// reachable.
function mockGetPayments(params: GetPaymentsParams): GetPaymentsResult {
  const { search = '', status = 'all', method = 'all', sortBy = 'date', sortDir = 'asc', page = 1, pageSize = 20 } = params

  let filtered = mockPayments
  const query = search.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter(
      (payment) => payment.tenantName.toLowerCase().includes(query) || payment.unitNumber.toLowerCase().includes(query),
    )
  }
  if (status !== 'all') filtered = filtered.filter((payment) => payment.status === status)
  if (method !== 'all') filtered = filtered.filter((payment) => payment.method === method)

  const sorted = [...filtered].sort((a, b) => {
    const comparison = comparePayments(a, b, sortBy)
    return sortDir === 'asc' ? comparison : -comparison
  })

  const total = sorted.length
  const start = (page - 1) * pageSize
  return { data: sorted.slice(start, start + pageSize), total, page, pageSize }
}

/**
 * The only function that reads/searches/filters/sorts/paginates the payments
 * collection — every other file gets payments through this. Calls
 * `GET /payments?search=&status=&method=&sortBy=&sortDir=&page=&pageSize=`;
 * falls back to the mock dataset in dev if the backend isn't reachable.
 */
export async function getPayments(params: GetPaymentsParams = {}): Promise<GetPaymentsResult> {
  const { search = '', status = 'all', method = 'all', sortBy = 'date', sortDir = 'asc', page = 1, pageSize = 20 } = params
  const query = new URLSearchParams()
  if (search) query.set('search', search)
  if (status !== 'all') query.set('status', status)
  if (method !== 'all') query.set('method', method)
  query.set('sortBy', sortBy)
  query.set('sortDir', sortDir)
  query.set('page', String(page))
  query.set('pageSize', String(pageSize))

  try {
    return await api.get<GetPaymentsResult>(`/payments?${query.toString()}`)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    return mockGetPayments(params)
  }
}

/** All payments for a single tenant (used by TenantDetail's payment history table). */
export async function getPaymentsByTenant(tenantId: string): Promise<Payment[]> {
  const { data } = await getPayments({ pageSize: 200 })
  return data.filter((payment) => payment.tenantId === tenantId)
}

/** `GET /payments/:paymentId`. */
export async function getPayment(paymentId: string): Promise<Payment | undefined> {
  try {
    return await api.get<Payment>(`/payments/${paymentId}`)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    return mockPayments.find((payment) => payment.id === paymentId)
  }
}

/** A tenant's outstanding (non-paid) rent charge — used to build the rent-charge picker in PaymentNew. */
export interface RentCharge {
  id: string
  tenantId: string
  amount: number
  dueDate: string
  status: 'due' | 'overdue'
}

/** `GET /rent-charges?tenantId=` — admin-only, lists a tenant's outstanding rent charges. */
export async function getRentChargesForTenant(tenantId: string): Promise<RentCharge[]> {
  const query = new URLSearchParams({ tenantId })
  return await api.get<RentCharge[]>(`/rent-charges?${query.toString()}`)
}

export interface AddPaymentInput {
  tenantId: string
  tenantName: string
  unitNumber: string
  rentChargeId: string
  amount: number
  date: string
  method: PaymentMethod
  status: PaymentStatus
  notes?: string
}

/** `POST /payments` — records an offline payment and settles the linked rent charge. */
export async function addPayment(input: AddPaymentInput): Promise<Payment> {
  try {
    const result = await api.post<{ success: boolean; id: string }>('/payments', input)
    return { id: result.id, receiptAvailable: input.status === 'paid', ...input }
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    const newPayment: Payment = { id: `payment-${Date.now()}`, receiptAvailable: input.status === 'paid', ...input }
    mockPayments.push(newPayment)
    return newPayment
  }
}

