import { api } from '../api'
import type { MaintenanceStatus } from '../types'

export type { MaintenanceStatus }

export const DEFAULT_PAGE_SIZE = 10

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
  async list(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<{ data: MaintenanceRequest[]; total: number }> {
    try {
      return await api.get(`/tenant/maintenance?page=${page}&pageSize=${pageSize}`)
    } catch (err) {
      if (!import.meta.env.DEV) throw err
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

  async create(payload: { title: string; description?: string; priority?: string; category?: string; images?: File[] }) {
    const form = new FormData()
    form.append('title', payload.title)
    if (payload.description !== undefined) form.append('description', payload.description)
    if (payload.priority !== undefined) form.append('priority', payload.priority)
    if (payload.category !== undefined) form.append('category', payload.category)
    for (const file of payload.images ?? []) form.append('images', file)

    try {
      return await api.post('/tenant/maintenance', form)
    } catch (err) {
      if (!import.meta.env.DEV) throw err
      return new Promise((res) => setTimeout(() => res({ success: true, id: 'm-new' }), 500))
    }
  },
}
