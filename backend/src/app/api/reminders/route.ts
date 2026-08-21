import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { dbConnect } from '@/lib/db'
import { Reminder } from '@/models/Reminder'
import { User } from '@/models/User'
import { ApiError } from '@/lib/api-error'
import { escapeRegex, parsePageParams } from '@/lib/list-query'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

function toPublicReminder(doc: any) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    message: doc.message,
    type: doc.type,
    target: doc.target,
    targetLabel: doc.targetLabel,
    scheduledFor: doc.scheduledFor,
    status: doc.status,
  }
}

const SORT_FIELDS = ['scheduledFor', 'title', 'status'] as const

// Lists both automatic reminders (created by src/lib/auto-rent-reminders.ts)
// and manual ones (created by POST below) — both are stored in the same
// `Reminder` collection, distinguished by `type`.
export const GET = withErrorHandling(async (request: NextRequest) => {
  requireRole(request, 'admin')
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim() ?? ''
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const sortBy = searchParams.get('sortBy') ?? 'scheduledFor'
  const sortDir = searchParams.get('sortDir') === 'desc' ? -1 : 1
  const { page, pageSize } = parsePageParams(searchParams)

  if (!SORT_FIELDS.includes(sortBy as (typeof SORT_FIELDS)[number])) throw new ApiError(`Invalid sortBy: ${sortBy}`, 400)

  await dbConnect()
  const filter: Record<string, unknown> = {}
  if (search) {
    const regex = { $regex: escapeRegex(search), $options: 'i' }
    filter.$or = [{ title: regex }, { targetLabel: regex }]
  }
  if (status && status !== 'all') filter.status = status
  if (type && type !== 'all') filter.type = type

  const [docs, total] = await Promise.all([
    Reminder.find(filter)
      .sort({ [sortBy]: sortDir })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Reminder.countDocuments(filter),
  ])

  return NextResponse.json({ data: docs.map(toPublicReminder), total, page, pageSize })
})

// `type` is always `'manual'` here — automatic reminders are only ever
// created by the rent-due sweep (src/lib/auto-rent-reminders.ts). The actual
// sending happens later via the existing cron sweep (processReminders() in
// src/lib/process-reminders.ts), which picks up ANY scheduled reminder
// regardless of type once its `scheduledFor` date arrives.
const createReminderSchema = z
  .object({
    title: z.string().min(1),
    message: z.string().min(1),
    target: z.enum(['tenant', 'group', 'everyone']),
    tenantId: z.string().min(1).optional(),
    groupTenantIds: z.array(z.string().min(1)).optional(),
    scheduledFor: z.string().min(1),
  })
  .strict()
  .refine((body) => body.target !== 'tenant' || Boolean(body.tenantId), {
    message: 'tenantId is required when target is "tenant"',
    path: ['tenantId'],
  })
  .refine((body) => body.target !== 'group' || (body.groupTenantIds?.length ?? 0) > 0, {
    message: 'groupTenantIds is required when target is "group"',
    path: ['groupTenantIds'],
  })

export const POST = withErrorHandling(async (request: NextRequest) => {
  requireRole(request, 'admin')
  const body = await request.json().catch(() => null)
  const parsed = createReminderSchema.safeParse(body)
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid reminder', 400)

  await dbConnect()

  let targetTenantIds: string[] = []
  let targetLabel = 'All tenants'
  if (parsed.data.target === 'tenant') {
    const tenant = await User.findOne({ _id: parsed.data.tenantId, role: 'tenant' })
    if (!tenant) throw new ApiError('Tenant not found', 404)
    targetTenantIds = [tenant._id.toString()]
    targetLabel = tenant.name
  } else if (parsed.data.target === 'group') {
    const tenants = await User.find({ _id: { $in: parsed.data.groupTenantIds }, role: 'tenant' })
    if (tenants.length === 0) throw new ApiError('No matching tenants found', 404)
    targetTenantIds = tenants.map((tenant) => tenant._id.toString())
    targetLabel = `${tenants.length} tenant${tenants.length === 1 ? '' : 's'}`
  }

  const doc = await Reminder.create({
    title: parsed.data.title,
    message: parsed.data.message,
    type: 'manual',
    target: parsed.data.target,
    targetTenantIds,
    targetLabel,
    scheduledFor: parsed.data.scheduledFor,
    status: 'scheduled',
  })

  return NextResponse.json({ success: true, id: doc._id.toString() })
})
