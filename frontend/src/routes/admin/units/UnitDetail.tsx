import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Card, Input, StatusBadge, Text } from '../../../components'
import { BackLink } from '../components/BackLink'
import { DetailField } from '../components/DetailField'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import type { Unit, UnitStatus } from '../data/types'
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

// Fetches this unit from GET /units/:unitId and saves via PATCH — see
// getUnit()/updateUnit() in ./data.ts.
export function UnitDetail() {
  const { unitId } = useParams<{ unitId: string }>()
  const [unit, setUnit] = useState<Unit | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [floor, setFloor] = useState('')
  const [sizeSqft, setSizeSqft] = useState('')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [status, setStatus] = useState<UnitStatus>('vacant')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!unitId) return
    let cancelled = false
    setLoading(true)
    getUnit(unitId)
      .then((found) => {
        if (cancelled) return
        setUnit(found)
        if (found) {
          setFloor(found.floor)
          setSizeSqft(String(found.sizeSqft))
          setMonthlyRent(String(found.monthlyRent))
          setStatus(found.status)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [unitId])

  if (loading) {
    return (
      <div>
        <BackLink to="/admin/units" label="Back to units" />
        <Text variant="body">Loading…</Text>
      </div>
    )
  }

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

  async function handleSave() {
    setIsSaving(true)
    try {
      const updated = await updateUnit(currentUnit.id, {
        floor,
        sizeSqft: Number(sizeSqft),
        monthlyRent: Number(monthlyRent),
        status,
      })
      if (updated) setUnit(updated)
    } finally {
      setIsSaving(false)
    }
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
