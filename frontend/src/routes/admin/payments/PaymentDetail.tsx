import { Link, useParams } from 'react-router-dom'
import { Button, Card, StatusBadge, Text } from '../../../components'
import { BackLink } from '../components/BackLink'
import { DetailField } from '../components/DetailField'
import { PageHeader } from '../components/PageHeader'
import { getPaymentById } from '../data/mockData'
import type { PaymentMethod, PaymentStatus } from '../data/types'

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

// TODO: fetch this payment from GET /payments/:paymentId once the backend is reachable.
export function PaymentDetail() {
  const { paymentId } = useParams<{ paymentId: string }>()
  const payment = paymentId ? getPaymentById(paymentId) : undefined

  if (!payment) {
    return (
      <div>
        <BackLink to="/admin/payments" label="Back to payments" />
        <Text variant="body">Payment not found.</Text>
      </div>
    )
  }

  return (
    <div>
      <BackLink to="/admin/payments" label="Back to payments" />
      <PageHeader
        title={`Payment · ${payment.tenantName}`}
        action={<StatusBadge variant={statusVariant[payment.status]} label={statusLabel[payment.status]} />}
      />
      <Card className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <DetailField label="Tenant">
          <Link to={`/admin/tenants/${payment.tenantId}`} className="text-primary hover:text-primary-light">
            {payment.tenantName}
          </Link>
        </DetailField>
        <DetailField label="Unit">{payment.unitNumber}</DetailField>
        <DetailField label="Amount">${payment.amount.toLocaleString()}</DetailField>
        <DetailField label="Method">{methodLabel[payment.method]}</DetailField>
        <DetailField label="Date">{payment.date}</DetailField>
        <DetailField label="Recorded by">{payment.recordedBy ?? 'Tenant (gateway)'}</DetailField>
        {payment.note ? <DetailField label="Note">{payment.note}</DetailField> : null}
        <DetailField label="Receipt">
          {payment.receiptAvailable ? (
            // TODO: wire up to the real generated-receipt download endpoint.
            <Button variant="secondary">Download receipt</Button>
          ) : (
            'Not available yet'
          )}
        </DetailField>
      </Card>
    </div>
  )
}
