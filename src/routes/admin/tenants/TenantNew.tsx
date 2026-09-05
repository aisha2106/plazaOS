import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Input, Text } from '../../../components'
import { BackLink } from '../components/BackLink'
import { PageHeader } from '../components/PageHeader'
import { UnitSelector } from '../../../components'
import { getUnits, updateUnit } from '../units/data'
import { addTenant } from './data'
import type { Tenant } from '../data/types'

interface CreatedTenant {
  tenant: Tenant
}

// TODO: submit to POST /tenants once the backend is reachable — see addTenant() in ./data.ts.
// The real backend must generate + hash the temporary password server-side,
// send account/setup instructions to the tenant's email, and set mustChangePassword.
export function TenantNew() {
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

    updateUnit(selectedUnit.id, { status: 'occupied', tenantId: newTenant.id, tenantName: newTenant.name })

    window.setTimeout(() => {
      setIsSubmitting(false)
      setCreated({ tenant: newTenant })
    }, 300)
  }

  if (created) {
    return (
      <div>
        <PageHeader
          title="Tenant created"
          description={`${created.tenant.name} has been added to unit ${created.tenant.unitNumber}.`}
        />
        <Card className="max-w-md">
          <Text variant="body" className="text-slate-700">
            Account creation is complete. Once backend email delivery is connected, the tenant will receive account/setup instructions at <span className="font-medium">{created.tenant.email}</span>.
          </Text>
        </Card>
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
          <UnitSelector
            label="Unit"
            value={selectedUnitId}
            onChange={(unitId, _unitNumber) => handleUnitChange(unitId)}
            units={vacantUnits}
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
