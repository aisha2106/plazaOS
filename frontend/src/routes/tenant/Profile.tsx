import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Card, Input, Text } from '../../components'
import { useProfile } from '../../hooks/useProfile'

type FormValues = {
  name: string
  phone?: string
}

export function Profile() {
  const { data: profile, isLoading, isError, refetch, update } = useProfile()
  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: { name: profile?.name, phone: profile?.phone },
  })
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      reset({ name: profile.name, phone: profile.phone })
    }
  }, [profile, reset])

  async function onSubmit(values: FormValues) {
    setSaveError(null)
    setSaved(false)
    try {
      await update.mutateAsync(values)
      setSaved(true)
    } catch {
      setSaveError('Failed to save your profile. Please try again.')
    }
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
          {saveError ? (
            <Text variant="bodySmall" className="text-danger">
              {saveError}
            </Text>
          ) : null}
          {saved ? (
            <Text variant="bodySmall" className="text-success">
              Profile saved.
            </Text>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={formState.isSubmitting || update.status === 'pending'}>
              {update.status === 'pending' ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
