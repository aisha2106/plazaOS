import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { Notification } from '@/models/Notification'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = requireRole(request, 'tenant')

  await dbConnect()
  await Notification.updateMany({ audience: 'tenant', recipientId: auth.sub, read: false }, { $set: { read: true } })

  return NextResponse.json({ success: true })
})
