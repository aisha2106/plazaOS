import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Card, Input, Text } from '../../components'
import { useChangePassword } from '../../hooks/useChangePassword'
import { useProfile } from '../../hooks/useProfile'

type FormValues = {
  name: string
  phone?: string
}

type PasswordFormValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const MIN_PASSWORD_LENGTH = 8

export function Profile() {
  const { data: profile, isLoading, isError, refetch, updateMutation } = useProfile()
  const changePassword = useChangePassword()
  const { register, handleSubmit, setValue, formState } = useForm<FormValues>({
    defaultValues: { name: '', phone: '' },
  })
  const passwordForm = useForm<PasswordFormValues>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const newPassword = passwordForm.watch('newPassword')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (profile) {
      setValue('name', profile.name)
      setValue('phone', profile.phone ?? '')
    }
  }, [profile, setValue])

  async function onSubmit(values: FormValues) {
    try {
      await updateMutation.mutateAsync(values)
    } catch (err) {
      console.error(err)
    }
  }

  async function onPasswordSubmit(values: PasswordFormValues) {
    try {
      await changePassword.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      passwordForm.reset()
    } catch {
      // The mutation state supplies feedback without exposing sensitive details.
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Text variant="h1" className="mb-8">Profile</Text>

      {isLoading ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Text variant="body" className="text-slate-500">Loading your profile…</Text>
          </div>
        </Card>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50">
          <div className="flex flex-col gap-3">
            <Text variant="bodySmall" className="text-danger font-medium">Unable to load profile.</Text>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Profile Information Section */}
          <Card>
            <Text variant="h2" className="mb-6">👤 Personal Information</Text>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Name" {...register('name', { required: true })} disabled={formState.isSubmitting} />
              <Input label="Phone" {...register('phone')} disabled={formState.isSubmitting} />

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {updateMutation.error && (
                    <Text variant="bodySmall" className="text-danger">Unable to save profile. Please try again.</Text>
                  )}
                  {updateMutation.isSuccess && (
                    <Text variant="bodySmall" className="text-success font-medium">✓ Profile updated.</Text>
                  )}
                </div>
                <Button type="submit" disabled={formState.isSubmitting || updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Change Password Section */}
          <Card>
            <Text variant="h2" className="mb-2">🔐 Change password</Text>
            <Text variant="bodySmall" className="mb-6 text-slate-600">Use at least {MIN_PASSWORD_LENGTH} characters for security.</Text>

            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <Input
                label="Current password"
                type={showCurrentPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={changePassword.isPending}
                error={passwordForm.formState.errors.currentPassword?.message}
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
                {...passwordForm.register('currentPassword', { required: 'Your current password is required.' })}
              />
              <Input
                label="New password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                disabled={changePassword.isPending}
                error={passwordForm.formState.errors.newPassword?.message}
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
                {...passwordForm.register('newPassword', {
                  required: 'A new password is required.',
                  minLength: { value: MIN_PASSWORD_LENGTH, message: `Use at least ${MIN_PASSWORD_LENGTH} characters.` },
                })}
              />
              <Input
                label="Confirm new password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                disabled={changePassword.isPending}
                error={passwordForm.formState.errors.confirmPassword?.message}
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
                {...passwordForm.register('confirmPassword', {
                  required: 'Please confirm your new password.',
                  validate: (value) => value === newPassword || 'Passwords do not match.',
                })}
              />

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {changePassword.isError && (
                    <Text variant="bodySmall" className="text-danger">Unable to change password. Please try again.</Text>
                  )}
                  {changePassword.isSuccess && (
                    <Text variant="bodySmall" className="text-success font-medium">✓ Password changed successfully.</Text>
                  )}
                </div>
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? 'Changing password…' : 'Change password'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
