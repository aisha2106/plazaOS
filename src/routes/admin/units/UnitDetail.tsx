import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Card, Input, StatusBadge, Text } from '../../../components'
import { BackLink } from '../components/BackLink'
import { DetailField } from '../components/DetailField'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import type { UnitStatus } from '../data/types'
import { getUnit, updateUnit } from './data'

const statusLabel: Record<UnitStatus, string> = {
  occupied: 'Occupied',
  vacant: 'Vacant',
  maintenance: 'Under maintenance',
}

const statusVariant: Record<UnitStatus, 'success' | 'warning' | 'danger'> = {
  occupied: 'success',
  vacant: 'warning',
  maintenance: 'danger',
}

const statusOptions: { value: UnitStatus; label: string }[] = [
  { value: 'vacant', label: 'Vacant' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Under maintenance' },
]

// TODO: fetch this unit from GET /units/:unitId and save via PATCH once the
// backend is reachable — see getUnit()/updateUnit() in ./data.ts.
export function UnitDetail() {
  const { unitId } = useParams<{ unitId: string }>()
  const unit = unitId ? getUnit(unitId) : undefined

  const [floor, setFloor] = useState(unit?.floor ?? '')
  const [sizeSqft, setSizeSqft] = useState(unit ? String(unit.sizeSqft) : '')
  const [monthlyRent, setMonthlyRent] = useState(unit ? String(unit.monthlyRent) : '')
  const [status, setStatus] = useState<UnitStatus>(unit?.status ?? 'vacant')
  const [isSaving, setIsSaving] = useState(false)

  if (!unit) {
    return (
      <div>
        <BackLink to="/admin/units" label="Back to units" />
        <Text variant="body">Unit not found.</Text>
      </div>
    )
  }

  const currentUnit = unit

  const hasChanges =
    floor !== currentUnit.floor ||
    Number(sizeSqft) !== currentUnit.sizeSqft ||
    Number(monthlyRent) !== currentUnit.monthlyRent ||
    status !== currentUnit.status

  function handleSave() {
    setIsSaving(true)
    updateUnit(currentUnit.id, {
      floor,
      sizeSqft: Number(sizeSqft),
      monthlyRent: Number(monthlyRent),
      status,
    })
    window.setTimeout(() => {
      setIsSaving(false)
    }, 300)
  }

  return (
    <div>
      <BackLink to="/admin/units" label="Back to units" />
      <PageHeader
        title={`Unit ${currentUnit.unitNumber}`}
        action={<StatusBadge variant={statusVariant[currentUnit.status]} label={statusLabel[currentUnit.status]} />}
      />
      <Card className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input label="Floor" value={floor} onChange={(event) => setFloor(event.target.value)} />
        <Input label="Size (sqft)" type="number" min="0" value={sizeSqft} onChange={(event) => setSizeSqft(event.target.value)} />
        <Input
          label="Monthly rent"
          type="number"
          min="0"
          step="0.01"
          value={monthlyRent}
          onChange={(event) => setMonthlyRent(event.target.value)}
        />
        <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value as UnitStatus)} options={statusOptions} />
        <DetailField label="Tenant">
          {currentUnit.tenantId && currentUnit.tenantName ? (
            <Link to={`/admin/tenants/${currentUnit.tenantId}`} className="text-primary hover:text-primary-light">
              {currentUnit.tenantName}
            </Link>
          ) : (
            'Unassigned'
          )}
        </DetailField>
        <div className="flex items-end">
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
