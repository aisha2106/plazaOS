import { ApiError } from './api-error'

// In-memory fixed-window rate limiter. Sufficient for a single Railway
// process (see BACKEND_BUILD_PLAN.md §13's "single JWT, no refresh token"
// style MVP tradeoffs) — resets on redeploy/restart and doesn't share state
// across horizontally-scaled instances, which would need a shared store
// (e.g. Redis) if that ever becomes necessary.
const buckets = new Map<string, { count: number; resetAt: number }>()

let callsSinceSweep = 0

/** Throws a 429 ApiError once `key` has been called more than `limit` times within `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now()

  // Lazily sweep expired entries so the map can't grow unbounded under a
  // distributed attack using many distinct keys (e.g. spoofed IPs).
  if (++callsSinceSweep >= 500) {
    callsSinceSweep = 0
    for (const [existingKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(existingKey)
    }
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  bucket.count += 1
  if (bucket.count > limit) throw new ApiError('Too many requests, please try again later', 429)
}

/** Best-effort client IP from the standard reverse-proxy header; falls back to a shared bucket if absent. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}
