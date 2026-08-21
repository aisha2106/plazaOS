import { Payment } from '@/models/Payment'
import { RentCharge } from '@/models/RentCharge'
import { notifyPaymentOutcome } from './notify-payment'

// Shared by the webhook and the tenant-facing verify-on-return route, so both
// paths settle a gateway payment identically and idempotently.
export async function settlePaymentByReference(gatewayReference: string, outcome: 'paid' | 'failed'): Promise<void> {
  const payment = await Payment.findOne({ gatewayReference })
  // Unknown reference, or already settled — never re-process a terminal payment.
  if (!payment || payment.status !== 'pending') return

  payment.status = outcome
  await payment.save()

  // A failed payment must never mark its RentCharge paid.
  if (outcome === 'paid' && payment.rentChargeId) {
    await RentCharge.findOneAndUpdate({ _id: payment.rentChargeId, status: { $ne: 'paid' } }, { status: 'paid' })
  }

  await notifyPaymentOutcome(payment, outcome)
}
