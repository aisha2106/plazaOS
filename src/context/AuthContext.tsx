import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import { api, clearToken, getToken, setToken } from '../lib/api'
import { USER_KEY, readStoredUser, isApiError } from './authUtils'

export type Role = 'admin' | 'tenant'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  /** Backend-provided flag for administrator-provisioned tenant accounts. */
  mustChangePassword?: boolean
}

interface LoginResponse {
  token: string
  user: AuthUser
}

export interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  role: Role | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  completePasswordSetup: (updatedUser?: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export { AuthContext }

export function AuthProvider({ children }: { children?: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', { email, password })
      setToken(response.token)
      localStorage.setItem(USER_KEY, JSON.stringify(response.user))
      setTokenState(response.token)
      setUser(response.user)
      return response.user
    } catch (err: unknown) {
      // DEVELOPMENT ONLY: If backend is not available in development, fall back to a local mock account.
      // This block is safe to remove once the auth API is implemented.
      const isDev = import.meta.env.DEV

      // Check if the error is a network/connectivity issue or 404 (API not available)
      const isNetworkError = err instanceof TypeError || (err instanceof Error && /failed to fetch/i.test(err.message))
      const isNotFound = isApiError(err) && err.status === 404

      if (isDev && (isNetworkError || isNotFound)) {
        // Console log for debugging (development only)
        console.log('[DEV] Auth API unavailable, using mock authentication fallback')

        // Mock accounts for development. Remove this when backend is ready.
        const MOCK_ACCOUNTS: Record<string, { token: string; user: AuthUser }> = {
          'tenant@plaza.test': {
            token: 'dev-token-tenant',
            user: {
              id: 'dev-tenant-1',
              name: 'Dev Tenant',
              email: 'tenant@plaza.test',
              role: 'tenant',
            },
          },
          'admin@plaza.test': {
            token: 'dev-token-admin',
            user: {
              id: 'dev-admin-1',
              name: 'Dev Admin',
              email: 'admin@plaza.test',
              role: 'admin',
            },
          },
        }

        const account = MOCK_ACCOUNTS[email]
        if (account && password === 'password123') {
          // Populate AuthContext exactly as the real API would.
          console.log(`[DEV] Mock login successful for ${email}`)
          setToken(account.token)
          localStorage.setItem(USER_KEY, JSON.stringify(account.user))
          setTokenState(account.token)
          setUser(account.user)
          return account.user
        }

        // If credentials don't match mock accounts, fall through and throw the original error.
        console.log(`[DEV] Mock login failed: invalid credentials for ${email}`)
      }

      throw err
    }
  }, [])

  const logout = useCallback(() => {
    clearToken()
    localStorage.removeItem(USER_KEY)
    setTokenState(null)
    setUser(null)
  }, [])

  const completePasswordSetup = useCallback((updatedUser?: AuthUser) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser
      const nextUser = { ...currentUser, ...updatedUser, mustChangePassword: false }
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
      return nextUser
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      role: user?.role ?? null,
      isAuthenticated: Boolean(token && user),
      login,
      completePasswordSetup,
      logout,
    }),
    [user, token, login, completePasswordSetup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
