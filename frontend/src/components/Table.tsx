import { useMemo, useState, type ReactNode } from 'react'

export interface TableColumn<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (row: T) => ReactNode
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  getRowKey: (row: T) => string
  emptyMessage?: string
}

type SortDirection = 'asc' | 'desc'

function getCellValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key]
}

export function Table<T>({ columns, data, getRowKey, emptyMessage = 'No data available' }: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const comparison = String(getCellValue(a, sortKey) ?? '').localeCompare(String(getCellValue(b, sortKey) ?? ''), undefined, {
        numeric: true,
      })
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortKey, sortDirection])

  function handleSort(column: TableColumn<T>) {
    if (!column.sortable) return
    if (sortKey === column.key) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(column.key)
      setSortDirection('asc')
    }
  }

  return (
    <div className="overflow-x-auto rounded-card border border-slate-200">
      <table className="w-full text-left text-[15px]">
        <thead className="bg-slate-200/40">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                onClick={() => handleSort(column)}
                className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 ${
                  column.sortable ? 'cursor-pointer select-none' : ''
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {column.header}
                  {column.sortable && sortKey === column.key ? (sortDirection === 'asc' ? '▲' : '▼') : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr key={getRowKey(row)} className="border-t border-slate-200">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-slate-900">
                    {column.render ? column.render(row) : String(getCellValue(row, column.key) ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
