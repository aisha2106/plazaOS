import { Link } from 'react-router-dom'
import { StatusBadge, Table } from '../../../components'
import type { TableColumn } from '../../../components'
import { PageHeader } from '../components/PageHeader'
import { mockMaintenanceRequests } from '../data/mockData'
import type { MaintenancePriority, MaintenanceRequest, MaintenanceStatus } from '../data/types'

const statusLabel: Record<MaintenanceStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
}

const statusVariant: Record<MaintenanceStatus, 'danger' | 'warning' | 'success'> = {
  open: 'danger',
  in_progress: 'warning',
  resolved: 'success',
}

const priorityLabel: Record<MaintenancePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const columns: TableColumn<MaintenanceRequest>[] = [
  {
    key: 'title',
    header: 'Request',
    sortable: true,
    render: (request) => (
      <Link to={`/admin/maintenance/${request.id}`} className="font-medium text-primary hover:text-primary-light">
        {request.title}
      </Link>
    ),
  },
  { key: 'tenantName', header: 'Tenant', sortable: true },
  { key: 'unitNumber', header: 'Unit' },
  { key: 'priority', header: 'Priority', render: (request) => priorityLabel[request.priority] },
  { key: 'createdAt', header: 'Submitted', sortable: true },
  {
    key: 'status',
    header: 'Status',
    render: (request) => <StatusBadge variant={statusVariant[request.status]} label={statusLabel[request.status]} />,
  },
]

// TODO: fetch maintenance requests from GET /maintenance once the backend is reachable.
export function MaintenanceList() {
  return (
    <div>
      <PageHeader title="Maintenance requests" description="Tenant-submitted requests and their current status." />
      <Table columns={columns} data={mockMaintenanceRequests} getRowKey={(request) => request.id} emptyMessage="No maintenance requests" />
    </div>
  )
}
