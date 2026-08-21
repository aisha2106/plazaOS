import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { Payment } from '@/models/Payment'
import { User } from '@/models/User'
import { ApiError } from '@/lib/api-error'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ paymentId: string }> }) => {
  requireRole(request, 'admin')
  const { paymentId } = await params

  await dbConnect()
  const payment = await Payment.findById(paymentId).catch(() => null)
  if (!payment) throw new ApiError('Payment not found', 404)

  const recordedByName = payment.recordedBy ? (await User.findById(payment.recordedBy))?.name : undefined

  return NextResponse.json({
    id: payment._id.toString(),
    tenantId: payment.tenantId.toString(),
    tenantName: payment.tenantName,
    unitNumber: payment.unitNumber,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    date: payment.date,
    note: payment.note,
    recordedBy: recordedByName,
    receiptAvailable: payment.status === 'paid',
  })
})
