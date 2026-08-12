import { useMutation, useQuery } from '@tanstack/react-query'
import { notificationService } from '../lib/services/notificationService'

export function useNotifications() {
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.list(),
  })
  const markRead = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
  })
  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
  })
  return { ...query, markRead, markAll }
}
