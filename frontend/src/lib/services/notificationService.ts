import { api } from '../api'

export type NotificationType = 'payment' | 'maintenance' | 'announcement' | 'appointment'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  body?: string
  date: string
  read: boolean
}

export const notificationService = {
  async list(): Promise<NotificationItem[]> {
    try {
      return await api.get('/tenant/notifications')
    } catch (err) {
      if (!import.meta.env.DEV) throw err
      return [
        { id: 'n1', type: 'payment', title: 'Payment received', body: 'Your payment was processed.', date: '2026-07-01', read: false },
        { id: 'n2', type: 'maintenance', title: 'Request update', body: 'Technician scheduled.', date: '2026-07-12', read: true },
      ]
    }
  },

  async markRead(id: string) {
    try {
      return await api.post(`/tenant/notifications/${id}/read`)
    } catch (err) {
      if (!import.meta.env.DEV) throw err
      return { success: true }
    }
  },

  async markAllRead() {
    try {
      return await api.post(`/tenant/notifications/mark-all-read`)
    } catch (err) {
      if (!import.meta.env.DEV) throw err
      return { success: true }
    }
  },
}
