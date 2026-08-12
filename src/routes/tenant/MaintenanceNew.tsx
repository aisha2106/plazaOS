import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Button, Card, Input, Text } from '../../components'
import { useMaintenance } from '../../hooks/useMaintenance'
import { useNavigate } from 'react-router-dom'

import type { MaintenanceRequest, MaintenancePriority } from '../../lib/types'

type FormValues = { title: string; description?: string; priority?: MaintenancePriority }
const MAX_IMAGE_COUNT = 5
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function MaintenanceNew() {
  const { register, handleSubmit, formState } = useForm<FormValues>()
  const [images, setImages] = useState<string[]>([])
  const { create } = useMaintenance()
  const navigate = useNavigate()

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function onSubmit(values: FormValues) {
    setErrorMessage(null)
    setSuccessMessage(null)
    const payload: Partial<MaintenanceRequest> = { ...values, images }
    try {
      await create.mutateAsync(payload)
      setSuccessMessage('Maintenance request submitted.')
      // Prevent duplicate submissions briefly and then navigate back
      setTimeout(() => navigate('/tenant/maintenance'), 700)
    } catch (err) {
      console.error(err)
      setErrorMessage('Submission failed. Please try again.')
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const selected = Array.from(files)
    const availableSlots = MAX_IMAGE_COUNT - images.length
    const validFiles = selected.slice(0, availableSlots).filter((file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_SIZE_BYTES)

    if (validFiles.length !== selected.length) {
      setErrorMessage(`Add up to ${MAX_IMAGE_COUNT} images, each no larger than 2 MB.`)
    }

    try {
      const converted = await Promise.all(validFiles.map(fileToBase64))
      setImages((previous) => [...previous, ...converted])
    } catch {
      setErrorMessage('One or more images could not be read. Please try again.')
    }
  }

  const isSubmitting = create.isPending

  return (
    <div className="px-4 sm:px-6">
      <Text variant="h1">New Maintenance Request</Text>
      <Card className="mt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Title" {...register('title', { required: 'Title is required.' })} disabled={isSubmitting} error={formState.errors.title?.message} />
          <Input label="Description" {...register('description')} disabled={isSubmitting} />
          <Input label="Priority" {...register('priority')} disabled={isSubmitting} />

          <div>
            <label className="text-[13px] font-medium text-slate-900">Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFiles(e.target.files)}
              className="mt-2 w-full text-sm"
              disabled={isSubmitting || images.length >= MAX_IMAGE_COUNT}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((src, i) => (
                <img key={i} src={src} alt={`preview-${i}`} className="h-20 w-20 flex-none rounded border border-slate-200 object-cover" />
              ))}
            </div>
            <Text variant="bodySmall" className="mt-2 text-slate-500">Up to {MAX_IMAGE_COUNT} images, 2 MB each.</Text>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </Button>
          </div>

          {errorMessage ? <Text variant="bodySmall" className="text-danger">{errorMessage}</Text> : null}
          {successMessage ? <Text variant="bodySmall" className="text-success">{successMessage}</Text> : null}
        </form>
      </Card>
    </div>
  )
}
