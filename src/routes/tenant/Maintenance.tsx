import { useMemo, useState } from 'react'
import { Button, Card, StatusBadge, Table, Text } from '../../components'
import { useMaintenance } from '../../hooks/useMaintenance'
import { useNavigate } from 'react-router-dom'
import type { MaintenanceRequest, MaintenanceStatus } from '../../lib/types'

const statusVariantMap: Record<MaintenanceStatus, 'info' | 'warning' | 'success'> = {
  open: 'info',
  in_progress: 'warning',
  closed: 'success',
}

export function Maintenance() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useMaintenance(page)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | ''>('')

  const filtered = useMemo(() => {
    const rows: MaintenanceRequest[] = data?.data ?? []
    return rows.filter((r) => {
      const matchesQuery = query
        ? r.title.toLowerCase().includes(query.toLowerCase()) || (r.description || '').toLowerCase().includes(query.toLowerCase())
        : true
      const matchesStatus = statusFilter ? r.status === statusFilter : true
      return matchesQuery && matchesStatus
    })
  }, [data, query, statusFilter])
  const hasNextPage = page * 10 < (data?.total ?? 0)

  return (
    <div className="px-4 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Text variant="h1">Maintenance</Text>
        <Button variant="secondary" onClick={() => navigate('/tenant/maintenance/new')}>
          New request
        </Button>
      </div>

      <Card>
        <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input aria-label="Search maintenance requests" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-[44px] w-full rounded-button border px-3" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus)} className="min-h-[44px] w-full rounded-button border px-3 sm:w-auto">
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {isLoading ? (
          <Text variant="body">Loading…</Text>
        ) : isError ? (
          <div className="flex items-center justify-between">
            <Text variant="bodySmall" className="text-danger">Failed to load maintenance requests.</Text>
            <div>
              <Button variant="secondary" onClick={() => refetch()}>Retry</Button>
            </div>
          </div>
        ) : (
          <Table<MaintenanceRequest>
            columns={[
              { key: 'title', header: 'Title' },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge variant={statusVariantMap[row.status]} label={row.status} /> },
            ]}
            data={filtered}
            getRowKey={(r) => r.id}
          />
        )}
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Prev
            </Button>
            <Button onClick={() => setPage((p) => p + 1)} disabled={!hasNextPage}>
              Next
            </Button>
          </div>
          <Text variant="bodySmall">Page {page}</Text>
        </div>
      </Card>
    </div>
  )
}
