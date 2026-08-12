import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import type { Role } from '../context/AuthContext'

interface ProtectedRouteProps {
  requiredRole: Role
  children: ReactNode
}

const TENANT_SET_PASSWORD_PATH = '/tenant/set-password'

/**
 * Unauthenticated users are sent to /login. Authenticated users whose role
 * doesn't match this branch are sent to their own dashboard instead.
 * Tenants still on a temporary password are forced to set their own before
 * any other tenant route renders.
 */
export function ProtectedRoute({ requiredRole, children }: ProtectedRouteProps) {
  const { isAuthenticated, role, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role !== requiredRole) {
    return <Navigate to={`/${role}`} replace />
  }

  if (role === 'tenant' && user?.mustChangePassword && location.pathname !== TENANT_SET_PASSWORD_PATH) {
    return <Navigate to={TENANT_SET_PASSWORD_PATH} replace />
  }

  return <>{children}</>
}
