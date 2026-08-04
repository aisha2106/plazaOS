import { Link } from 'react-router-dom'
import { StatusBadge, Table } from '../../../components'
import type { TableColumn } from '../../../components'
import { PageHeader } from '../components/PageHeader'
import { mockUnits } from '../data/mockData'
import type { Unit, UnitStatus } from '../data/types'

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

const columns: TableColumn<Unit>[] = [
  {
    key: 'unitNumber',
    header: 'Unit',
    sortable: true,
    render: (unit) => (
      <Link to={`/admin/units/${unit.id}`} className="font-medium text-primary hover:text-primary-light">
        {unit.unitNumber}
      </Link>
    ),
  },
  { key: 'floor', header: 'Floor', sortable: true },
  { key: 'sizeSqft', header: 'Size', render: (unit) => `${unit.sizeSqft} sqft` },
  { key: 'monthlyRent', header: 'Monthly rent', sortable: true, render: (unit) => `$${unit.monthlyRent.toLocaleString()}` },
  { key: 'tenantName', header: 'Tenant', render: (unit) => unit.tenantName ?? '—' },
  {
    key: 'status',
    header: 'Status',
    render: (unit) => <StatusBadge variant={statusVariant[unit.status]} label={statusLabel[unit.status]} />,
  },
]

// TODO: fetch units from GET /units once the backend is reachable.
export function UnitsList() {
  return (
    <div>
      <PageHeader title="Units" description="All plaza units and their occupancy status." />
      <Table columns={columns} data={mockUnits} getRowKey={(unit) => unit.id} emptyMessage="No units yet" />
    </div>
  )
}
