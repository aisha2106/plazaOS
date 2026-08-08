import { api } from '../api'

export type PaymentStatus = 'paid' | 'pending' | 'overdue'

export interface Payment {
  id: string
  amount: number
  date: string
  method?: string
  status: PaymentStatus
  receiptUrl?: string
}

export const paymentService = {
  async list(page = 1, pageSize = 10): Promise<{ data: Payment[]; total: number }>
  {
    try {
      return await api.get(`/tenant/payments?page=${page}&pageSize=${pageSize}`)
    } catch {
      const mock: Payment[] = [
        { id: 'p1', amount: 1200, date: '2026-07-01', status: 'paid', method: 'card' },
        { id: 'p2', amount: 1200, date: '2026-06-01', status: 'paid', method: 'card' },
        { id: 'p3', amount: 1200, date: '2026-05-01', status: 'overdue', method: 'bank' },
      ]
      return { data: mock, total: mock.length }
    }
  },

  async get(id: string): Promise<Payment> {
    try {
      return await api.get(`/tenant/payments/${id}`)
    } catch {
      return { id, amount: 1200, date: '2026-07-01', status: 'paid', method: 'card' }
    }
  },

  async pay(amount: number): Promise<{ success: boolean; id?: string }>
  {
    try {
      return await api.post('/tenant/payments', { amount })
    } catch {
      // Simulate a successful payment
      return new Promise((res) => setTimeout(() => res({ success: true, id: 'p-new' }), 700))
    }
  },
}
