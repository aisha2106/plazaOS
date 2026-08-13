import { describe, it, expect, vi, beforeEach } from 'vitest'
import { settlePaymentByReference } from '@/lib/settle-payment'
import { Payment } from '@/models/Payment'
import { RentCharge } from '@/models/RentCharge'
import { notifyPaymentOutcome } from '@/lib/notify-payment'

vi.mock('@/models/Payment', () => ({ Payment: { findOne: vi.fn() } }))
vi.mock('@/models/RentCharge', () => ({ RentCharge: { findOneAndUpdate: vi.fn() } }))
vi.mock('@/lib/notify-payment', () => ({ notifyPaymentOutcome: vi.fn() }))

function makePendingPayment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    status: 'pending',
    rentChargeId: 'rent-charge-1',
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('settlePaymentByReference', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks the linked RentCharge paid only when the outcome is paid', async () => {
    const payment = makePendingPayment()
    vi.mocked(Payment.findOne).mockResolvedValue(payment as never)

    await settlePaymentByReference('ref-1', 'paid')

    expect(payment.status).toBe('paid')
    expect(payment.save).toHaveBeenCalledOnce()
    expect(RentCharge.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'rent-charge-1', status: { $ne: 'paid' } }, { status: 'paid' })
    expect(notifyPaymentOutcome).toHaveBeenCalledWith(payment, 'paid')
  })

  it('never marks the RentCharge paid on a failed outcome', async () => {
    const payment = makePendingPayment()
    vi.mocked(Payment.findOne).mockResolvedValue(payment as never)

    await settlePaymentByReference('ref-1', 'failed')

    expect(payment.status).toBe('failed')
    expect(RentCharge.findOneAndUpdate).not.toHaveBeenCalled()
  })

  it('is a no-op (idempotent) once the payment is no longer pending', async () => {
    const payment = makePendingPayment({ status: 'paid', save: vi.fn() })
    vi.mocked(Payment.findOne).mockResolvedValue(payment as never)

    // Simulates a duplicate/replayed Paystack webhook for an already-settled payment.
    await settlePaymentByReference('ref-1', 'paid')

    expect(payment.save).not.toHaveBeenCalled()
    expect(RentCharge.findOneAndUpdate).not.toHaveBeenCalled()
    expect(notifyPaymentOutcome).not.toHaveBeenCalled()
  })

  it('is a no-op for an unknown gateway reference', async () => {
    vi.mocked(Payment.findOne).mockResolvedValue(null as never)

    await settlePaymentByReference('unknown-ref', 'paid')

    expect(RentCharge.findOneAndUpdate).not.toHaveBeenCalled()
    expect(notifyPaymentOutcome).not.toHaveBeenCalled()
  })
})
