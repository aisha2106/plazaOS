import { useEffect } from 'react'
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
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Name" {...register('name', { required: true })} disabled={formState.isSubmitting} />
            <Input label="Phone" {...register('phone')} disabled={formState.isSubmitting} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {updateMutation.error ? (
                <Text variant="bodySmall" className="text-danger">Unable to save profile. Please try again.</Text>
              ) : updateMutation.isSuccess ? (
                <Text variant="bodySmall" className="text-success">Profile updated.</Text>
              ) : null}
              <Button type="submit" disabled={formState.isSubmitting || updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
            </form>
            <div className="mt-8 border-t border-slate-200 pt-6">
            <Text variant="h3">Change password</Text>
            <Text variant="bodySmall" className="mt-1 text-slate-500">Use at least {MIN_PASSWORD_LENGTH} characters.</Text>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="mt-4 flex flex-col gap-4">
              <Input
                label="Current password"
                type="password"
                autoComplete="current-password"
                disabled={changePassword.isPending}
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register('currentPassword', { required: 'Your current password is required.' })}
              />
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                disabled={changePassword.isPending}
                error={passwordForm.formState.errors.newPassword?.message}
                {...passwordForm.register('newPassword', {
                  required: 'A new password is required.',
                  minLength: { value: MIN_PASSWORD_LENGTH, message: `Use at least ${MIN_PASSWORD_LENGTH} characters.` },
                })}
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                disabled={changePassword.isPending}
                error={passwordForm.formState.errors.confirmPassword?.message}
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
