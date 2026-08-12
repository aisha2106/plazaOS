import { api } from '../api'
import type { PaginatedResponse, Payment } from '../types'

export const paymentService = {
  async list(page = 1, pageSize = 10): Promise<PaginatedResponse<Payment>> {
    return await api.get(`/tenant/payments?page=${page}&pageSize=${pageSize}`)
  },

  async get(id: string): Promise<Payment> {
    return await api.get(`/tenant/payments/${id}`)
  },

  async pay(amount: number): Promise<{ success: boolean; id?: string }> {
    return await api.post('/tenant/payments', { amount })
  },
}
