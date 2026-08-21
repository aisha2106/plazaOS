import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentService } from '../lib/services/paymentService'
import type { PaginatedResponse } from '../lib/types'
import type { Payment } from '../lib/services/paymentService'

export function usePayments(page = 1) {
  const queryClient = useQueryClient()
  const query = useQuery<PaginatedResponse<Payment>>({
    queryKey: ['payments', page],
    queryFn: () => paymentService.list(page),
  })
  const payMutation = useMutation({
    mutationFn: (rentChargeId: string) => paymentService.pay(rentChargeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments'] })
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
  return { ...query, payMutation }
}
