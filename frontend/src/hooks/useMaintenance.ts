import { useMutation, useQuery } from '@tanstack/react-query'
import { maintenanceService } from '../lib/services/maintenanceService'

export function useMaintenance(page = 1) {
  const query = useQuery({
    queryKey: ['maintenance', page],
    queryFn: () => maintenanceService.list(page),
  })
  const create = useMutation({
    mutationFn: (payload: Parameters<typeof maintenanceService.create>[0]) => maintenanceService.create(payload),
  })
  return { ...query, create }
}
