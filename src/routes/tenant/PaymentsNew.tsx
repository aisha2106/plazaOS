import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Text } from '../../components'
import { usePayments } from '../../hooks/usePayments'
import { useProfile } from '../../hooks/useProfile'
import { formatNaira } from '../../lib/formatting'

type FormValues = { amount: number }

export function PaymentsNew() {
  const { register, handleSubmit, formState, watch } = useForm<FormValues>({ defaultValues: { amount: 0 } })
  const { payMutation } = usePayments()
  const { data: profile } = useProfile()
  const navigate = useNavigate()
  const amount = watch('amount')

  async function onSubmit(values: FormValues) {
    if (!values.amount || values.amount <= 0) {
      return
    }

    try {
      await payMutation.mutateAsync(values.amount)
      navigate('/tenant/payments')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Text variant="h1" className="mb-8">Pay Rent</Text>
      
      {/* Rent Summary */}
      <Card className="mb-6 bg-gradient-to-br from-indigo-50 to-transparent border-indigo-200">
        <div className="space-y-4">
          <div>
            <Text variant="caption" className="text-indigo-700">Monthly Rent</Text>
            <Text variant="display" className="text-primary font-bold">
              {profile?.monthlyRent != null ? formatNaira(profile.monthlyRent) : '—'}
            </Text>
          </div>
          {profile?.nextDueDate && (
            <div>
              <Text variant="caption" className="text-slate-700">Next Due Date</Text>
              <Text variant="body" className="font-semibold">{profile.nextDueDate}</Text>
            </div>
          )}
          {profile?.balance != null && (
            <div className="rounded-lg bg-white border border-slate-200 p-4">
              <Text variant="caption" className="text-slate-600">Outstanding Balance</Text>
              <Text variant="h3" className={profile.balance > 0 ? 'text-danger' : 'text-success'}>
                {formatNaira(profile.balance)}
              </Text>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <Text variant="h3" className="mb-6">Enter Payment Amount</Text>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <Input
            label="Amount to Pay"
            type="number"
            placeholder="0"
            step="0.01"
            {...register('amount', { valueAsNumber: true, required: 'Amount is required', min: { value: 0.01, message: 'Amount must be greater than 0' } })}
            error={formState.errors.amount?.message}
            helperText="Enter the amount in Naira (₦)"
          />

          {amount > 0 && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <Text variant="caption" className="text-slate-600">You will pay</Text>
              <Text variant="h2" className="text-primary font-bold mt-1">{formatNaira(amount)}</Text>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => navigate('/tenant/payments')} disabled={payMutation.isPending || formState.isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={payMutation.isPending || formState.isSubmitting || !amount || amount <= 0}>
              {payMutation.isPending ? 'Processing…' : 'Confirm Payment'}
            </Button>
          </div>

          {payMutation.isError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <Text variant="bodySmall" className="text-danger font-medium">Payment failed. Please try again.</Text>
            </div>
          )}
          {payMutation.isSuccess && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
              <Text variant="bodySmall" className="text-emerald-700 font-medium">✓ Payment successful!</Text>
            </div>
          )}
        </form>
      </Card>
    </div>
  )
}


