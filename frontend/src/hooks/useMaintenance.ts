import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { maintenanceService } from '../lib/services/maintenanceService'
import type { PaginatedResponse } from '../lib/types'
import type { MaintenanceRequest } from '../lib/services/maintenanceService'

export function useMaintenance(page = 1) {
  const queryClient = useQueryClient()
  const query = useQuery<PaginatedResponse<MaintenanceRequest>>({
    queryKey: ['maintenance', page],
    queryFn: () => maintenanceService.list(page),
  })
  const create = useMutation({
    mutationFn: (payload: Parameters<typeof maintenanceService.create>[0]) => maintenanceService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
  return { ...query, create }
}
