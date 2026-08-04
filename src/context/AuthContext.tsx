import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { api, clearToken, getToken, setToken } from '../lib/api'

export type Role = 'admin' | 'tenant'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  mustChangePassword?: boolean
}

interface LoginResponse {
  token: string
  user: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  role: Role | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  loginAsMock: (role: Role) => AuthUser
  completePasswordSetup: () => void
  logout: () => void
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

const AuthContext = createContext<AuthContextValue | null>(null)

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
    const response = await api.post<LoginResponse>('/auth/login', { email, password })
    setToken(response.token)
    localStorage.setItem(USER_KEY, JSON.stringify(response.user))
    setTokenState(response.token)
    setUser(response.user)
    return response.user
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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
