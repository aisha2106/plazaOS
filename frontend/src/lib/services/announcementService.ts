import { api } from '../api'

export const DEFAULT_PAGE_SIZE = 10

export interface Announcement {
  id: string
  title: string
  body: string
  important?: boolean
  createdAt: string
}

export const announcementService = {
  async list(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<{ data: Announcement[]; total: number }> {
    try {
      return await api.get(`/tenant/announcements?page=${page}&pageSize=${pageSize}`)
    } catch (err) {
      if (!import.meta.env.DEV) throw err
      const mock: Announcement[] = [
        { id: 'a1', title: 'Pool maintenance', body: 'Pool closed Monday for maintenance.', important: true, createdAt: '2026-07-10' },
      ]
      return { data: mock, total: mock.length }
    }
  },
}
