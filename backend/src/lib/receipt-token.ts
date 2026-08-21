import jwt from 'jsonwebtoken'
import { ApiError } from './api-error'

interface ReceiptTokenPayload {
  purpose: 'receipt'
  paymentId: string
  sub: string
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return secret
}

// Short-lived, single-purpose token embedded in receipt URLs so a plain
// `<a href>` download link works without an Authorization header, while
// staying scoped to exactly one payment and expiring quickly if leaked
// (e.g. via browser history or referrer headers).
export function signReceiptToken(paymentId: string, sub: string): string {
  const payload: ReceiptTokenPayload = { purpose: 'receipt', paymentId, sub }
  return jwt.sign(payload, getSecret(), { expiresIn: '5m' })
}

export function verifyReceiptToken(token: string, paymentId: string): string {
  let payload: ReceiptTokenPayload
  try {
    payload = jwt.verify(token, getSecret()) as ReceiptTokenPayload
  } catch {
    throw new ApiError('Unauthorized', 401)
  }
  if (payload.purpose !== 'receipt' || payload.paymentId !== paymentId) throw new ApiError('Unauthorized', 401)
  return payload.sub
}

export function buildReceiptUrl(origin: string, paymentId: string, sub: string): string {
  const token = signReceiptToken(paymentId, sub)
  return `${origin}/api/tenant/payments/${paymentId}/receipt?token=${token}`
}
