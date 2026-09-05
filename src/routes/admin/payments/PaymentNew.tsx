import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input } from '../../../components'
import { BackLink } from '../components/BackLink'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { Textarea } from '../components/Textarea'
import { mockTenants } from '../data/mockData'
import type { PaymentMethod } from '../data/types'

const OFFLINE_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'check', label: 'Check' },
]

// TODO: submit to POST /payments once the backend is reachable — this only
// simulates success and returns to the payments list.
export function PaymentNew() {
  const navigate = useNavigate()
  const [tenantId, setTenantId] = useState(mockTenants[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    // TODO: await api.post('/payments', { tenantId, amount, method, date, note })
    window.setTimeout(() => {
      navigate('/admin/payments')
    }, 300)
  }

  return (
    <div>
      <BackLink to="/admin/payments" label="Back to payments" />
      <PageHeader title="Record payment" description="Log an offline payment made by a tenant." />
      <Card className="max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select
            label="Tenant"
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
            options={mockTenants.map((tenant) => ({ value: tenant.id, label: `${tenant.name} (${tenant.unitNumber})` }))}
            required
          />
          <Input
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
          <Select
            label="Payment method"
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
            options={OFFLINE_METHODS}
            required
          />
          <Input label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          <Textarea label="Note" placeholder="Optional context, e.g. paid in person at the office" value={note} onChange={(event) => setNote(event.target.value)} />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Saving…' : 'Record payment'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
