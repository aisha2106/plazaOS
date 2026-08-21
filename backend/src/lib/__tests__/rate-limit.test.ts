import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { ApiError } from '@/lib/api-error'

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('allows calls up to the limit within the window', () => {
    const key = `test:${crypto.randomUUID()}`
    for (let i = 0; i < 3; i++) expect(() => rateLimit(key, 3, 60_000)).not.toThrow()
  })

  it('throws a 429 ApiError once the limit is exceeded within the window', () => {
    const key = `test:${crypto.randomUUID()}`
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 60_000)
    expect(() => rateLimit(key, 3, 60_000)).toThrow(ApiError)
    try {
      rateLimit(key, 3, 60_000)
    } catch (err) {
      expect((err as ApiError).status).toBe(429)
    }
  })

  it('keeps separate buckets per key', () => {
    const keyA = `test:${crypto.randomUUID()}`
    const keyB = `test:${crypto.randomUUID()}`
    rateLimit(keyA, 1, 60_000)
    expect(() => rateLimit(keyB, 1, 60_000)).not.toThrow()
    expect(() => rateLimit(keyA, 1, 60_000)).toThrow(ApiError)
  })

  it('resets the count once the window has elapsed', () => {
    vi.useFakeTimers()
    const key = `test:${crypto.randomUUID()}`
    rateLimit(key, 1, 1_000)
    expect(() => rateLimit(key, 1, 1_000)).toThrow(ApiError)
    vi.advanceTimersByTime(1_001)
    expect(() => rateLimit(key, 1, 1_000)).not.toThrow()
    vi.useRealTimers()
  })
})

describe('clientIp', () => {
  it('reads the first address from x-forwarded-for', () => {
    const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' } })
    expect(clientIp(request)).toBe('203.0.113.5')
  })

  it('falls back to "unknown" when the header is absent', () => {
    const request = new Request('http://localhost')
    expect(clientIp(request)).toBe('unknown')
  })
})
