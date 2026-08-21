import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { dbConnect } from '@/lib/db'
import { Announcement } from '@/models/Announcement'
import { User } from '@/models/User'
import { ApiError } from '@/lib/api-error'
import { parsePageParams } from '@/lib/list-query'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

function toPublicAnnouncement(doc: any) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    body: doc.body,
    audience: doc.audience,
    audienceTenantIds: (doc.audienceTenantIds ?? []).map((id: unknown) => String(id)),
    createdAt: doc.createdAt.toISOString().slice(0, 10),
    author: doc.author,
  }
}

// Admin-wide view/creation — separate from `GET /tenant/announcements`,
// which is scoped to announcements addressed to the authenticated tenant.
export const GET = withErrorHandling(async (request: NextRequest) => {
  requireRole(request, 'admin')
  const { searchParams } = new URL(request.url)
  const { page, pageSize } = parsePageParams(searchParams)

  await dbConnect()
  const [docs, total] = await Promise.all([
    Announcement.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Announcement.countDocuments({}),
  ])

  return NextResponse.json({ data: docs.map(toPublicAnnouncement), total, page, pageSize })
})

const createAnnouncementSchema = z
  .object({
    title: z.string().min(1),
    body: z.string().min(1),
    audience: z.enum(['all', 'selected']),
    audienceTenantIds: z.array(z.string().min(1)).optional(),
  })
  .strict()
  .refine((body) => body.audience !== 'selected' || (body.audienceTenantIds?.length ?? 0) > 0, {
    message: 'audienceTenantIds is required when audience is "selected"',
    path: ['audienceTenantIds'],
  })

export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = requireRole(request, 'admin')
  const body = await request.json().catch(() => null)
  const parsed = createAnnouncementSchema.safeParse(body)
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid announcement', 400)

  await dbConnect()
  const admin = await User.findById(auth.sub)

  const doc = await Announcement.create({
    title: parsed.data.title,
    body: parsed.data.body,
    audience: parsed.data.audience,
    audienceTenantIds: parsed.data.audience === 'selected' ? parsed.data.audienceTenantIds : [],
    author: admin?.name ?? 'Admin',
  })

  return NextResponse.json({ success: true, id: doc._id.toString() })
})
