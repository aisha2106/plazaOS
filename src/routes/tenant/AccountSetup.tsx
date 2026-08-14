import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Text } from '../../components'
import { useAuth, type AuthUser } from '../../context/AuthContext'
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
            type="password"
            autoComplete="current-password"
            disabled={changePassword.isPending}
            error={formState.errors.currentPassword?.message}
            {...register('currentPassword', { required: 'Your current or temporary password is required.' })}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            disabled={changePassword.isPending}
            error={formState.errors.newPassword?.message}
            {...register('newPassword', {
              required: 'A new password is required.',
              minLength: { value: MIN_PASSWORD_LENGTH, message: `Use at least ${MIN_PASSWORD_LENGTH} characters.` },
            })}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            disabled={changePassword.isPending}
            error={formState.errors.confirmPassword?.message}
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
