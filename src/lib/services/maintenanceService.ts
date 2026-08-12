import { api } from '../api'
import type { PaginatedResponse, MaintenanceRequest } from '../types'

export const maintenanceService = {
  async list(page = 1, pageSize = 10): Promise<PaginatedResponse<MaintenanceRequest>> {
    return await api.get(`/tenant/maintenance?page=${page}&pageSize=${pageSize}`)
  },

  async create(payload: Partial<MaintenanceRequest>) {
    return await api.post('/tenant/maintenance', payload)
  },
}
