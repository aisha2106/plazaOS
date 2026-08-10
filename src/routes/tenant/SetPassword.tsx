import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Text } from '../../components'
import { useAuth } from '../../context/AuthContext'
import { updateTenant } from '../admin/tenants/data'

// TODO: once the real backend exists, this should call a dedicated
// POST /auth/set-password endpoint (which clears mustChangePassword
// server-side) instead of calling updateTenant() directly from here.
//
// NOTE: PRODUCT.md's route map has tenant home at /tenant, not
// /tenant/dashboard (same gap as /admin vs /admin/dashboard) — redirecting
// to /tenant/dashboard here would 404 against the routes actually
// registered in App.tsx, so this redirects to /tenant instead.
export function SetPassword() {
  const { user, completePasswordSetup } = useAuth()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    if (user) {
      // No-op for the dev mock login user, which isn't backed by a real
      // tenant record — see MOCK_USERS in AuthContext.
      updateTenant(user.id, { mustChangePassword: false, accountStatus: 'active' })
    }
    window.setTimeout(() => {
      completePasswordSetup()
      navigate('/tenant', { replace: true })
    }, 300)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-200/40 px-4">
      <Card className="w-full max-w-sm">
        <Text variant="h1" className="mb-1 text-slate-900">
          Set your password
        </Text>
        <Text variant="body" className="mb-6 text-slate-500">
          You're signing in with a temporary password. Choose a new one to continue.
        </Text>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
          {error ? (
            <Text variant="bodySmall" className="text-danger">
              {error}
            </Text>
          ) : null}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Saving…' : 'Set password'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
