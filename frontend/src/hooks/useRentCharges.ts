import { useQuery } from '@tanstack/react-query'
import { rentChargeService } from '../lib/services/rentChargeService'

export function useRentCharges() {
  return useQuery({
    queryKey: ['rent-charges'],
    queryFn: () => rentChargeService.list(),
  })
}
