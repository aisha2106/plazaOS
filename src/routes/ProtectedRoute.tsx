import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { type Role } from '../context/AuthContext'

interface ProtectedRouteProps {
  requiredRole: Role
  children: ReactNode
}

/**
 * Unauthenticated users are sent to /login. Authenticated users whose role
 * doesn't match this branch are sent to their own dashboard instead.
 */
export function ProtectedRoute({ requiredRole, children }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role !== requiredRole) {
    return <Navigate to={`/${role}`} replace />
  }

  return <>{children}</>
}
