import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Text } from '../../components'
import { useAuth } from '../../context/useAuth'
import type { AuthUser } from '../../context/AuthContext'
import { useChangePassword } from '../../hooks/useChangePassword'
import { ApiError } from '../../lib/api'

type FormValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const MIN_PASSWORD_LENGTH = 8

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Unable to secure your account. Please try again.'
}

export function AccountSetup() {
  const { user, completePasswordSetup } = useAuth()
  const navigate = useNavigate()
  const changePassword = useChangePassword()
  const [isComplete, setIsComplete] = useState(false)
  const [updatedUser, setUpdatedUser] = useState<AuthUser | undefined>()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register, handleSubmit, watch, formState } = useForm<FormValues>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const newPassword = watch('newPassword')

  useEffect(() => {
    if (!user?.mustChangePassword && !isComplete) {
      navigate('/tenant', { replace: true })
    }
  }, [isComplete, navigate, user?.mustChangePassword])

  useEffect(() => {
    if (!isComplete) return
    const timeout = window.setTimeout(() => {
      completePasswordSetup(updatedUser)
      navigate('/tenant', { replace: true })
    }, 700)
    return () => window.clearTimeout(timeout)
  }, [completePasswordSetup, isComplete, navigate, updatedUser])

  async function onSubmit(values: FormValues) {
    try {
      const response = await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      setUpdatedUser(response?.user)
      setIsComplete(true)
    } catch {
      // The mutation state supplies a user-safe error message below.
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-200/40 px-4 py-8">
      <Card className="w-full max-w-md">
        <Text variant="h1">Secure your account</Text>
        <Text variant="body" className="mt-2 text-slate-500">
          Your account was created by an administrator. For your privacy and security, please create your own password before continuing.
        </Text>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Input
            label="Current or temporary password"
            type={showCurrentPassword ? 'text' : 'password'}
            autoComplete="current-password"
            disabled={changePassword.isPending}
            error={formState.errors.currentPassword?.message}
            action={
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                className="flex h-full w-10 items-center justify-center text-slate-500 hover:text-slate-700"
              >
                {showCurrentPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            }
            {...register('currentPassword', { required: 'Your current or temporary password is required.' })}
          />
          <Input
            label="New password"
            type={showNewPassword ? 'text' : 'password'}
            autoComplete="new-password"
            disabled={changePassword.isPending}
            error={formState.errors.newPassword?.message}
            action={
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                className="flex h-full w-10 items-center justify-center text-slate-500 hover:text-slate-700"
              >
                {showNewPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            }
            {...register('newPassword', {
              required: 'A new password is required.',
              minLength: { value: MIN_PASSWORD_LENGTH, message: `Use at least ${MIN_PASSWORD_LENGTH} characters.` },
            })}
          />
          <Input
            label="Confirm new password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            disabled={changePassword.isPending}
            error={formState.errors.confirmPassword?.message}
            action={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="flex h-full w-10 items-center justify-center text-slate-500 hover:text-slate-700"
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            }
            {...register('confirmPassword', {
              required: 'Please confirm your new password.',
              validate: (value) => value === newPassword || 'Passwords do not match.',
            })}
          />
          <Text variant="bodySmall" className="text-slate-500">
            Password requirements: use at least {MIN_PASSWORD_LENGTH} characters and confirm the same password.
          </Text>
          {changePassword.isError ? <Text variant="bodySmall" className="text-danger">{getErrorMessage(changePassword.error)}</Text> : null}
          {changePassword.isSuccess ? <Text variant="bodySmall" className="text-success">Account secured. Redirecting…</Text> : null}
          <Button type="submit" disabled={changePassword.isPending || isComplete} className="w-full">
            {changePassword.isPending ? 'Securing account…' : 'Secure my account'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
