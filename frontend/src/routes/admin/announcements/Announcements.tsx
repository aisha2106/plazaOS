import { useEffect, useState, type FormEvent } from 'react'
import { Button, Card, Input, StatusBadge, Text } from '../../../components'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { TenantMultiSelect } from '../components/TenantMultiSelect'
import { Textarea } from '../components/Textarea'
import { getTenants } from '../tenants/data'
import type { Announcement, AnnouncementAudience, Tenant } from '../data/types'
import { addAnnouncement, getAnnouncements } from './data'

const audienceOptions: { value: AnnouncementAudience; label: string }[] = [
  { value: 'all', label: 'All tenants' },
  { value: 'selected', label: 'Selected tenants' },
]

function audienceLabel(announcement: Announcement): string {
  if (announcement.audience === 'all') return 'All tenants'
  return `${announcement.audienceTenantIds.length} tenant${announcement.audienceTenantIds.length === 1 ? '' : 's'}`
}

// Fetches from GET /announcements and submits new ones to POST /announcements
// — see getAnnouncements()/addAnnouncement() in ./data.ts.
export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<AnnouncementAudience>('all')
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    getAnnouncements({ pageSize: 100 }).then((result) => {
      if (!cancelled) setAnnouncements(result.data)
    })
    getTenants({ pageSize: 1000 }).then((result) => {
      if (!cancelled) setTenants(result.data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const newAnnouncement = await addAnnouncement({
        title,
        body,
        audience,
        audienceTenantIds: audience === 'selected' ? selectedTenantIds : [],
      })
      setAnnouncements((current) => [newAnnouncement, ...current])
      setTitle('')
      setBody('')
      setAudience('all')
      setSelectedTenantIds([])
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div>
      <PageHeader title="Announcements" description="Post updates to all tenants or a selected group." />

      <Card className="mb-8 max-w-xl">
        <Text variant="h3" className="mb-3">
          New announcement
        </Text>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <Textarea label="Message" value={body} onChange={(event) => setBody(event.target.value)} required />
          <Select
            label="Audience"
            value={audience}
            onChange={(event) => setAudience(event.target.value as AnnouncementAudience)}
            options={audienceOptions}
          />
          {audience === 'selected' ? (
            <TenantMultiSelect tenants={tenants} selectedTenantIds={selectedTenantIds} onChange={setSelectedTenantIds} />
          ) : null}
          <Button type="submit" disabled={isSubmitting || (audience === 'selected' && selectedTenantIds.length === 0)}>
            {isSubmitting ? 'Posting…' : 'Post announcement'}
          </Button>
        </form>
      </Card>

      <Text variant="h3" className="mb-3">
        Posted announcements
      </Text>
      <div className="flex flex-col gap-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <div className="mb-1 flex items-center justify-between gap-4">
              <Text variant="h3">{announcement.title}</Text>
              <StatusBadge variant="info" label={audienceLabel(announcement)} />
            </div>
            <Text variant="body" className="text-slate-500">
              {announcement.body}
            </Text>
            <Text variant="caption" className="mt-2 text-slate-500">
              {announcement.createdAt} · {announcement.author}
            </Text>
          </Card>
        ))}
      </div>
    </div>
  )
}
