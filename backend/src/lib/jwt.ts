import jwt from 'jsonwebtoken'
import { ApiError } from './api-error'

export interface TokenPayload {
  sub: string
  role: 'admin' | 'tenant'
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return secret
}

export function signToken(payload: TokenPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '14d') as jwt.SignOptions['expiresIn']
  return jwt.sign(payload, getSecret(), { expiresIn })
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, getSecret()) as TokenPayload
  } catch {
    throw new ApiError('Unauthorized', 401)
  }
}
