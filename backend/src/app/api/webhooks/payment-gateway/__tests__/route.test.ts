import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/webhooks/payment-gateway/route'
import { verifyPaystackSignature } from '@/lib/paystack'
import { settlePaymentByReference } from '@/lib/settle-payment'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/lib/paystack', () => ({ verifyPaystackSignature: vi.fn() }))
vi.mock('@/lib/settle-payment', () => ({ settlePaymentByReference: vi.fn() }))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/webhooks/payment-gateway', {
    method: 'POST',
    headers: { 'x-paystack-signature': 'valid-signature' },
    body: JSON.stringify(body),
  }) as never
}

describe('POST /webhooks/payment-gateway', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(verifyPaystackSignature).mockReturnValue(true)
  })

  it('settles the payment on charge.success', async () => {
    const response = await POST(makeRequest({ event: 'charge.success', data: { reference: 'ref-1' } }))
    expect(response.status).toBe(200)
    expect(settlePaymentByReference).toHaveBeenCalledWith('ref-1', 'paid')
  })

  it('is harmless when the same event is delivered twice', async () => {
    // settlePaymentByReference is independently idempotent (see settle-payment.test.ts) —
    // this asserts the webhook route itself never rejects/crashes on a re-delivery.
    await POST(makeRequest({ event: 'charge.success', data: { reference: 'ref-1' } }))
    const second = await POST(makeRequest({ event: 'charge.success', data: { reference: 'ref-1' } }))

    expect(second.status).toBe(200)
    expect(settlePaymentByReference).toHaveBeenCalledTimes(2)
    expect(settlePaymentByReference).toHaveBeenNthCalledWith(2, 'ref-1', 'paid')
  })

  it('rejects an invalid signature without processing the event', async () => {
    vi.mocked(verifyPaystackSignature).mockReturnValue(false)

    const response = await POST(makeRequest({ event: 'charge.success', data: { reference: 'ref-1' } }))

    expect(response.status).toBe(400)
    expect(settlePaymentByReference).not.toHaveBeenCalled()
  })
})
