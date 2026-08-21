import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from './AuthShell'
import { requestPasswordReset } from './passwordResetTokens'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [devToken, setDevToken] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)

    // TODO: becomes POST /auth/forgot-password once the backend exists — it
    // must respond identically regardless of match, and send the email
    // itself instead of this dev-only reveal below.
    const token = requestPasswordReset(email)

    window.setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      if (import.meta.env.DEV) setDevToken(token)
    }, 300)
  }

  if (submitted) {
    return (
      <AuthShell plateLabel="PLAZA OS · CHECK YOUR EMAIL">
        <div className="py-2 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#16161F]">Check your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6B6B7D]">
            If an account exists for that address, we've sent a link to reset the password. It expires in 30 minutes.
          </p>

          {devToken && (
            <div className="mt-6 rounded-lg border border-[#E6E6EF] bg-[#F7F7FA] p-4 text-left">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-warning">Dev only — stands in for the email</p>
              <Link
                to={`/reset-password?token=${devToken}`}
                className="mt-2 block break-all font-mono text-[13px] text-primary hover:underline"
              >
                /reset-password?token={devToken}
              </Link>
            </div>
          )}

          <Link to="/login" className="mt-6 inline-block text-[13px] font-medium text-primary hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell plateLabel="PLAZA OS · RESET PASSWORD">
      <h1 className="font-display text-2xl font-bold tracking-tight text-[#16161F]">Reset your password</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#6B6B7D]">Enter your email and we'll send you a link to reset it.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.14em] text-[#6B6B7D]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[#E6E6EF] bg-white px-4 py-3 text-[15px] text-[#16161F] outline-none transition-colors placeholder:text-[#A8A8B8] focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary px-4 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-light focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 border-t border-[#E6E6EF] pt-5 text-center text-[13px] leading-relaxed text-[#6B6B7D]">
        <Link to="/login" className="font-medium text-primary hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
