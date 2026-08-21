import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
<<<<<<< HEAD:src/routes/tenant/SetPassword.tsx
import { useAuth } from '../../context/AuthContext'
import { updateTenant } from '../admin/tenants/data'
import { AuthShell } from '../AuthShell'

// TODO: once the real backend exists, this should call a dedicated
// POST /auth/set-password endpoint (which clears mustChangePassword
// server-side) instead of calling updateTenant() directly from here. That
// endpoint should also reject a new password matching the current one —
// only the server holds the current password (hash) to compare against, so
// that check can't be done from here.
//
// NOTE: PRODUCT.md's route map has tenant home at /tenant, not
// /tenant/dashboard (same gap as /admin vs /admin/dashboard) — redirecting
// to /tenant/dashboard here would 404 against the routes actually
// registered in App.tsx, so this redirects to /tenant instead.
=======
import { Button, Card, Input, Text } from '../../components'
import { useAuth } from '../../context/useAuth'
import { authService } from '../../lib/services/authService'

// Redirects to bare /tenant, which redirects to /tenant/dashboard (same
// pattern as /admin → /admin/dashboard) — both are valid, registered routes.
>>>>>>> origin/production-ready-plazaos:frontend/src/routes/tenant/SetPassword.tsx
export function SetPassword() {
  const { completePasswordSetup } = useAuth()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    try {
      await authService.setPassword(newPassword)
      completePasswordSetup()
      navigate('/tenant', { replace: true })
    } catch {
      setError('Something went wrong setting your password. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell plateLabel="PLAZA OS · NEW PASSWORD">
      <h1 className="font-display text-2xl font-bold tracking-tight text-[#16161F]">Set your password</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#6B6B7D]">
        You're signing in with a temporary password. Choose a new one to continue — minimum 8 characters.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
        <div>
          <label htmlFor="new-password" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.14em] text-[#6B6B7D]">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? 'set-password-error' : undefined}
            className="w-full rounded-lg border border-[#E6E6EF] bg-white px-4 py-3 text-[15px] text-[#16161F] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.14em] text-[#6B6B7D]">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? 'set-password-error' : undefined}
            className="w-full rounded-lg border border-[#E6E6EF] bg-white px-4 py-3 text-[15px] text-[#16161F] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {error && (
          <p id="set-password-error" role="alert" className="rounded-lg border border-[#F0D4D4] bg-[#FDF5F5] px-4 py-3 text-sm text-[#9B2C2C]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary px-4 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-light focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : 'Set password'}
        </button>
      </form>
    </AuthShell>
  )
}
