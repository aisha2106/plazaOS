import { api } from '../api'

export type RentChargeStatus = 'upcoming' | 'due' | 'overdue' | 'paid'

export interface RentCharge {
  id: string
  period: string
  amount: number
  dueDate: string
  status: RentChargeStatus
}

export const rentChargeService = {
  async list(): Promise<{ data: RentCharge[] }> {
    try {
      return await api.get('/tenant/rent-charges')
    } catch (err) {
      if (!import.meta.env.DEV) throw err
      const mock: RentCharge[] = [
        { id: 'rc1', period: '2026-07', amount: 1200, dueDate: '2026-07-01', status: 'due' },
      ]
      return { data: mock }
    }
  },
}
