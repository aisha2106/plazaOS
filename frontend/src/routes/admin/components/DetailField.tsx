import type { ReactNode } from 'react'
import { Text } from '../../../components'

interface DetailFieldProps {
  label: string
  children: ReactNode
}

export function DetailField({ label, children }: DetailFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <Text variant="caption" className="uppercase tracking-wide text-slate-500">
        {label}
      </Text>
      <Text variant="body" className="text-slate-900">
        {children}
      </Text>
    </div>
  )
}
