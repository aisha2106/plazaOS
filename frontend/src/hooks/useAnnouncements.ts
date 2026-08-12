import { useQuery } from '@tanstack/react-query'
import { announcementService } from '../lib/services/announcementService'

export function useAnnouncements(page = 1) {
  return useQuery({
    queryKey: ['announcements', page],
    queryFn: () => announcementService.list(page),
  })
}
