import { api } from '../api'
import type { PaginatedResponse, Announcement } from '../types'

export const announcementService = {
  async list(page = 1, pageSize = 10): Promise<PaginatedResponse<Announcement>> {
    return await api.get(`/tenant/announcements?page=${page}&pageSize=${pageSize}`)
  },
}
