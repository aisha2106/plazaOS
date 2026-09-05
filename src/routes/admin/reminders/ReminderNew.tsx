import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input } from '../../../components'
import { BackLink } from '../components/BackLink'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { TenantMultiSelect } from '../components/TenantMultiSelect'
import { Textarea } from '../components/Textarea'
import { mockTenants } from '../data/mockData'
import type { ReminderTarget } from '../data/types'

const targetOptions: { value: ReminderTarget; label: string }[] = [
  { value: 'tenant', label: 'One tenant' },
  { value: 'group', label: 'Selected group' },
  { value: 'everyone', label: 'Everyone' },
]

// TODO: submit to POST /reminders once the backend is reachable — this only
// simulates success and returns to the reminders list.
export function ReminderNew() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState<ReminderTarget>('everyone')
  const [tenantId, setTenantId] = useState(mockTenants[0]?.id ?? '')
  const [groupTenantIds, setGroupTenantIds] = useState<string[]>([])
  const [scheduledFor, setScheduledFor] = useState(() => new Date().toISOString().slice(0, 10))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = target !== 'group' || groupTenantIds.length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    // TODO: await api.post('/reminders', { title, message, target, tenantId, groupTenantIds, scheduledFor })
    window.setTimeout(() => {
      navigate('/admin/reminders')
    }, 300)
  }

  return (
    <div>
      <BackLink to="/admin/reminders" label="Back to reminders" />
      <PageHeader title="New reminder" description="Send a manual reminder to one tenant, a group, or everyone." />
      <Card className="max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <Textarea label="Message" value={message} onChange={(event) => setMessage(event.target.value)} required />
          <Select
            label="Target"
            value={target}
            onChange={(event) => setTarget(event.target.value as ReminderTarget)}
            options={targetOptions}
          />
          {target === 'tenant' ? (
            <Select
              label="Tenant"
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              options={mockTenants.map((tenant) => ({ value: tenant.id, label: `${tenant.name} (${tenant.unitNumber})` }))}
            />
          ) : null}
          {target === 'group' ? (
            <TenantMultiSelect tenants={mockTenants} selectedTenantIds={groupTenantIds} onChange={setGroupTenantIds} />
          ) : null}
          <Input
            label="Scheduled for"
            type="date"
            value={scheduledFor}
            onChange={(event) => setScheduledFor(event.target.value)}
            required
          />
          <Button type="submit" disabled={isSubmitting || !canSubmit} className="w-full">
            {isSubmitting ? 'Sending…' : 'Send reminder'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
