import { useMemo, useState } from 'react'
import { Button, Card, Input, Text, StatusBadge } from '../../components'
import { useAnnouncements } from '../../hooks/useAnnouncements'
import { DEFAULT_PAGE_SIZE } from '../../lib/services/announcementService'

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

  const total = data?.total ?? 0
  const hasMore = page * DEFAULT_PAGE_SIZE < total

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Text variant="h1">Announcements</Text>
        <Input label="Search announcements" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <Card>
        {isLoading ? (
          <Text variant="body">Loading…</Text>
        ) : isError ? (
          <div className="flex items-center justify-between">
            <Text variant="bodySmall" className="text-danger">Failed to load announcements.</Text>
            <div>
              <Button variant="secondary" onClick={() => refetch()}>Retry</Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <Text variant="bodySmall">No announcements</Text>
        ) : (
          <div className="space-y-4">
            {filtered.map((a) => (
              <div key={a.id} className="rounded p-3 border">
                <div className="flex items-center justify-between">
                  <div>
                    <Text variant="h3">{a.title}</Text>
                    <Text variant="bodySmall" className="text-slate-500">{a.createdAt}</Text>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.important ? <StatusBadge variant="warning" label="Important" /> : null}
                    <Button variant="secondary" onClick={() => setExpanded((s) => ({ ...s, [a.id]: !s[a.id] }))}>
                      {expanded[a.id] ? 'Collapse' : 'Expand'}
                    </Button>
                  </div>
                </div>
                {expanded[a.id] ? <Text variant="body" className="mt-2">{a.body}</Text> : null}
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Prev
            </Button>
            <Button onClick={() => setPage((p) => p + 1)} disabled={!hasMore}>
              Next
            </Button>
          </div>
          <Text variant="bodySmall">Page {page}</Text>
        </div>
      </Card>
    </div>
  )
}
