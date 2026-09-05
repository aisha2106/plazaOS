import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className = '', ...props }: CardProps) {
  return <div className={`rounded-card border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`} {...props} />
}
