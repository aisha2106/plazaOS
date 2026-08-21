import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { Payment } from '@/models/Payment'
import { ApiError } from '@/lib/api-error'
import { buildReceiptUrl } from '@/lib/receipt-token'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = requireRole(request, 'tenant')
  const { id } = await params

  await dbConnect()
  const payment = await Payment.findById(id).catch(() => null)
  if (!payment || payment.tenantId.toString() !== auth.sub) throw new ApiError('Not found', 404)

  return NextResponse.json({
    id: payment._id.toString(),
    amount: payment.amount,
    date: payment.date,
    method: payment.method,
    status: payment.status,
    receiptUrl:
      payment.status === 'paid'
        ? buildReceiptUrl(request.nextUrl.origin, payment._id.toString(), payment.tenantId.toString())
        : undefined,
  })
})
