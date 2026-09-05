import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Modal, Table, Text, StatusBadge, Input } from '../../components'
import type { TableColumn } from '../../components'
import { usePayments } from '../../hooks/usePayments'
import { formatNaira, formatDate } from '../../lib/formatting'
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
    {
      key: 'amount',
      header: 'Amount',
      render: (row: Payment) => formatNaira(row.amount),
    },
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Text variant="h1">Payments</Text>
        <Button onClick={() => navigate('/tenant/payments/new')}>Pay Rent</Button>
      </div>

      <Card>
        <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <Input
              label="Search"
              placeholder="Search by date or amount"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-900">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus)}
              className="min-h-[44px] rounded-button border border-slate-300 px-4 py-2 text-[15px] text-slate-900 hover:border-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-1"
            >
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Text variant="body" className="text-slate-500">Loading payments…</Text>
          </div>
        ) : isError ? (
          <Card className="border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <Text variant="bodySmall" className="text-danger font-medium">Failed to load payments.</Text>
              <Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Text variant="h3" className="text-slate-400 mb-2">💳</Text>
            <Text variant="body" className="text-slate-600">No payments found</Text>
            <Text variant="bodySmall" className="mt-1 text-slate-500">Try adjusting your filters</Text>
          </div>
        ) : (
          <Table<Payment>
            columns={columns}
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

      {/* Details modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Payment details">
        {selected ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
              <Text variant="bodySmall" className="text-slate-600">Amount</Text>
              <Text variant="h2" className="mt-1 text-primary font-bold">{formatNaira(selected.amount)}</Text>
            </div>
            <div>
              <Text variant="bodySmall" className="text-slate-600">Date</Text>
              <Text variant="body" className="mt-1 font-medium">{formatDate(selected.date)}</Text>
            </div>
            <div>
              <Text variant="bodySmall" className="text-slate-600">Status</Text>
              <div className="mt-1">
                <StatusBadge variant={statusVariantMap[selected.status]} label={selected.status} />
              </div>
            </div>
            {selected.receiptUrl ? (
              <a href={selected.receiptUrl} target="_blank" rel="noreferrer" className="rounded-button border border-primary bg-white px-4 py-2 text-center font-semibold text-primary hover:bg-indigo-50 transition-colors">
                Download receipt
              </a>
            ) : (
              <Text variant="bodySmall" className="text-slate-500">Receipt unavailable</Text>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
