import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { Notification } from '@/models/Notification'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = requireRole(request, 'admin')

  await dbConnect()
  await Notification.updateMany(
    { audience: 'admin', $or: [{ recipientId: null }, { recipientId: auth.sub }], read: false },
    { $set: { read: true } },
  )

  return NextResponse.json({ success: true })
})
