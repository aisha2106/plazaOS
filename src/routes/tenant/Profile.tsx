import { useForm } from 'react-hook-form'
import { Button, Card, Input, Text } from '../../components'
import { useProfile } from '../../hooks/useProfile'

type FormValues = {
  name: string
  phone?: string
}

export function Profile() {
  const { data: profile, isLoading, isError, refetch } = useProfile()
  const { register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: { name: profile?.name, phone: profile?.phone },
  })

  function onSubmit(values: FormValues) {
    // For now just log — real update would call profileService
    console.log('update', values)
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl">
        <Text variant="h1">Profile</Text>
        <Card className="mt-4">
          <Text variant="body">Loading…</Text>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-2xl">
        <Text variant="h1">Profile</Text>
        <Card className="mt-4">
          <div className="flex items-center justify-between">
            <Text variant="bodySmall" className="text-danger">Failed to load profile.</Text>
            <div>
              <Button variant="secondary" onClick={() => refetch()}>Retry</Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Text variant="h1">Profile</Text>
      <Card className="mt-4">
        <div className="mb-4 grid grid-cols-1 gap-2">
          <Text variant="h3">Personal information</Text>
          <Text variant="body">Name: {profile?.name}</Text>
          <Text variant="body">Email: {profile?.email}</Text>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2">
          <Text variant="h3">Assigned unit</Text>
          <Text variant="body">{profile?.unit ?? '—'}</Text>
          <Text variant="body">Lease: {profile?.leaseStart ?? '—'} to {profile?.leaseEnd ?? '—'}</Text>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Name" {...register('name')} />
          <Input label="Phone" {...register('phone')} />
          <div className="flex justify-end">
            <Button type="submit" disabled={formState.isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
