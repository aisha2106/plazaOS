import { useMemo, useState } from 'react'
import { Button, Card, Input, Select, Table, Text } from '../../components'
import type { TableColumn } from '../../components'
import { useMaintenance } from '../../hooks/useMaintenance'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_PAGE_SIZE, type MaintenanceRequest } from '../../lib/services/maintenanceService'

const columns: TableColumn<MaintenanceRequest>[] = [
  { key: 'title', header: 'Title' },
  { key: 'status', header: 'Status' },
]

export function Maintenance() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useMaintenance(page)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    const rows = data?.data ?? []
    return rows.filter((r) => {
      const matchesQuery = query ? r.title.toLowerCase().includes(query.toLowerCase()) || (r.description || '').toLowerCase().includes(query.toLowerCase()) : true
      const matchesStatus = statusFilter ? r.status === statusFilter : true
      return matchesQuery && matchesStatus
    })
  }, [data, query, statusFilter])

  const total = data?.total ?? 0
  const hasMore = page * DEFAULT_PAGE_SIZE < total

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Text variant="h1">Maintenance</Text>
        <Button variant="secondary" onClick={() => navigate('/tenant/maintenance/new')}>
          New request
        </Button>
      </div>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Input label="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In progress' },
              { value: 'resolved', label: 'Resolved' },
            ]}
          />
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
          <Table columns={columns} data={filtered} getRowKey={(r) => r.id} />
        )}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Prev
            </Button>
            <Button className="ml-2" onClick={() => setPage((p) => p + 1)} disabled={!hasMore}>
              Next
            </Button>
          </div>
          <Text variant="bodySmall">Page {page}</Text>
        </div>
      </Card>
    </div>
  )
}
