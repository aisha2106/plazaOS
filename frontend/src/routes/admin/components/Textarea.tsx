import { useId, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  helperText?: string
}

// Admin-scoped multiline input matching the shared Input component's style.
export function Textarea({ label, error, helperText, className = '', id, rows = 4, ...props }: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const describedBy = error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={textareaId} className="text-[13px] font-medium text-slate-900">
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`rounded-button border px-3 py-2 text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-light ${
          error ? 'border-danger' : 'border-slate-200'
        } ${className}`}
        {...props}
      />
      {error ? (
        <span id={`${textareaId}-error`} className="text-xs font-medium text-danger">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${textareaId}-helper`} className="text-xs text-slate-500">
          {helperText}
        </span>
      ) : null}
    </div>
  )
}
