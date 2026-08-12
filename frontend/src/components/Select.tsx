import { useId, type SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string
  options: SelectOption[]
  helperText?: string
}

export function Select({ label, options, helperText, className = '', id, ...props }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const describedBy = helperText ? `${selectId}-helper` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-[13px] font-medium text-slate-900">
        {label}
      </label>
      <select
        id={selectId}
        aria-describedby={describedBy}
        className={`min-h-[44px] rounded-button border border-slate-200 bg-white px-3 text-[15px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-light ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText ? (
        <span id={`${selectId}-helper`} className="text-xs text-slate-500">
          {helperText}
        </span>
      ) : null}
    </div>
  )
}
