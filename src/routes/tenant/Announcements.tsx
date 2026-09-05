import { useMemo, useState } from 'react'
import { Button, Card, Text, StatusBadge, Input } from '../../components'
import { useAnnouncements } from '../../hooks/useAnnouncements'
import { formatDate } from '../../lib/formatting'

export function Announcements() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useAnnouncements(page)

  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    const rows = data?.data ?? []
    if (!query) return rows
    return rows.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()) || r.body.toLowerCase().includes(query.toLowerCase()))
  }, [data, query])
  const hasNextPage = page * 10 < (data?.total ?? 0)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Text variant="h1" className="mb-4">Announcements</Text>
        <Input
          label="Search"
          placeholder="Search announcements…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Text variant="body" className="text-slate-500">Loading announcements…</Text>
          </div>
        </Card>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <Text variant="bodySmall" className="text-danger font-medium">Failed to load announcements.</Text>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Text variant="h3" className="text-slate-400 mb-2">📢</Text>
            <Text variant="body" className="text-slate-600">No announcements found</Text>
            <Text variant="bodySmall" className="mt-1 text-slate-500">Try adjusting your search</Text>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => (
            <Card key={a.id} className="transition-all hover:shadow-md">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Text variant="h3" className="line-clamp-2">{a.title}</Text>
                      {a.important && <StatusBadge variant="warning" label="Important" className="flex-none" />}
                    </div>
                    <Text variant="caption" className="mt-1 text-slate-500">{formatDate(a.createdAt)}</Text>
                  </div>
                </div>

                {expanded[a.id] ? (
                  <Text variant="body" className="text-slate-700 leading-relaxed border-t border-slate-200 pt-4">
                    {a.body}
                  </Text>
                ) : (
                  <Text variant="body" className="text-slate-700 line-clamp-3">
                    {a.body}
                  </Text>
                )}

                {a.body.length > 200 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setExpanded((s) => ({ ...s, [a.id]: !s[a.id] }))}
                    className="mt-2"
                  >
                    {expanded[a.id] ? 'Show less' : 'Show more'}
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {/* Pagination */}
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
        </div>
      )}
    </div>
  )
}
