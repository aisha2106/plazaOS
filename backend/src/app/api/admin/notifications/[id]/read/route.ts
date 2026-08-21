import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { Notification } from '@/models/Notification'
import { ApiError } from '@/lib/api-error'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

export const POST = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = requireRole(request, 'admin')
  const { id } = await params

  await dbConnect()
  const doc = await Notification.findOne({
    _id: id,
    audience: 'admin',
    $or: [{ recipientId: null }, { recipientId: auth.sub }],
  }).catch(() => null)
  if (!doc) throw new ApiError('Not found', 404)

  doc.read = true
  await doc.save()

  return NextResponse.json({ success: true })
})
