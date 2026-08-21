export type StatusVariant = 'success' | 'warning' | 'danger' | 'info'

interface StatusBadgeProps {
  variant: StatusVariant
  label: string
  className?: string
}

const variantClasses: Record<StatusVariant, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
}

/** Pill badge: light-tint background + full-opacity text, always paired with a label — never color alone. */
export function StatusBadge({ variant, label, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {label}
    </span>
  )
}
