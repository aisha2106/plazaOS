import { useId, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
}

export function Input({ label, error, helperText, className = '', id, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[13px] font-medium text-slate-900">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-[44px] rounded-button border px-3 text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-light ${
          error ? 'border-danger' : 'border-slate-200'
        } ${className}`}
        {...props}
      />
      {error ? (
        <span id={`${inputId}-error`} className="text-xs font-medium text-danger">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${inputId}-helper`} className="text-xs text-slate-500">
          {helperText}
        </span>
      ) : null}
    </div>
  )
}
