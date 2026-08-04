import { Link, useParams } from 'react-router-dom'
import { Card, StatusBadge, Text } from '../../../components'
import { BackLink } from '../components/BackLink'
import { DetailField } from '../components/DetailField'
import { PageHeader } from '../components/PageHeader'
import { getUnitById } from '../data/mockData'
import type { UnitStatus } from '../data/types'

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

// TODO: fetch this unit from GET /units/:unitId once the backend is reachable.
export function UnitDetail() {
  const { unitId } = useParams<{ unitId: string }>()
  const unit = unitId ? getUnitById(unitId) : undefined

  if (!unit) {
    return (
      <div>
        <BackLink to="/admin/units" label="Back to units" />
        <Text variant="body">Unit not found.</Text>
      </div>
    )
  }

  return (
    <div>
      <BackLink to="/admin/units" label="Back to units" />
      <PageHeader
        title={`Unit ${unit.unitNumber}`}
        action={<StatusBadge variant={statusVariant[unit.status]} label={statusLabel[unit.status]} />}
      />
      <Card className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <DetailField label="Floor">{unit.floor}</DetailField>
        <DetailField label="Size">{unit.sizeSqft} sqft</DetailField>
        <DetailField label="Monthly rent">${unit.monthlyRent.toLocaleString()}</DetailField>
        <DetailField label="Tenant">
          {unit.tenantId && unit.tenantName ? (
            <Link to={`/admin/tenants/${unit.tenantId}`} className="text-primary hover:text-primary-light">
              {unit.tenantName}
            </Link>
          ) : (
            'Unassigned'
          )}
        </DetailField>
      </Card>
    </div>
  )
}
