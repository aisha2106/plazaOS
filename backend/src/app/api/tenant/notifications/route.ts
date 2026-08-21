import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { Notification } from '@/models/Notification'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

export const GET = withErrorHandling(async (request: NextRequest) => {
  const auth = requireRole(request, 'tenant')

  await dbConnect()
  const docs = await Notification.find({ audience: 'tenant', recipientId: auth.sub }).sort({ date: -1 })

  return NextResponse.json(
    docs.map((doc) => ({
      id: doc._id.toString(),
      type: doc.type,
      title: doc.title,
      body: doc.body,
      date: doc.date,
      read: doc.read,
    })),
  )
})
