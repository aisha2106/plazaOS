import { Link } from 'react-router-dom'
import { StatusBadge, Table } from '../../../components'
import type { TableColumn } from '../../../components'
import { PageHeader } from '../components/PageHeader'
import { mockTenants } from '../data/mockData'
import type { RentStatus, Tenant } from '../data/types'

const rentStatusLabel: Record<RentStatus, string> = {
  paid: 'Paid',
  due: 'Due',
  overdue: 'Overdue',
}

const rentStatusVariant: Record<RentStatus, 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  due: 'warning',
  overdue: 'danger',
}

const columns: TableColumn<Tenant>[] = [
  {
    key: 'name',
    header: 'Tenant',
    sortable: true,
    render: (tenant) => (
      <Link to={`/admin/tenants/${tenant.id}`} className="font-medium text-primary hover:text-primary-light">
        {tenant.name}
      </Link>
    ),
  },
  { key: 'unitNumber', header: 'Unit', sortable: true },
  { key: 'email', header: 'Email' },
  { key: 'leaseEnd', header: 'Lease ends', sortable: true },
  {
    key: 'rentStatus',
    header: 'Rent status',
    render: (tenant) => <StatusBadge variant={rentStatusVariant[tenant.rentStatus]} label={rentStatusLabel[tenant.rentStatus]} />,
  },
]

// TODO: fetch tenants from GET /tenants once the backend is reachable.
export function TenantsList() {
  return (
    <div>
      <PageHeader title="Tenants" description="All tenant accounts and their current rent status." />
      <Table columns={columns} data={mockTenants} getRowKey={(tenant) => tenant.id} emptyMessage="No tenants yet" />
    </div>
  )
}
