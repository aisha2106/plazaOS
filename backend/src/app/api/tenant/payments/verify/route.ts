import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { Payment } from '@/models/Payment'
import { ApiError } from '@/lib/api-error'
import { verifyTransaction } from '@/lib/paystack'
import { settlePaymentByReference } from '@/lib/settle-payment'
import { withErrorHandling, requireRole, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

// Called by the frontend once Paystack redirects the tenant back — a real
// status re-check via Paystack's Verify Transaction API, since Paystack
// doesn't reliably deliver a webhook for a failed/abandoned one-off charge.
export const GET = withErrorHandling(async (request: NextRequest) => {
  const auth = requireRole(request, 'tenant')
  const reference = request.nextUrl.searchParams.get('reference')
  if (!reference) throw new ApiError('A reference is required', 400)

  await dbConnect()
  const payment = await Payment.findOne({ gatewayReference: reference })
  if (!payment || payment.tenantId.toString() !== auth.sub) throw new ApiError('Payment not found', 404)

  if (payment.status === 'pending') {
    const result = await verifyTransaction(reference)
    await settlePaymentByReference(reference, result.status === 'success' ? 'paid' : 'failed')
  }

  const settled = await Payment.findById(payment._id)
  return NextResponse.json({ id: settled!._id.toString(), status: settled!.status })
})
