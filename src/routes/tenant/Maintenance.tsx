import { useMemo, useState } from 'react'
import { Button, Card, Table, Text } from '../../components'
import { useMaintenance } from '../../hooks/useMaintenance'
import { useNavigate } from 'react-router-dom'

export function Maintenance() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useMaintenance(page)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    const rows = data?.data ?? []
    return rows.filter((r: any) => {
      const matchesQuery = query ? r.title.toLowerCase().includes(query.toLowerCase()) || (r.description || '').toLowerCase().includes(query.toLowerCase()) : true
      const matchesStatus = statusFilter ? r.status === statusFilter : true
      return matchesQuery && matchesStatus
    })
  }, [data, query, statusFilter])

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
          <input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-[44px] rounded-button border px-3" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-[44px] rounded-button border px-3">
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
          <Table columns={[{ key: 'title', header: 'Title' }, { key: 'status', header: 'Status' }]} data={filtered} getRowKey={(r: any) => r.id} />
        )}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <Button className="ml-2" onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
          <Text variant="bodySmall">Page {page}</Text>
        </div>
      </Card>
    </div>
  )
}
