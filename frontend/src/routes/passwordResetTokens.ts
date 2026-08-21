import { getTenants } from './admin/tenants/data'

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000 // 30 minutes
const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789' // omits 0/O/1/l/I

interface TokenEntry {
  tenantId: string
  expiresAt: number
}

// TODO: the real backend generates this, emails the link, and validates +
// expires the token server-side. This in-memory map exists only so the
// forgot/reset-password flow is testable without one — like introSession.ts,
// it resets on every page reload and is never persisted.
const tokens = new Map<string, TokenEntry>()

function generateToken(): string {
  let token = ''
  for (let i = 0; i < 32; i += 1) {
    token += TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)]
  }
  return token
}

/**
 * Issues a reset token if the email matches a tenant, or returns null if it
 * doesn't. Callers must show the same confirmation either way — never reveal
 * which emails have accounts.
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null

  const { data } = await getTenants({ search: normalized, pageSize: 1000 })
  const tenant = data.find((candidate) => candidate.email.toLowerCase() === normalized)
  if (!tenant) return null

  const token = generateToken()
  tokens.set(token, { tenantId: tenant.id, expiresAt: Date.now() + RESET_TOKEN_TTL_MS })
  return token
}

/** Returns the tenant id for a live token, or null if it's missing, expired, or already used. */
export function getTenantIdForToken(token: string): string | null {
  const entry = tokens.get(token)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    tokens.delete(token)
    return null
  }
  return entry.tenantId
}

/** Single-use: call once the password has actually been changed. */
export function consumeResetToken(token: string): void {
  tokens.delete(token)
}
