import { createHmac, timingSafeEqual } from 'node:crypto'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not configured')
  return key
}

interface InitializeTransactionParams {
  email: string
  amount: number
  reference: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}

interface InitializeTransactionResult {
  authorization_url: string
  access_code: string
  reference: string
}

interface VerifyTransactionResult {
  status: 'success' | 'failed' | 'abandoned'
  reference: string
  amount: number
}

// Paystack, like most gateways, expects amounts in the currency's smallest
// subunit (e.g. kobo for NGN, cents for USD) — never the major-unit float.
function toSubunit(amount: number): number {
  return Math.round(amount * 100)
}

export async function initializeTransaction(params: InitializeTransactionParams): Promise<InitializeTransactionResult> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: toSubunit(params.amount),
      currency: process.env.PAYSTACK_CURRENCY ?? 'NGN',
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  })

  const body = await response.json()
  if (!response.ok || !body?.status) {
    throw new Error(body?.message ?? 'Paystack transaction initialization failed')
  }
  return body.data as InitializeTransactionResult
}

// Paystack doesn't reliably send a webhook for a failed/abandoned one-off
// charge, so the tenant-facing return flow re-checks the real status directly
// rather than assuming success just because the browser came back.
export async function verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${getSecretKey()}` },
  })

  const body = await response.json()
  if (!response.ok || !body?.status) {
    throw new Error(body?.message ?? 'Paystack transaction verification failed')
  }
  return body.data as VerifyTransactionResult
}

// Verifies the `x-paystack-signature` header: HMAC-SHA512 of the raw request
// body, keyed with the secret key — never trust a webhook body without this.
export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  const expected = createHmac('sha512', getSecretKey()).update(rawBody).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  const signatureBuffer = Buffer.from(signature, 'utf8')
  if (expectedBuffer.length !== signatureBuffer.length) return false
  return timingSafeEqual(expectedBuffer, signatureBuffer)
}
