import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Text } from '../../components'
import { usePayments } from '../../hooks/usePayments'

type FormValues = { amount: number }

export function PaymentsNew() {
  const { register, handleSubmit, formState } = useForm<FormValues>({ defaultValues: { amount: 0 } })
  const { payMutation } = usePayments()
  const navigate = useNavigate()

  async function onSubmit(values: FormValues) {
    // Basic client-side validation: amount must be > 0
    if (!values.amount || values.amount <= 0) {
      return
    }

    try {
      await payMutation.mutateAsync(values.amount)
      navigate('/tenant/payments')
    } catch (err) {
      // mutation exposes error; keep behavior minimal
      console.error(err)
    }
  }

  return (
    <div className="px-4 sm:px-6">
      <Text variant="h1">Pay Rent</Text>
      <Card className="mt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Amount"
            type="number"
            {...register('amount', { valueAsNumber: true, required: true, min: 0.01 })}
          />
          {formState.errors.amount ? (
            <Text variant="bodySmall" className="text-danger">Please enter an amount greater than 0.</Text>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={payMutation.status === 'pending' || formState.isSubmitting}>
              {payMutation.status === 'pending' ? 'Processing…' : 'Pay'}
            </Button>
          </div>
          {payMutation.status === 'error' ? <Text variant="bodySmall" className="text-danger">Payment failed. Please try again.</Text> : null}
          {payMutation.status === 'success' ? <Text variant="bodySmall" className="text-success">Payment successful.</Text> : null}
        </form>
      </Card>
    </div>
  )
}
