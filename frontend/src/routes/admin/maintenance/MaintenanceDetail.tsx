import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Card, Input, StatusBadge, Text } from '../../../components'
import { BackLink } from '../components/BackLink'
import { DetailField } from '../components/DetailField'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { Textarea } from '../components/Textarea'
import type { MaintenancePriority, MaintenanceRequest, MaintenanceStatus } from '../data/types'
import { getMaintenanceRequest, updateMaintenanceRequest } from './data'

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

const priorityOptions: { value: MaintenancePriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

// Fetches this request from GET /maintenance/:requestId and saves via PATCH
// — see getMaintenanceRequest()/updateMaintenanceRequest() in ./data.ts.
export function MaintenanceDetail() {
  const { requestId } = useParams<{ requestId: string }>()
  const [request, setRequest] = useState<MaintenanceRequest | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<MaintenanceStatus>('open')
  const [priority, setPriority] = useState<MaintenancePriority>('low')
  const [notes, setNotes] = useState('')
  const [resolvedAt, setResolvedAt] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!requestId) return
    let cancelled = false
    setLoading(true)
    getMaintenanceRequest(requestId)
      .then((found) => {
        if (cancelled) return
        setRequest(found)
        if (found) {
          setStatus(found.status)
          setPriority(found.priority)
          setNotes(found.notes ?? '')
          setResolvedAt(found.resolvedAt ?? null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [requestId])

  if (loading) {
    return (
      <div>
        <BackLink to="/admin/maintenance" label="Back to maintenance" />
        <Text variant="body">Loading…</Text>
      </div>
    )
  }

  if (!request) {
    return (
      <div>
        <BackLink to="/admin/maintenance" label="Back to maintenance" />
        <Text variant="body">Maintenance request not found.</Text>
      </div>
    )
  }

  const currentRequest = request

  const hasChanges =
    status !== currentRequest.status ||
    priority !== currentRequest.priority ||
    notes !== currentRequest.notes ||
    resolvedAt !== currentRequest.resolvedAt

  function handleStatusChange(nextStatus: MaintenanceStatus) {
    setStatus(nextStatus)
    if (nextStatus === 'resolved' && !resolvedAt) {
      setResolvedAt(new Date().toISOString().slice(0, 10))
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const updated = await updateMaintenanceRequest(currentRequest.id, {
        status,
        priority,
        notes,
        resolvedAt: status === 'resolved' ? resolvedAt : null,
      })
      if (updated) setRequest(updated)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <BackLink to="/admin/maintenance" label="Back to maintenance" />
      <PageHeader
        title={currentRequest.title}
        action={<StatusBadge variant={statusVariant[currentRequest.status]} label={statusLabel[currentRequest.status]} />}
      />

      <Card className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <DetailField label="Tenant">
          <Link to={`/admin/tenants/${currentRequest.tenantId}`} className="text-primary hover:text-primary-light">
            {currentRequest.tenantName}
          </Link>
        </DetailField>
        <DetailField label="Unit">
          <Link to={`/admin/units/${currentRequest.unitId}`} className="text-primary hover:text-primary-light">
            {currentRequest.unitNumber}
          </Link>
        </DetailField>
        <DetailField label="Submitted">{currentRequest.createdAt}</DetailField>
        <DetailField label="Priority">{priorityLabel[currentRequest.priority]}</DetailField>
        <div className="sm:col-span-2">
          <DetailField label="Description">{currentRequest.description}</DetailField>
        </div>
        <div className="sm:col-span-2">
          <DetailField label="Photos">
            {currentRequest.images.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-3">
                {currentRequest.images.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt={`Submitted photo for ${currentRequest.title}`}
                    className="max-h-80 rounded-card border border-slate-200 object-cover"
                  />
                ))}
              </div>
            ) : (
              'No photos submitted'
            )}
          </DetailField>
        </div>
      </Card>

      <Card className="max-w-lg">
        <Text variant="h3" className="mb-3">
          Update request
        </Text>
        <div className="flex flex-col gap-4">
          <Select
            label="Status"
            value={status}
            onChange={(event) => handleStatusChange(event.target.value as MaintenanceStatus)}
            options={statusOptions}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as MaintenancePriority)}
            options={priorityOptions}
          />
          {status === 'resolved' ? (
            <Input
              label="Resolved on"
              type="date"
              value={resolvedAt ?? ''}
              onChange={(event) => setResolvedAt(event.target.value || null)}
            />
          ) : null}
          <Textarea
            label="Notes"
            placeholder="Internal notes about this request"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
