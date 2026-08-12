import { api } from '../api'
import type { NotificationItem } from '../types'

export const notificationService = {
  async list(): Promise<NotificationItem[]> {
    return await api.get('/tenant/notifications')
  },

  async markRead(id: string) {
    return await api.post(`/tenant/notifications/${id}/read`)
  },

  async markAllRead() {
    return await api.post('/tenant/notifications/mark-all-read')
  },
}
