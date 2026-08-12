import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { dbConnect } from '@/lib/db'
import { Payment } from '@/models/Payment'
import { User } from '@/models/User'
import { ApiError } from '@/lib/api-error'
import { buildReceiptUrl } from '@/lib/receipt-token'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

function toPublicPayment(payment: any, origin: string) {
  return {
    id: payment._id.toString(),
    amount: payment.amount,
    date: payment.date,
    method: payment.method,
    status: payment.status,
    receiptUrl: payment.status === 'paid' ? buildReceiptUrl(origin, payment._id.toString(), payment.tenantId.toString()) : undefined,
  }
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const auth = requireRole(request, 'tenant')
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 10))

  await dbConnect()
  const filter = { tenantId: auth.sub }
  const [docs, total] = await Promise.all([
    Payment.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Payment.countDocuments(filter),
  ])

  return NextResponse.json({ data: docs.map((doc) => toPublicPayment(doc, request.nextUrl.origin)), total })
})

const createPaymentSchema = z
  .object({
    amount: z.number().positive(),
  })
  .strict()

// NOTE: no payment gateway is wired up yet (see BACKEND_BUILD_PLAN.md §7) — this
// creates a `pending` record so the route's shape/contract is already correct;
// a follow-up pass replaces the body of this handler with a real gateway call
// before responding `{ success: true }`, per the plan's explicit trust fix.
export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = requireRole(request, 'tenant')
  const body = await request.json().catch(() => null)
  const parsed = createPaymentSchema.safeParse(body)
  if (!parsed.success) throw new ApiError('A positive payment amount is required', 400)

  await dbConnect()
  const user = await User.findById(auth.sub)
  if (!user) throw new ApiError('Not found', 404)

  const payment = await Payment.create({
    tenantId: user._id,
    tenantName: user.name,
    unitId: user.unitId,
    unitNumber: user.unitNumber ?? 'unassigned',
    amount: parsed.data.amount,
    method: 'gateway',
    status: 'pending',
    date: new Date().toISOString().slice(0, 10),
  })

  return NextResponse.json({ success: true, id: payment._id.toString() })
})
