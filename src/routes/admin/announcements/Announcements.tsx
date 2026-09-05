import { useState, type FormEvent } from 'react'
import { Button, Card, Input, StatusBadge, Text } from '../../../components'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { TenantMultiSelect } from '../components/TenantMultiSelect'
import { Textarea } from '../components/Textarea'
import { mockAnnouncements, mockTenants } from '../data/mockData'
import type { Announcement, AnnouncementAudience } from '../data/types'

const audienceOptions: { value: AnnouncementAudience; label: string }[] = [
  { value: 'all', label: 'All tenants' },
  { value: 'selected', label: 'Selected tenants' },
]

function audienceLabel(announcement: Announcement): string {
  if (announcement.audience === 'all') return 'All tenants'
  return `${announcement.audienceTenantIds.length} tenant${announcement.audienceTenantIds.length === 1 ? '' : 's'}`
}

// TODO: fetch from GET /announcements and submit new ones to POST /announcements
// once the backend is reachable — new posts are only kept in local state for now.
export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<AnnouncementAudience>('all')
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    const newAnnouncement: Announcement = {
      id: `announce-${Date.now()}`,
      title,
      body,
      audience,
      audienceTenantIds: audience === 'selected' ? selectedTenantIds : [],
      createdAt: new Date().toISOString().slice(0, 10),
      author: 'Admin',
    }
    window.setTimeout(() => {
      setAnnouncements((current) => [newAnnouncement, ...current])
      setTitle('')
      setBody('')
      setAudience('all')
      setSelectedTenantIds([])
      setIsSubmitting(false)
    }, 300)
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
            <TenantMultiSelect tenants={mockTenants} selectedTenantIds={selectedTenantIds} onChange={setSelectedTenantIds} />
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
