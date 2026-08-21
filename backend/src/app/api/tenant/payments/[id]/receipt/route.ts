import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { Payment } from '@/models/Payment'
import { ApiError } from '@/lib/api-error'
import { generateReceiptPdf } from '@/lib/receipt-pdf'
import { verifyReceiptToken } from '@/lib/receipt-token'
import { requireAuth, withErrorHandling, OPTIONS as corsOptions } from '@/lib/route-handler'

export { corsOptions as OPTIONS }

// Accepts either a normal Bearer session token OR a short-lived `?token=`
// receipt token (see lib/receipt-token.ts) so a plain `<a href>` download
// link works without an Authorization header.
export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  const queryToken = request.nextUrl.searchParams.get('token')
  const tenantId = queryToken ? verifyReceiptToken(queryToken, id) : requireAuth(request).sub

  await dbConnect()
  const payment = await Payment.findById(id).catch(() => null)
  if (!payment || payment.tenantId.toString() !== tenantId) throw new ApiError('Not found', 404)
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
