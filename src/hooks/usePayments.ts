import { useMutation, useQuery } from '@tanstack/react-query'
import { paymentService } from '../lib/services/paymentService'

export function usePayments(page = 1) {
  const query = useQuery({
    queryKey: ['payments', page],
    queryFn: () => paymentService.list(page),
  })
  const payMutation = useMutation({
    mutationFn: (amount: number) => paymentService.pay(amount),
  })
  return { ...query, payMutation }
}
