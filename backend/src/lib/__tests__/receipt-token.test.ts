import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { signReceiptToken, verifyReceiptToken, buildReceiptUrl } from '@/lib/receipt-token'
import { ApiError } from '@/lib/api-error'

describe('receipt-token', () => {
  it('round-trips a valid receipt token scoped to its payment id', () => {
    const token = signReceiptToken('payment-1', 'tenant-1')
    expect(verifyReceiptToken(token, 'payment-1')).toBe('tenant-1')
  })

  it('rejects a token presented against a different paymentId', () => {
    const token = signReceiptToken('payment-1', 'tenant-1')
    expect(() => verifyReceiptToken(token, 'payment-2')).toThrow(ApiError)
  })

  it('rejects a malformed token', () => {
    expect(() => verifyReceiptToken('garbage', 'payment-1')).toThrow(ApiError)
  })

  it('rejects a well-formed token that is not purpose:"receipt"', () => {
    const wrongPurposeToken = jwt.sign({ purpose: 'other', paymentId: 'payment-1', sub: 'tenant-1' }, process.env.JWT_SECRET!, {
      expiresIn: '5m',
    })
    expect(() => verifyReceiptToken(wrongPurposeToken, 'payment-1')).toThrow(ApiError)
  })

  it('builds a receipt URL embedding the token as a query param', () => {
    const url = buildReceiptUrl('http://localhost:4000', 'payment-1', 'tenant-1')
    expect(url).toMatch(/^http:\/\/localhost:4000\/api\/tenant\/payments\/payment-1\/receipt\?token=.+/)
  })
})
