import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../lib/services/notificationService'
import type { NotificationItem } from '../lib/services/notificationService'

export function useNotifications() {
  const queryClient = useQueryClient()
  const query = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: () => notificationService.list(),
  })
  const markRead = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
  return { ...query, markRead, markAll }
}
