import { Link, useSearchParams } from 'react-router-dom'
import { Button, Input, StatusBadge, Table, Text } from '../../../components'
import type { TableColumn } from '../../../components'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { useAsyncData } from '../components/useAsyncData'
import type { MaintenancePriority, MaintenanceRequest, MaintenanceStatus } from '../data/types'
import { getMaintenanceRequests, type GetMaintenanceRequestsResult, type MaintenanceSortField, type SortDirection } from './data'

const PAGE_SIZE = 20

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

const statusOptions: { value: 'all' | MaintenanceStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

const priorityOptions: { value: 'all' | MaintenancePriority; label: string }[] = [
  { value: 'all', label: 'All priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const sortOptions: { value: MaintenanceSortField; label: string }[] = [
  { value: 'createdAt', label: 'Submitted date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
]

// NOTE: same reasoning as Units/Tenants — the shared Table sorts its `data`
// prop client-side with fully internal state, so it's only correct for one
// page of rows. Columns aren't marked sortable; the "Sort by" control below
// drives getMaintenanceRequests() and the URL instead.
const columns: TableColumn<MaintenanceRequest>[] = [
  {
    key: 'title',
    header: 'Request',
    render: (request) => (
      <Link to={`/admin/maintenance/${request.id}`} className="font-medium text-primary hover:text-primary-light">
        {request.title}
      </Link>
    ),
  },
  { key: 'tenantName', header: 'Tenant' },
  { key: 'unitNumber', header: 'Unit' },
  { key: 'priority', header: 'Priority', render: (request) => priorityLabel[request.priority] },
  { key: 'createdAt', header: 'Submitted' },
  {
    key: 'status',
    header: 'Status',
    render: (request) => <StatusBadge variant={statusVariant[request.status]} label={statusLabel[request.status]} />,
  },
]

// Fetches maintenance requests from GET /maintenance (see getMaintenanceRequests() in ./data.ts).
export function MaintenanceList() {
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const status = (searchParams.get('status') as 'all' | MaintenanceStatus | null) ?? 'all'
  const priority = (searchParams.get('priority') as 'all' | MaintenancePriority | null) ?? 'all'
  const sortBy = (searchParams.get('sortBy') as MaintenanceSortField | null) ?? 'createdAt'
  const sortDir = (searchParams.get('sortDir') as SortDirection | null) ?? 'asc'
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  const { data: result } = useAsyncData<GetMaintenanceRequestsResult>(
    () => getMaintenanceRequests({ search, status, priority, sortBy, sortDir, page, pageSize: PAGE_SIZE }),
    [search, status, priority, sortBy, sortDir, page],
    { data: [], total: 0, page, pageSize: PAGE_SIZE },
  )
  const { data, total, pageSize } = result

  // Any filter/sort change goes back to page 1; page navigation is handled separately below.
  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }
    next.delete('page')
    setSearchParams(next, { replace: true })
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    if (nextPage <= 1) {
      next.delete('page')
    } else {
      next.set('page', String(nextPage))
    }
    setSearchParams(next, { replace: true })
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, total)

  return (
    <div>
      <PageHeader title="Maintenance requests" description="Tenant-submitted requests and their current status." />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Input
            label="Search"
            placeholder="Search by request or tenant"
            value={search}
            onChange={(event) => updateParams({ search: event.target.value || null })}
          />
        </div>
        <div className="w-44">
          <Select
            label="Status"
            value={status}
            onChange={(event) => updateParams({ status: event.target.value === 'all' ? null : event.target.value })}
            options={statusOptions}
          />
        </div>
        <div className="w-40">
          <Select
            label="Priority"
            value={priority}
            onChange={(event) => updateParams({ priority: event.target.value === 'all' ? null : event.target.value })}
            options={priorityOptions}
          />
        </div>
        <div className="w-44">
          <Select
            label="Sort by"
            value={sortBy}
            onChange={(event) => updateParams({ sortBy: event.target.value === 'createdAt' ? null : event.target.value })}
            options={sortOptions}
          />
        </div>
        <Button variant="secondary" onClick={() => updateParams({ sortDir: sortDir === 'asc' ? 'desc' : null })}>
          {sortDir === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
        </Button>
      </div>

      <Table columns={columns} data={data} getRowKey={(request) => request.id} emptyMessage="No maintenance requests match these filters" />

      <div className="mt-4 flex items-center justify-between">
        <Text variant="bodySmall" className="text-slate-500">
          Showing {rangeStart}–{rangeEnd} of {total} requests
        </Text>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
            Previous
          </Button>
          <Text variant="bodySmall" className="text-slate-500">
            Page {page} of {totalPages}
          </Text>
          <Button variant="secondary" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
