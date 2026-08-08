import { api } from '../api'

export type MaintenanceStatus = 'open' | 'in_progress' | 'closed'

export interface MaintenanceRequest {
  id: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  category?: string
  status: MaintenanceStatus
  createdAt: string
  images?: string[]
}

export const maintenanceService = {
  async list(page = 1, pageSize = 10): Promise<{ data: MaintenanceRequest[]; total: number }> {
    try {
      return await api.get(`/tenant/maintenance?page=${page}&pageSize=${pageSize}`)
    } catch {
      const mock: MaintenanceRequest[] = [
        {
          id: 'm1',
          title: 'Leaky faucet',
          description: 'Faucet in kitchen leaking intermittently.',
          priority: 'medium',
          category: 'plumbing',
          status: 'in_progress',
          createdAt: '2026-07-12',
        },
      ]
      return { data: mock, total: mock.length }
    }
  },

  async create(payload: Partial<MaintenanceRequest>) {
    try {
      return await api.post('/tenant/maintenance', payload)
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, id: 'm-new' }), 500))
    }
  },
}
