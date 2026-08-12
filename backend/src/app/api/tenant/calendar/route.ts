import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { CalendarEvent } from '@/models/CalendarEvent'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

export const GET = withErrorHandling(async (request: NextRequest) => {
  const auth = requireRole(request, 'tenant')

  await dbConnect()
  const docs = await CalendarEvent.find({
    $or: [{ tenantId: auth.sub }, { tenantId: null }],
  }).sort({ date: 1 })

  return NextResponse.json(
    docs.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      date: doc.date,
      type: doc.type,
    })),
  )
})
