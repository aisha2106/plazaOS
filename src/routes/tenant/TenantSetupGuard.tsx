import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export function TenantSetupGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  if (user?.mustChangePassword) {
    return <Navigate to="/tenant/account-setup" replace />
  }

  return <>{children}</>
}
