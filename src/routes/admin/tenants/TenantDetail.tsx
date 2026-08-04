import { Link, useParams } from 'react-router-dom'
import { Card, StatusBadge, Table, Text } from '../../../components'
import type { TableColumn } from '../../../components'
import { BackLink } from '../components/BackLink'
import { DetailField } from '../components/DetailField'
import { PageHeader } from '../components/PageHeader'
import { getTenantById, mockMaintenanceRequests, mockPayments } from '../data/mockData'
import type { MaintenanceRequest, Payment, RentStatus, TenantStatus } from '../data/types'

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

const accountStatusLabel: Record<TenantStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
}

const accountStatusVariant: Record<TenantStatus, 'success' | 'danger'> = {
  active: 'success',
  inactive: 'danger',
}

const paymentColumns: TableColumn<Payment>[] = [
  {
    key: 'date',
    header: 'Date',
    sortable: true,
    render: (payment) => (
      <Link to={`/admin/payments/${payment.id}`} className="font-medium text-primary hover:text-primary-light">
        {payment.date}
      </Link>
    ),
  },
  { key: 'amount', header: 'Amount', render: (payment) => `$${payment.amount.toLocaleString()}` },
  {
    key: 'status',
    header: 'Status',
    render: (payment) => (
      <StatusBadge
        variant={payment.status === 'paid' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger'}
        label={payment.status === 'paid' ? 'Paid' : payment.status === 'pending' ? 'Pending' : 'Failed'}
      />
    ),
  },
]

const maintenanceColumns: TableColumn<MaintenanceRequest>[] = [
  {
    key: 'title',
    header: 'Request',
    render: (request) => (
      <Link to={`/admin/maintenance/${request.id}`} className="font-medium text-primary hover:text-primary-light">
        {request.title}
      </Link>
    ),
  },
  { key: 'createdAt', header: 'Submitted', sortable: true },
  {
    key: 'status',
    header: 'Status',
    render: (request) => (
      <StatusBadge
        variant={request.status === 'resolved' ? 'success' : request.status === 'in_progress' ? 'warning' : 'danger'}
        label={request.status === 'resolved' ? 'Resolved' : request.status === 'in_progress' ? 'In progress' : 'Open'}
      />
    ),
  },
]

// TODO: fetch this tenant from GET /tenants/:tenantId once the backend is reachable.
export function TenantDetail() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const tenant = tenantId ? getTenantById(tenantId) : undefined

  if (!tenant) {
    return (
      <div>
        <BackLink to="/admin/tenants" label="Back to tenants" />
        <Text variant="body">Tenant not found.</Text>
      </div>
    )
  }

  const tenantPayments = mockPayments.filter((payment) => payment.tenantId === tenant.id)
  const tenantMaintenance = mockMaintenanceRequests.filter((request) => request.tenantId === tenant.id)

  return (
    <div>
      <BackLink to="/admin/tenants" label="Back to tenants" />
      <PageHeader
        title={tenant.name}
        action={<StatusBadge variant={accountStatusVariant[tenant.status]} label={accountStatusLabel[tenant.status]} />}
      />

      <Card className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <DetailField label="Unit">
          <Link to={`/admin/units/${tenant.unitId}`} className="text-primary hover:text-primary-light">
            {tenant.unitNumber}
          </Link>
        </DetailField>
        <DetailField label="Rent status">
          <StatusBadge variant={rentStatusVariant[tenant.rentStatus]} label={rentStatusLabel[tenant.rentStatus]} />
        </DetailField>
        <DetailField label="Email">{tenant.email}</DetailField>
        <DetailField label="Phone">{tenant.phone}</DetailField>
        <DetailField label="Lease term">
          {tenant.leaseStart} – {tenant.leaseEnd}
        </DetailField>
        <DetailField label="Monthly rent">${tenant.monthlyRent.toLocaleString()}</DetailField>
      </Card>

      <div className="mb-6">
        <Text variant="h3" className="mb-3">
          Payment history
        </Text>
        <Table columns={paymentColumns} data={tenantPayments} getRowKey={(payment) => payment.id} emptyMessage="No payments recorded" />
      </div>

      <div>
        <Text variant="h3" className="mb-3">
          Maintenance requests
        </Text>
        <Table
          columns={maintenanceColumns}
          data={tenantMaintenance}
          getRowKey={(request) => request.id}
          emptyMessage="No maintenance requests"
        />
      </div>
    </div>
  )
}
