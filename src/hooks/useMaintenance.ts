import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { maintenanceService } from '../lib/services/maintenanceService'
import type { PaginatedResponse, MaintenanceRequest } from '../lib/types'

export function useMaintenance(page = 1) {
  const queryClient = useQueryClient()
  const query = useQuery<PaginatedResponse<MaintenanceRequest>>({
    queryKey: ['maintenance', page],
    queryFn: () => maintenanceService.list(page),
  })
  const create = useMutation({
    mutationFn: (payload: Partial<MaintenanceRequest>) => maintenanceService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
  return { ...query, create }
}
