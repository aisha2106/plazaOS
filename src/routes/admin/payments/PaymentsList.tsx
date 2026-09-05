import { Link, useNavigate } from 'react-router-dom'
import { Button, StatusBadge, Table } from '../../../components'
import type { TableColumn } from '../../../components'
import { PageHeader } from '../components/PageHeader'
import { mockPayments } from '../data/mockData'
import type { Payment, PaymentMethod, PaymentStatus } from '../data/types'

const statusLabel: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
}

const statusVariant: Record<PaymentStatus, 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  failed: 'danger',
}

const methodLabel: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  check: 'Check',
  gateway: 'Gateway',
}

const columns: TableColumn<Payment>[] = [
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
  { key: 'tenantName', header: 'Tenant', sortable: true },
  { key: 'unitNumber', header: 'Unit' },
  { key: 'amount', header: 'Amount', sortable: true, render: (payment) => `$${payment.amount.toLocaleString()}` },
  { key: 'method', header: 'Method', render: (payment) => methodLabel[payment.method] },
  {
    key: 'status',
    header: 'Status',
    render: (payment) => <StatusBadge variant={statusVariant[payment.status]} label={statusLabel[payment.status]} />,
  },
]

// TODO: fetch payments from GET /payments once the backend is reachable.
export function PaymentsList() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Rent payments across the plaza, including manually recorded offline payments."
        action={<Button onClick={() => navigate('/admin/payments/new')}>Record payment</Button>}
      />
      <Table columns={columns} data={mockPayments} getRowKey={(payment) => payment.id} emptyMessage="No payments recorded" />
    </div>
  )
}
