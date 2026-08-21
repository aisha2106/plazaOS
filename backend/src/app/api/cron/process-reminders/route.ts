import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { ApiError } from '@/lib/api-error'
import { processReminders } from '@/lib/process-reminders'
import { createAutomaticRentReminders } from '@/lib/auto-rent-reminders'
import { withErrorHandling } from '@/lib/route-handler'

// Triggered by Railway's Cron Job feature hitting this endpoint on a schedule
// (not an in-process `node-cron` timer — see BACKEND_BUILD_PLAN.md §8), so
// auth is a shared secret rather than a tenant/admin JWT.
export const POST = withErrorHandling(async (request: NextRequest) => {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get('authorization')
  if (!secret || header !== `Bearer ${secret}`) throw new ApiError('Unauthorized', 401)

  await dbConnect()
  // Auto-create reminders for newly due/overdue rent charges first, so they're
  // picked up by the send sweep in this same run rather than waiting a cycle.
  const { created } = await createAutomaticRentReminders()
  const result = await processReminders()
  return NextResponse.json({ ...result, created })
})
