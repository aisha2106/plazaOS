import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { Reminder } from '@/models/Reminder'
import { ApiError } from '@/lib/api-error'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  requireRole(request, 'admin')
  const { id } = await params
  await dbConnect()
  const doc = await Reminder.findById(id).catch(() => null)
  if (!doc) throw new ApiError('Reminder not found', 404)

  return NextResponse.json({
    id: doc._id.toString(),
    title: doc.title,
    message: doc.message,
    type: doc.type,
    target: doc.target,
    targetLabel: doc.targetLabel,
    scheduledFor: doc.scheduledFor,
    status: doc.status,
  })
})
