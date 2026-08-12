import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Card, Input, Text } from '../../components'
import { useProfile } from '../../hooks/useProfile'

type FormValues = {
  name: string
  phone?: string
}

export function Profile() {
  const { data: profile, isLoading, isError, refetch, updateMutation } = useProfile()
  const { register, handleSubmit, setValue, formState } = useForm<FormValues>({
    defaultValues: { name: '', phone: '' },
  })

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
        )}
      </Card>
    </div>
  )
}
