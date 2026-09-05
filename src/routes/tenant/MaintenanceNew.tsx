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

interface ImagePreview {
  id: string
  src: string
}

export function MaintenanceNew() {
  const { register, handleSubmit, formState } = useForm<FormValues>()
  const [images, setImages] = useState<ImagePreview[]>([])
  const { create } = useMaintenance()
  const navigate = useNavigate()

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function onSubmit(values: FormValues) {
    setErrorMessage(null)
    setSuccessMessage(null)
    const payload: Partial<MaintenanceRequest> = { ...values, images: images.map(img => img.src) }
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
      const newImages = converted.map((src, i) => ({
        id: `${Date.now()}-${i}`,
        src
      }))
      setImages((previous) => [...previous, ...newImages])
    } catch {
      setErrorMessage('One or more images could not be read. Please try again.')
    }
  }

  function removeImage(id: string) {
    setImages((previous) => previous.filter(img => img.id !== id))
  }

  const isSubmitting = create.isPending

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Text variant="h1" className="mb-8">Submit Maintenance Request</Text>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <Input label="Title" placeholder="e.g., Broken window, Leaking pipe" {...register('title', { required: 'Title is required.' })} disabled={isSubmitting} error={formState.errors.title?.message} />
          <Input label="Description" placeholder="Provide details about the issue" as="textarea" {...register('description')} disabled={isSubmitting} />
          <Input label="Priority" {...register('priority')} disabled={isSubmitting} />

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-900">Images</label>
            <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                id="image-input"
                disabled={isSubmitting || images.length >= MAX_IMAGE_COUNT}
              />
              <label htmlFor="image-input" className="cursor-pointer">
                <Text variant="body" className="text-slate-600">
                  📷 Click to upload or drag images here
                </Text>
                <Text variant="bodySmall" className="mt-2 text-slate-500">
                  Up to {MAX_IMAGE_COUNT - images.length} more images · 2 MB each
                </Text>
              </label>
            </div>

            {images.length > 0 && (
              <div className="space-y-3">
                <Text variant="bodySmall" className="font-semibold text-slate-700">{images.length} image{images.length !== 1 ? 's' : ''} selected</Text>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((image) => (
                    <div key={image.id} className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                      <img 
                        src={image.src} 
                        alt="preview" 
                        className="h-40 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Text variant="button" className="text-white">Remove</Text>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/tenant/maintenance')} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </div>

          {errorMessage ? <div className="rounded-lg bg-red-50 border border-red-200 p-4"><Text variant="bodySmall" className="text-danger font-medium">{errorMessage}</Text></div> : null}
          {successMessage ? <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4"><Text variant="bodySmall" className="text-emerald-700 font-medium">{successMessage}</Text></div> : null}
        </form>
      </Card>
    </div>
  )
}
