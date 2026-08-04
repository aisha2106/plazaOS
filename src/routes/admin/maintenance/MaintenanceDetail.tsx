import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Card, StatusBadge, Text } from '../../../components'
import { BackLink } from '../components/BackLink'
import { DetailField } from '../components/DetailField'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { getMaintenanceRequestById } from '../data/mockData'
import type { MaintenancePriority, MaintenanceStatus } from '../data/types'

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

const statusOptions: { value: MaintenanceStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

const priorityLabel: Record<MaintenancePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

// TODO: fetch this request from GET /maintenance/:requestId once the backend is reachable.
export function MaintenanceDetail() {
  const { requestId } = useParams<{ requestId: string }>()
  const request = requestId ? getMaintenanceRequestById(requestId) : undefined

  const [status, setStatus] = useState<MaintenanceStatus | null>(request?.status ?? null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedStatus, setSavedStatus] = useState<MaintenanceStatus | null>(request?.status ?? null)

  if (!request || !status) {
    return (
      <div>
        <BackLink to="/admin/maintenance" label="Back to maintenance" />
        <Text variant="body">Maintenance request not found.</Text>
      </div>
    )
  }

  function handleSaveStatus() {
    setIsSaving(true)
    // TODO: await api.patch(`/maintenance/${request.id}`, { status })
    window.setTimeout(() => {
      setSavedStatus(status)
      setIsSaving(false)
    }, 300)
  }

  return (
    <div>
      <BackLink to="/admin/maintenance" label="Back to maintenance" />
      <PageHeader
        title={request.title}
        action={savedStatus ? <StatusBadge variant={statusVariant[savedStatus]} label={statusLabel[savedStatus]} /> : null}
      />

      <Card className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <DetailField label="Tenant">
          <Link to={`/admin/tenants/${request.tenantId}`} className="text-primary hover:text-primary-light">
            {request.tenantName}
          </Link>
        </DetailField>
        <DetailField label="Unit">{request.unitNumber}</DetailField>
        <DetailField label="Priority">{priorityLabel[request.priority]}</DetailField>
        <DetailField label="Submitted">{request.createdAt}</DetailField>
        <div className="sm:col-span-2">
          <DetailField label="Description">{request.description}</DetailField>
        </div>
        <div className="sm:col-span-2">
          <DetailField label="Images">
            {request.images.length > 0 ? `${request.images.length} image(s) attached` : 'No images attached'}
          </DetailField>
        </div>
      </Card>

      <Card className="max-w-sm">
        <Text variant="h3" className="mb-3">
          Update status
        </Text>
        <div className="flex flex-col gap-3">
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as MaintenanceStatus)}
            options={statusOptions}
          />
          <Button onClick={handleSaveStatus} disabled={isSaving || status === savedStatus}>
            {isSaving ? 'Saving…' : 'Save status'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
