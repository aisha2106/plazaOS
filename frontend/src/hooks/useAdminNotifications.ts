import { useMutation, useQuery } from '@tanstack/react-query'
import { adminNotificationService } from '../lib/services/adminNotificationService'

export function useAdminNotifications() {
  const query = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => adminNotificationService.list(),
  })
  const markRead = useMutation({
    mutationFn: (id: string) => adminNotificationService.markRead(id),
  })
  const markAll = useMutation({
    mutationFn: () => adminNotificationService.markAllRead(),
  })
  return { ...query, markRead, markAll }
}
