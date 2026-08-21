import type { ReactNode } from 'react'
import { Text } from '../../../components'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <Text variant="h1">{title}</Text>
        {description ? (
          <Text variant="body" className="mt-1 text-slate-500">
            {description}
          </Text>
        ) : null}
      </div>
      {action}
    </div>
  )
}
