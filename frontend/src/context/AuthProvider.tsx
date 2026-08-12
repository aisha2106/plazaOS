import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { api, clearToken, getToken, setToken } from '../lib/api'
import { AuthContext, type AuthContextValue, type AuthUser, type Role } from './AuthContext'

interface LoginResponse {
  token: string
  user: AuthUser
}

const USER_KEY = 'plaza_os_user'

// TODO: remove once the real backend's /auth/login is reachable — this lets
// the app be exercised locally without a live login API.
// mustChangePassword: true on the tenant so the dev login shortcut can
// exercise the tenant first-login password-set gate end to end.
const MOCK_USERS: Record<Role, AuthUser> = {
  admin: { id: 'dev-admin', name: 'Dev Admin', email: 'admin@plaza.test', role: 'admin' },
  tenant: { id: 'dev-tenant', name: 'Dev Tenant', email: 'tenant@plaza.test', role: 'tenant', mustChangePassword: true },
}

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
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
      const isNotFound = (err as any)?.status === 404

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

  const loginAsMock = useCallback((role: Role) => {
    const mockUser = MOCK_USERS[role]
    const mockToken = `dev-mock-token-${role}`
    setToken(mockToken)
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
    setTokenState(mockToken)
    setUser(mockUser)
    return mockUser
  }, [])

  const completePasswordSetup = useCallback(() => {
    setUser((current) => {
      if (!current) return current
      const updated: AuthUser = { ...current, mustChangePassword: false }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const logout = useCallback(() => {
    clearToken()
    localStorage.removeItem(USER_KEY)
    setTokenState(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      role: user?.role ?? null,
      isAuthenticated: Boolean(token && user),
      login,
      loginAsMock,
      completePasswordSetup,
      logout,
    }),
    [user, token, login, loginAsMock, completePasswordSetup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
