import type { ReactNode } from 'react'

interface AuthShellProps {
  plateLabel: string
  plateVariant?: 'default' | 'success'
  children: ReactNode
}

/**
 * Shared visual shell for the unauthenticated auth screens (sign in, forgot
 * password, reset password) and the forced first-login password screen:
 * the quiet plaza-plan grid backdrop and the plate — the signature element,
 * dark by default and brass on success.
 */
export function AuthShell({ plateLabel, plateVariant = 'default', children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#F7F7FA] p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(#E6E6EF 1px, transparent 1px), linear-gradient(90deg, #E6E6EF 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <div className="relative w-full max-w-[400px]">
        <div
          className={`flex items-center justify-center rounded-t-xl px-4 py-2.5 font-mono text-[11px] tracking-[0.18em] transition-colors duration-500 motion-reduce:transition-none ${
            plateVariant === 'success' ? 'bg-[#B8873A] text-white' : 'bg-[#16161F] text-white/70'
          }`}
        >
          {plateLabel}
        </div>

        <div className="rounded-b-xl border border-t-0 border-[#E6E6EF] bg-white p-8 shadow-sm">{children}</div>
      </div>
    </div>
  )
}
