import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Button, Card, Input, Text } from '../../components'
import { useMaintenance } from '../../hooks/useMaintenance'
import { useNavigate } from 'react-router-dom'

type FormValues = { title: string; description?: string; priority?: string }

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function MaintenanceNew() {
  const { register, handleSubmit } = useForm<FormValues>()
  const [images, setImages] = useState<string[]>([])
  const { create } = useMaintenance()
  const navigate = useNavigate()

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function onSubmit(values: FormValues) {
    setErrorMessage(null)
    setSuccessMessage(null)
    const payload: any = { ...values, images }
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
    const arr = Array.from(files)
    const converted = await Promise.all(arr.map((f) => fileToBase64(f)))
    setImages((prev) => [...prev, ...converted])
  }

  const isSubmitting = create.status === 'pending'

  return (
    <div className="px-4 sm:px-6">
      <Text variant="h1">New Maintenance Request</Text>
      <Card className="mt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Title" {...register('title', { required: true })} disabled={isSubmitting} />
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
              disabled={isSubmitting}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((src, i) => (
                <img key={i} src={src} alt={`preview-${i}`} className="h-20 w-20 flex-none rounded border border-slate-200 object-cover" />
              ))}
            </div>
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
