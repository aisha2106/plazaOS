import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { Announcement } from '@/models/Announcement'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

function toPublicAnnouncement(doc: any) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    body: doc.body,
    important: doc.important,
    createdAt: doc.createdAt.toISOString().slice(0, 10),
  }
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const auth = requireRole(request, 'tenant')
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 10))

  await dbConnect()
  const filter = {
    $or: [{ audience: 'all' }, { audience: 'selected', audienceTenantIds: auth.sub }],
  }
  const [docs, total] = await Promise.all([
    Announcement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Announcement.countDocuments(filter),
  ])

  return NextResponse.json({ data: docs.map(toPublicAnnouncement), total })
})
