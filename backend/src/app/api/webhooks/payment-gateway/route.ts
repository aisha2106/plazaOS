import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { verifyPaystackSignature } from '@/lib/paystack'
import { settlePaymentByReference } from '@/lib/settle-payment'

// Called by Paystack's servers, not the browser — no CORS/Bearer auth here.
// Trust comes entirely from verifying the `x-paystack-signature` header below,
// so never process the body before that check succeeds.
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-paystack-signature')
  const rawBody = await request.text()

  if (!verifyPaystackSignature(rawBody, signature)) {
    console.error('Paystack webhook signature verification failed')
    return new NextResponse('Invalid signature', { status: 400 })
  }

  let event: { event: string; data: { reference: string } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Invalid payload', { status: 400 })
  }

  try {
    await dbConnect()

    // Paystack only reliably fires a webhook for a transaction that actually
    // succeeded — a failed/abandoned attempt is instead caught by the tenant
    // return-flow's `GET /tenant/payments/verify` re-check (see settle-payment.ts).
    if (event.event === 'charge.success') {
      await settlePaymentByReference(event.data.reference, 'paid')
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Failed to process Paystack webhook event', event.event, err)
    return new NextResponse('Webhook processing error', { status: 500 })
  }
}


