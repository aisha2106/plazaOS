import { ApiError } from '../lib/api'
import type { AuthUser } from './AuthContext'

export const USER_KEY = 'plaza_os_user'

export function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}
