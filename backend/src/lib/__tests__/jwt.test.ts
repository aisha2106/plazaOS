import { describe, it, expect } from 'vitest'
import { signToken, verifyToken } from '@/lib/jwt'
import { ApiError } from '@/lib/api-error'

describe('jwt', () => {
  it('round-trips a token payload', () => {
    const token = signToken({ sub: 'user-1', role: 'tenant' })
    const payload = verifyToken(token)
    expect(payload.sub).toBe('user-1')
    expect(payload.role).toBe('tenant')
  })

  it('throws a 401 ApiError for a malformed token', () => {
    try {
      verifyToken('not-a-real-token')
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(401)
    }
  })

  it('throws a 401 ApiError for a token signed with a different secret', () => {
    const original = process.env.JWT_SECRET
    process.env.JWT_SECRET = 'a-different-secret'
    const token = signToken({ sub: 'user-1', role: 'admin' })
    process.env.JWT_SECRET = original

    expect(() => verifyToken(token)).toThrow(ApiError)
  })
})
