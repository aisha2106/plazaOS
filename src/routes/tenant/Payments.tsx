import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Modal, Table, Text, StatusBadge } from '../../components'
import type { TableColumn } from '../../components'
import { usePayments } from '../../hooks/usePayments'
import type { Payment, PaymentStatus } from '../../lib/types'

const statusVariantMap: Record<PaymentStatus, 'success' | 'info' | 'danger'> = {
  paid: 'success',
  pending: 'info',
  overdue: 'danger',
}

export function Payments() {
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = usePayments(page)

  const columns: TableColumn<Payment>[] = [
    { key: 'date', header: 'Date' },
    { key: 'amount', header: 'Amount' },
    {
      key: 'status',
      header: 'Status',
      render: (row: Payment) => <StatusBadge variant={statusVariantMap[row.status]} label={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row: Payment) => (
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setSelected(row)}>
            View
          </Button>
          {row.receiptUrl ? (
            <a href={row.receiptUrl} target="_blank" rel="noreferrer" className="text-primary">
              Receipt
            </a>
          ) : null}
        </div>
      ),
    },
  ]

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('')
  const [selected, setSelected] = useState<Payment | null>(null)

  const filtered = useMemo(() => {
    const rows: Payment[] = data?.data ?? []
    return rows.filter((r) => {
      const matchesQuery = query ? String(r.amount).includes(query) || r.date.includes(query) : true
      const matchesStatus = statusFilter ? r.status === statusFilter : true
      return matchesQuery && matchesStatus
    })
  }, [data, query, statusFilter])
  const hasNextPage = page * 10 < (data?.total ?? 0)

  return (
    <div className="px-4 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Text variant="h1">Payments</Text>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => navigate('/tenant/payments/new')}>Pay Rent</Button>
        </div>
      </div>

      <Card>
        <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            aria-label="Search payments"
            placeholder="Search by date or amount"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[44px] w-full rounded-button border px-3"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PaymentStatus)} className="min-h-[44px] w-full rounded-button border px-3 sm:w-auto">
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {isLoading ? (
          <Text variant="body">Loading…</Text>
        ) : isError ? (
          <div className="flex items-center justify-between">
            <Text variant="bodySmall" className="text-danger">Failed to load payments.</Text>
            <div>
              <Button variant="secondary" onClick={() => refetch()}>Retry</Button>
            </div>
          </div>
        ) : (
          <Table<Payment>
            columns={columns}
            data={filtered}
            getRowKey={(r) => r.id}
          />
        )}

        {/* Details modal */}
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Payment details">
          {selected ? (
            <div className="flex flex-col gap-3">
              <Text variant="body">Date: {selected.date}</Text>
              <Text variant="body">Amount: ${selected.amount}</Text>
              <Text variant="body">Status: {selected.status}</Text>
              {selected.receiptUrl ? (
                <a href={selected.receiptUrl} target="_blank" rel="noreferrer" className="text-primary">
                  Download receipt
                </a>
              ) : (
                <Text variant="bodySmall">Receipt unavailable</Text>
              )}
            </div>
          ) : null}
        </Modal>
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
