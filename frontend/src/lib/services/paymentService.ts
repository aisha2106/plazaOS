import { api } from '../api'
import type { PaymentStatus } from '../types'

export type { PaymentStatus }

export const DEFAULT_PAGE_SIZE = 10

export interface Payment {
  id: string
  amount: number
  date: string
  method?: string
  status: PaymentStatus
  receiptUrl?: string
}

export const paymentService = {
  async list(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<{ data: Payment[]; total: number }>
  {
    try {
      return await api.get(`/tenant/payments?page=${page}&pageSize=${pageSize}`)
    } catch (err) {
      if (!import.meta.env.DEV) throw err
      const mock: Payment[] = [
        { id: 'p1', amount: 1200, date: '2026-07-01', status: 'paid', method: 'card' },
        { id: 'p2', amount: 1200, date: '2026-06-01', status: 'paid', method: 'card' },
        { id: 'p3', amount: 1200, date: '2026-05-01', status: 'failed', method: 'bank' },
      ]
      return { data: mock, total: mock.length }
    }
  },

  async get(id: string): Promise<Payment> {
    try {
      return await api.get(`/tenant/payments/${id}`)
    } catch (err) {
      if (!import.meta.env.DEV) throw err
      return { id, amount: 1200, date: '2026-07-01', status: 'paid', method: 'card' }
    }
  },

  async pay(rentChargeId: string): Promise<{ success: boolean; id?: string; checkoutUrl?: string }>
  {
    try {
      return await api.post('/tenant/payments', { rentChargeId })
    } catch (err) {
      if (!import.meta.env.DEV) throw err
      // DEV-only: simulate a successful payment when there's no backend to hit.
      return new Promise((res) => setTimeout(() => res({ success: true, id: 'p-new' }), 700))
    }
  },

  async verify(reference: string): Promise<{ id: string; status: PaymentStatus }> {
    return api.get(`/tenant/payments/verify?reference=${encodeURIComponent(reference)}`)
  },
}
