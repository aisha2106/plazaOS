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
  const { data: profile, isLoading, isError, refetch, update } = useProfile()
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
      await update.mutateAsync(values)
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
    <div className="px-4 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Text variant="h1">Profile</Text>
      </div>

      <Card>
        {isLoading ? (
          <Text variant="body">Loading your profile…</Text>
        ) : isError ? (
          <div className="flex flex-col gap-3">
            <Text variant="bodySmall" className="text-danger">Unable to load profile.</Text>
            <Button variant="secondary" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-1 gap-2">
              <Text variant="h3">Assigned unit</Text>
              <Text variant="body">{profile?.unit ?? '—'}</Text>
              <Text variant="body">Lease: {profile?.leaseStart ?? '—'} to {profile?.leaseEnd ?? '—'}</Text>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Name" {...register('name', { required: true })} disabled={formState.isSubmitting} />
            <Input label="Phone" {...register('phone')} disabled={formState.isSubmitting} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {update.error ? (
                <Text variant="bodySmall" className="text-danger">Unable to save profile. Please try again.</Text>
              ) : update.isSuccess ? (
                <Text variant="bodySmall" className="text-success">Profile updated.</Text>
              ) : null}
              <Button type="submit" disabled={formState.isSubmitting || update.isPending}>
                {update.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
            </form>
            <div className="mt-8 border-t border-slate-200 pt-6">
            <Text variant="h3">Change password</Text>
            <Text variant="bodySmall" className="mt-1 text-slate-500">Use at least {MIN_PASSWORD_LENGTH} characters.</Text>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="mt-4 flex flex-col gap-4">
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
              {changePassword.isError ? <Text variant="bodySmall" className="text-danger">Unable to change password. Please try again.</Text> : null}
              {changePassword.isSuccess ? <Text variant="bodySmall" className="text-success">Password changed.</Text> : null}
              <div className="flex justify-end">
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? 'Changing password…' : 'Change password'}
                </Button>
              </div>
            </form>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
