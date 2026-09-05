import { useMemo, useState } from 'react'
import { Button, Card, StatusBadge, Table, Text, Input } from '../../components'
import { useMaintenance } from '../../hooks/useMaintenance'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '../../lib/formatting'
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Text variant="h1">Maintenance Requests</Text>
        <Button onClick={() => navigate('/tenant/maintenance/new')}>
          Submit Request
        </Button>
      </div>

      <Card>
        <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <Input
              label="Search"
              placeholder="Search by title or description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-900">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus)}
              className="min-h-[44px] rounded-button border border-slate-300 px-4 py-2 text-[15px] text-slate-900 hover:border-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-1"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Text variant="body" className="text-slate-500">Loading maintenance requests…</Text>
          </div>
        ) : isError ? (
          <Card className="border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <Text variant="bodySmall" className="text-danger font-medium">Failed to load maintenance requests.</Text>
              <Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Text variant="h3" className="text-slate-400 mb-2">🔍</Text>
            <Text variant="body" className="text-slate-600">No maintenance requests found</Text>
            <Text variant="bodySmall" className="mt-1 text-slate-500">Try adjusting your filters or submit a new request</Text>
          </div>
        ) : (
          <Table<MaintenanceRequest>
            columns={[
              { key: 'title', header: 'Title' },
              { key: 'createdAt', header: 'Date', render: (row) => formatDate(row.createdAt) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge variant={statusVariantMap[row.status]} label={row.status} /> },
            ]}
            data={filtered}
            getRowKey={(r) => r.id}
          />
        )}

        {!isError && filtered.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-6">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                ← Previous
              </Button>
              <Button size="sm" onClick={() => setPage((p) => p + 1)} disabled={!hasNextPage}>
                Next →
              </Button>
            </div>
            <Text variant="bodySmall" className="text-slate-600">Page {page}</Text>
          </div>
        )}
      </Card>
    </div>
  )
}
