import { api } from '../../../lib/api'
import { mockAnnouncements } from '../data/mockData'
import type { Announcement, AnnouncementAudience } from '../data/types'

export interface GetAnnouncementsParams {
  page?: number
  pageSize?: number
}

export interface GetAnnouncementsResult {
  data: Announcement[]
  total: number
  page: number
  pageSize: number
}

/** `GET /announcements` — falls back to the mock dataset in dev if unreachable. */
export async function getAnnouncements(params: GetAnnouncementsParams = {}): Promise<GetAnnouncementsResult> {
  const { page = 1, pageSize = 20 } = params
  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('pageSize', String(pageSize))

  try {
    return await api.get<GetAnnouncementsResult>(`/announcements?${query.toString()}`)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    const sorted = [...mockAnnouncements].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const total = sorted.length
    const start = (page - 1) * pageSize
    return { data: sorted.slice(start, start + pageSize), total, page, pageSize }
  }
}

export interface AddAnnouncementInput {
  title: string
  body: string
  audience: AnnouncementAudience
  audienceTenantIds?: string[]
}

/** `POST /announcements`. */
export async function addAnnouncement(input: AddAnnouncementInput): Promise<Announcement> {
  try {
    const result = await api.post<{ success: boolean; id: string; createdAt: string; author: string }>('/announcements', input)
    return {
      id: result.id,
      title: input.title,
      body: input.body,
      audience: input.audience,
      audienceTenantIds: input.audienceTenantIds ?? [],
      createdAt: result.createdAt,
      author: result.author,
    }
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    const newAnnouncement: Announcement = {
      id: `announce-${Date.now()}`,
      title: input.title,
      body: input.body,
      audience: input.audience,
      audienceTenantIds: input.audienceTenantIds ?? [],
      createdAt: new Date().toISOString().slice(0, 10),
      author: 'Admin',
    }
    mockAnnouncements.unshift(newAnnouncement)
    return newAnnouncement
  }
}
