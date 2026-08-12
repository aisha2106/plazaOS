import { useQuery } from '@tanstack/react-query'
import { announcementService } from '../lib/services/announcementService'
import type { PaginatedResponse, Announcement } from '../lib/types'

export function useAnnouncements(page = 1) {
  return useQuery<PaginatedResponse<Announcement>>({
    queryKey: ['announcements', page],
    queryFn: () => announcementService.list(page),
  })
}
