import { Link } from 'react-router-dom'

interface BackLinkProps {
  to: string
  label: string
}

export function BackLink({ to, label }: BackLinkProps) {
  return (
    <Link to={to} className="mb-4 inline-flex min-h-[44px] items-center text-[15px] font-medium text-primary hover:text-primary-light">
      ← {label}
    </Link>
  )
}
