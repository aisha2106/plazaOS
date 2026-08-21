import { useState } from 'react'
import { Link } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'How It Works', href: '#how-it-works' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-primary">
              <img src="/PlazaOS%20logo.png" alt="PlazaOS" className="h-8 w-auto" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="inline-flex min-h-[44px] items-center justify-center rounded-button border border-primary bg-white px-4 text-[15px] font-semibold text-primary hover:bg-primary/5 transition-colors">
              Log In
            </Link>
            <Link to="/login" className="inline-flex min-h-[44px] items-center justify-center rounded-button bg-primary px-4 text-[15px] font-semibold text-white hover:bg-primary-light transition-colors">
              Get Started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-slate-200 pb-4 pt-2">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2">
              <Link to="/login" className="inline-flex min-h-[44px] items-center justify-center rounded-button border border-primary bg-white px-4 text-[15px] font-semibold text-primary hover:bg-primary/5 transition-colors">
                Log In
              </Link>
              <Link to="/login" className="inline-flex min-h-[44px] items-center justify-center rounded-button bg-primary px-4 text-[15px] font-semibold text-white hover:bg-primary-light transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
