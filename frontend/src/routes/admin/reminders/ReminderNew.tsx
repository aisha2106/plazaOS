import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input } from '../../../components'
import { BackLink } from '../components/BackLink'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { TenantMultiSelect } from '../components/TenantMultiSelect'
import { Textarea } from '../components/Textarea'
import { getTenants } from '../tenants/data'
import type { ReminderTarget, Tenant } from '../data/types'
import { addReminder } from './data'

const targetOptions: { value: ReminderTarget; label: string }[] = [
  { value: 'tenant', label: 'One tenant' },
  { value: 'group', label: 'Selected group' },
  { value: 'everyone', label: 'Everyone' },
]

// Submits to POST /reminders — see addReminder() in ./data.ts.
export function ReminderNew() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState<ReminderTarget>('everyone')
  const [tenantId, setTenantId] = useState('')
  const [groupTenantIds, setGroupTenantIds] = useState<string[]>([])
  const [scheduledFor, setScheduledFor] = useState(() => new Date().toISOString().slice(0, 10))
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    getTenants({ pageSize: 1000 }).then((result) => {
      if (cancelled) return
      setTenants(result.data)
      if (result.data[0]) setTenantId(result.data[0].id)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const canSubmit = target !== 'group' || groupTenantIds.length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await addReminder({
        title,
        message,
        scheduledFor,
        target,
        tenantId: target === 'tenant' ? tenantId : undefined,
        groupTenantIds: target === 'group' ? groupTenantIds : undefined,
      })
      navigate('/admin/reminders')
    } finally {
      setIsSubmitting(false)
    }
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
              options={tenants.map((tenant) => ({ value: tenant.id, label: `${tenant.name} (${tenant.unitNumber})` }))}
            />
          ) : null}
          {target === 'group' ? (
            <TenantMultiSelect tenants={tenants} selectedTenantIds={groupTenantIds} onChange={setGroupTenantIds} />
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
