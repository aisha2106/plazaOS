import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Card, Input, StatusBadge, Table, Text } from '../../../components'
import type { TableColumn } from '../../../components'
import { BackLink } from '../components/BackLink'
import { DetailField } from '../components/DetailField'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { mockMaintenanceRequests, mockPayments } from '../data/mockData'
import type { AccountStatus, MaintenanceRequest, Payment, RentStatus, TenantStatus } from '../data/types'
import { getTenant, generateTempPassword, updateTenant } from './data'
import { TempPasswordReveal } from './TempPasswordReveal'

const rentStatusOptions: { value: RentStatus; label: string }[] = [
  { value: 'paid', label: 'Paid' },
  { value: 'due', label: 'Due' },
  { value: 'overdue', label: 'Overdue' },
]

const leaseStatusLabel: Record<TenantStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
}

const leaseStatusVariant: Record<TenantStatus, 'success' | 'danger'> = {
  active: 'success',
  inactive: 'danger',
}

const accountStatusLabel: Record<AccountStatus, string> = {
  temporary: 'Temporary password',
  active: 'Active',
}

const accountStatusVariant: Record<AccountStatus, 'warning' | 'success'> = {
  temporary: 'warning',
  active: 'success',
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

// TODO: fetch this tenant from GET /tenants/:tenantId and save via PATCH
// once the backend is reachable — see getTenant()/updateTenant() in ./data.ts.
export function TenantDetail() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const tenant = tenantId ? getTenant(tenantId) : undefined

  const [leaseEnd, setLeaseEnd] = useState(tenant?.leaseEnd ?? '')
  const [monthlyRent, setMonthlyRent] = useState(tenant ? String(tenant.monthlyRent) : '')
  const [rentStatus, setRentStatus] = useState<RentStatus>(tenant?.rentStatus ?? 'due')
  const [isSaving, setIsSaving] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [resetTempPassword, setResetTempPassword] = useState<string | null>(null)

  if (!tenant) {
    return (
      <div>
        <BackLink to="/admin/tenants" label="Back to tenants" />
        <Text variant="body">Tenant not found.</Text>
      </div>
    )
  }

  const currentTenant = tenant

  const hasChanges =
    leaseEnd !== currentTenant.leaseEnd || Number(monthlyRent) !== currentTenant.monthlyRent || rentStatus !== currentTenant.rentStatus

  function handleSave() {
    setIsSaving(true)
    updateTenant(currentTenant.id, {
      leaseEnd,
      monthlyRent: Number(monthlyRent),
      rentStatus,
    })
    window.setTimeout(() => {
      setIsSaving(false)
    }, 300)
  }

  function handleResetPassword() {
    setIsResettingPassword(true)
    const tempPassword = generateTempPassword()
    // Reset puts the account back in the same "temporary" state a brand-new
    // account starts in, so the accountStatus badge and mustChangePassword
    // stay consistent with each other.
    updateTenant(currentTenant.id, { accountStatus: 'temporary', mustChangePassword: true })
    window.setTimeout(() => {
      setIsResettingPassword(false)
      setResetTempPassword(tempPassword)
    }, 300)
  }

  const tenantPayments = mockPayments.filter((payment) => payment.tenantId === currentTenant.id)
  const tenantMaintenance = mockMaintenanceRequests.filter((request) => request.tenantId === currentTenant.id)

  return (
    <div>
      <BackLink to="/admin/tenants" label="Back to tenants" />
      <PageHeader
        title={currentTenant.name}
        action={<StatusBadge variant={leaseStatusVariant[currentTenant.status]} label={leaseStatusLabel[currentTenant.status]} />}
      />

      <Card className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <DetailField label="Unit">
          <Link to={`/admin/units/${currentTenant.unitId}`} className="text-primary hover:text-primary-light">
            {currentTenant.unitNumber}
          </Link>
        </DetailField>
        <DetailField label="Email">{currentTenant.email}</DetailField>
        <DetailField label="Phone">{currentTenant.phone}</DetailField>
        <DetailField label="Lease start">{currentTenant.leaseStart}</DetailField>
        <Input label="Lease end" type="date" value={leaseEnd} onChange={(event) => setLeaseEnd(event.target.value)} />
        <Input
          label="Monthly rent"
          type="number"
          min="0"
          step="0.01"
          value={monthlyRent}
          onChange={(event) => setMonthlyRent(event.target.value)}
        />
        <Select
          label="Rent status"
          value={rentStatus}
          onChange={(event) => setRentStatus(event.target.value as RentStatus)}
          options={rentStatusOptions}
        />
        <div className="flex items-end">
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Card>

      <Card className="mb-6">
        <Text variant="h3" className="mb-3">
          Account
        </Text>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <DetailField label="Status">
            <StatusBadge
              variant={accountStatusVariant[currentTenant.accountStatus]}
              label={accountStatusLabel[currentTenant.accountStatus]}
            />
          </DetailField>
          <Button variant="secondary" onClick={handleResetPassword} disabled={isResettingPassword}>
            {isResettingPassword ? 'Resetting…' : 'Reset password'}
          </Button>
        </div>
        {resetTempPassword ? (
          <div className="mt-4">
            <TempPasswordReveal email={currentTenant.email} tempPassword={resetTempPassword} />
          </div>
        ) : null}
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
