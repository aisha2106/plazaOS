import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react'

type BaseProps = {
  label: string
  error?: string
  helperText?: string
  action?: ReactNode
}

type InputOnlyProps = BaseProps & InputHTMLAttributes<HTMLInputElement> & { as?: 'input' }
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { as: 'textarea' }

type InputProps = InputOnlyProps | TextareaProps

export function Input(props: InputProps) {
  const { label, error, helperText, className = '', id, action, as, ...restProps } = props
  const generatedId = useId()
  const inputId = id ?? generatedId
  const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined

  const isTextarea = as === 'textarea'

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-semibold text-slate-900">
        {label}
      </label>
      <div className="relative">
        {isTextarea ? (
          <textarea
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`w-full min-h-[120px] rounded-button border px-4 py-2 text-[15px] text-slate-900 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-1 ${
              error ? 'border-danger focus:ring-danger/30' : 'border-slate-300 hover:border-slate-400'
            } ${className}`}
            {...(restProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`w-full min-h-[44px] rounded-button border px-4 py-2 text-[15px] text-slate-900 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-1 ${
              error ? 'border-danger focus:ring-danger/30' : 'border-slate-300 hover:border-slate-400'
            } ${action ? 'pr-11' : ''} ${className}`}
            {...(restProps as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {action && !isTextarea ? <div className="absolute inset-y-0 right-0 flex items-center pr-3">{action}</div> : null}
      </div>
      {error ? (
        <span id={`${inputId}-error`} className="text-xs font-semibold text-danger">
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
