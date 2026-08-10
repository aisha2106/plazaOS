import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Input, Text } from '../../../components'
import { BackLink } from '../components/BackLink'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { getUnits, updateUnit } from '../units/data'
import { TempPasswordReveal } from './TempPasswordReveal'
import { addTenant, generateTempPassword } from './data'
import type { Tenant } from '../data/types'

interface CreatedTenant {
  tenant: Tenant
  tempPassword: string
}

// TODO: submit to POST /tenants once the backend is reachable — see addTenant() in ./data.ts.
// The real backend must also generate + hash the temporary password
// server-side instead of the client-side generateTempPassword() used here.
export function TenantNew() {
  // Large pageSize so this dropdown always has every vacant unit, not just
  // page 1 — this is a UI convenience read, not the paginated list view.
  // Computed on every render (not memoized) so it reflects the latest unit
  // data, e.g. right after adding a unit or assigning the last vacant one.
  const { data: vacantUnits } = getUnits({ status: 'vacant', pageSize: 1000 })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState(vacantUnits[0]?.id ?? '')
  const [leaseStart, setLeaseStart] = useState(() => new Date().toISOString().slice(0, 10))
  const [leaseEnd, setLeaseEnd] = useState('')
  const [monthlyRent, setMonthlyRent] = useState(vacantUnits[0] ? String(vacantUnits[0].monthlyRent) : '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [created, setCreated] = useState<CreatedTenant | null>(null)

  function handleUnitChange(unitId: string) {
    setSelectedUnitId(unitId)
    const unit = vacantUnits.find((candidate) => candidate.id === unitId)
    if (unit) {
      setMonthlyRent(String(unit.monthlyRent))
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selectedUnit = vacantUnits.find((unit) => unit.id === selectedUnitId)
    if (!selectedUnit) return

    setIsSubmitting(true)
    const tempPassword = generateTempPassword()

    const newTenant = addTenant({
      name,
      email,
      phone,
      unitId: selectedUnit.id,
      unitNumber: selectedUnit.unitNumber,
      leaseStart,
      leaseEnd,
      monthlyRent: Number(monthlyRent),
    })

    // Two distinct calls, not merged: creating the tenant account and
    // marking the unit occupied/linked are separate mutations.
    updateUnit(selectedUnit.id, { status: 'occupied', tenantId: newTenant.id, tenantName: newTenant.name })

    window.setTimeout(() => {
      setIsSubmitting(false)
      setCreated({ tenant: newTenant, tempPassword })
    }, 300)
  }

  if (created) {
    return (
      <div>
        <PageHeader
          title="Tenant created"
          description={`${created.tenant.name} has been added to unit ${created.tenant.unitNumber}.`}
        />
        <TempPasswordReveal email={created.tenant.email} tempPassword={created.tempPassword} />
        <Link
          to={`/admin/tenants/${created.tenant.id}`}
          className="mt-4 inline-flex min-h-[44px] items-center text-[15px] font-medium text-primary hover:text-primary-light"
        >
          View tenant →
        </Link>
      </div>
    )
  }

  if (vacantUnits.length === 0) {
    return (
      <div>
        <BackLink to="/admin/tenants" label="Back to tenants" />
        <PageHeader title="Add tenant" />
        <Text variant="body" className="text-slate-500">
          There are no vacant units to assign right now.{' '}
          <Link to="/admin/units/new" className="text-primary hover:text-primary-light">
            Add a unit
          </Link>{' '}
          first.
        </Text>
      </div>
    )
  }

  return (
    <div>
      <BackLink to="/admin/tenants" label="Back to tenants" />
      <PageHeader title="Add tenant" description="Create a tenant account and assign them to a vacant unit." />
      <Card className="max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} required />
          <Select
            label="Unit"
            value={selectedUnitId}
            onChange={(event) => handleUnitChange(event.target.value)}
            options={vacantUnits.map((unit) => ({ value: unit.id, label: `${unit.unitNumber} — $${unit.monthlyRent.toLocaleString()}/mo` }))}
          />
          <Input label="Lease start" type="date" value={leaseStart} onChange={(event) => setLeaseStart(event.target.value)} required />
          <Input label="Lease end" type="date" value={leaseEnd} onChange={(event) => setLeaseEnd(event.target.value)} required />
          <Input
            label="Monthly rent"
            type="number"
            min="0"
            step="0.01"
            value={monthlyRent}
            onChange={(event) => setMonthlyRent(event.target.value)}
            helperText="Auto-filled from the selected unit — editable."
            required
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating…' : 'Create tenant'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
