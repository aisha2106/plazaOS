import type { ElementType, ReactNode } from 'react'

export type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'button'

const variantClasses: Record<TextVariant, string> = {
  display: 'text-3xl leading-[1.2] font-bold tracking-tight',
  h1: 'text-2xl leading-[1.3] font-bold tracking-tight',
  h2: 'text-xl leading-[1.3] font-semibold tracking-tight',
  h3: 'text-base leading-[1.4] font-semibold',
  body: 'text-[15px] leading-[1.6] font-normal',
  bodySmall: 'text-[13px] leading-[1.5] font-normal',
  caption: 'text-xs leading-[1.4] font-medium uppercase tracking-wide',
  button: 'text-[15px] leading-none font-semibold',
}

const defaultElements: Record<TextVariant, ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  body: 'p',
  bodySmall: 'p',
  caption: 'span',
  button: 'span',
}

interface TextProps {
  variant: TextVariant
  as?: ElementType
  className?: string
  children: ReactNode
}

/** Typography primitive implementing the shared type scale (Display/H1/H2/H3/Body/Body Small/Caption/Button). */
export function Text({ variant, as, className = '', children }: TextProps) {
  const Component = as ?? defaultElements[variant]
  return <Component className={`${variantClasses[variant]} ${className}`}>{children}</Component>
}
