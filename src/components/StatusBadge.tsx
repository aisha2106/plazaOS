export type StatusVariant = 'success' | 'warning' | 'danger' | 'info'

interface StatusBadgeProps {
  variant: StatusVariant
  label: string
  className?: string
}

const variantClasses: Record<StatusVariant, string> = {
  success: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  warning: 'bg-amber-100 text-amber-800 border border-amber-300',
  danger: 'bg-red-100 text-red-800 border border-red-300',
  info: 'bg-blue-100 text-blue-800 border border-blue-300',
}

/** Pill badge: light-tint background + full-opacity text, always paired with a label — never color alone. */
export function StatusBadge({ variant, label, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${variantClasses[variant]} ${className}`}
    >
      {label}
    </span>
  )
}
