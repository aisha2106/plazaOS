import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'destructive'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light focus-visible:ring-offset-2 active:scale-[0.98]'

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'min-h-[36px] px-3 text-sm',
  md: 'min-h-[44px] px-4 text-[15px]',
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm hover:shadow-md',
  secondary: 'border border-primary bg-white text-primary hover:bg-indigo-50 active:bg-indigo-100 shadow-sm hover:shadow-md',
  // Destructive is text/outline only — never a filled red button.
  destructive: 'border border-danger bg-white text-danger hover:bg-red-50 active:bg-red-100 shadow-sm hover:shadow-md',
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return <button className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props} />
}
