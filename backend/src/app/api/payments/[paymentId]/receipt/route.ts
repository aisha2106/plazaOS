import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { Payment } from '@/models/Payment'
import { ApiError } from '@/lib/api-error'
import { generateReceiptPdf } from '@/lib/receipt-pdf'
import { requireRole, withErrorHandling, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

// Admin, any payment — part of §3.2's admin surface but grouped with the
// tenant receipt route here since both belong to §6 (receipts aren't
// gated behind the rest of the admin CRUD build-out).
export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ paymentId: string }> }) => {
  requireRole(request, 'admin')
  const { paymentId } = await params

  await dbConnect()
  const payment = await Payment.findById(paymentId).catch(() => null)
  if (!payment) throw new ApiError('Not found', 404)
  if (payment.status !== 'paid') throw new ApiError('Receipt not available for this payment', 404)

  const pdf = await generateReceiptPdf({
    receiptNumber: payment._id.toString().slice(-8).toUpperCase(),
    tenantName: payment.tenantName,
    unitNumber: payment.unitNumber,
    amount: payment.amount,
    date: payment.date,
    method: payment.method,
  })

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receipt-${payment._id.toString()}.pdf"`,
    },
  })
})
