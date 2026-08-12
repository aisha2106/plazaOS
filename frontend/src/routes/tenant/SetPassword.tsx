import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Text } from '../../components'
import { useAuth } from '../../context/useAuth'
import { authService } from '../../lib/services/authService'

// Redirects to bare /tenant, which redirects to /tenant/dashboard (same
// pattern as /admin → /admin/dashboard) — both are valid, registered routes.
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
