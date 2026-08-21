import { Link } from 'react-router-dom'
import { DashboardMockup } from '../components/landing/DashboardMockup'
import { Footer } from '../components/landing/Footer'
import { Navbar } from '../components/landing/Navbar'

const FEATURES = [
  {
    title: 'Tenant Management',
    description: 'Manage tenant information, units, leases, and occupancy from one place.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Rent & Payments',
    description: 'Track rent, payments, outstanding balances, and payment history.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    title: 'Maintenance',
    description: 'Create, assign, track, and resolve maintenance requests.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    title: 'Plaza Operations',
    description: 'Manage units, facilities, activities, and day-to-day operations.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="9" y1="6" x2="9" y2="6.01" />
        <line x1="15" y1="6" x2="15" y2="6.01" />
        <line x1="9" y1="10" x2="9" y2="10.01" />
        <line x1="15" y1="10" x2="15" y2="10.01" />
        <line x1="9" y1="14" x2="9" y2="14.01" />
        <line x1="15" y1="14" x2="15" y2="14.01" />
        <line x1="9" y1="18" x2="9" y2="18.01" />
        <line x1="15" y1="18" x2="15" y2="18.01" />
      </svg>
    ),
  },
  {
    title: 'Reports & Analytics',
    description: 'Turn plaza data into useful insights and performance reports.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    title: 'Notifications',
    description: 'Keep tenants, managers, and staff informed with timely notifications.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Set Up Your Plaza',
    description: 'Add your properties, units, tenants, and operational information.',
  },
  {
    number: '02',
    title: 'Manage Everything',
    description: 'Handle payments, tenants, maintenance, operations, and communication from one dashboard.',
  },
  {
    number: '03',
    title: 'Understand Your Business',
    description: 'Use reports and analytics to make better decisions.',
  },
]

const BENEFITS = [
  'Save time with streamlined operations',
  'Reduce manual work and human error',
  'Improve tenant communication',
  'Track payments more effectively',
  'Resolve maintenance issues faster',
  'Make data-driven decisions',
]

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-slate-50/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <div className="max-w-2xl">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight">
                  Manage Your Plaza. Smarter.
                </h1>
                <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                  PlazaOS brings tenants, payments, maintenance, operations, and insights together in one powerful platform built for modern plaza management.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link to="/login" className="inline-flex min-h-[44px] items-center justify-center rounded-button bg-primary px-6 text-[15px] font-semibold text-white hover:bg-primary-light transition-colors">
                    Get Started
                  </Link>
                  <a href="#how-it-works" className="inline-flex min-h-[44px] items-center justify-center rounded-button border border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                    See How It Works
                  </a>
                </div>
              </div>
              <div className="relative lg:pl-8">
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl" />
                  <DashboardMockup />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Everything you need to run a modern plaza</h2>
              <p className="mt-4 text-base text-slate-600">
                PlazaOS centralizes day-to-day property operations into one system, so you can focus on growing your business instead of juggling tools.
              </p>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-16 py-20 lg:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Everything in one place.</h2>
              <p className="mt-4 text-lg text-slate-600">
                A complete toolkit for plaza management, from tenant onboarding to financial reporting.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-card border border-slate-200 bg-white p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-16 py-20 lg:py-24 bg-slate-50/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">How it works</h2>
              <p className="mt-4 text-lg text-slate-600">
                Get up and running in minutes, not months.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-0.5 bg-slate-200" />
              {STEPS.map((step) => (
                <div key={step.number} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white border-2 border-primary text-primary text-xl font-bold shadow-sm">
                      {step.number}
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-xs">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="solutions" className="scroll-mt-16 py-20 lg:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Your entire plaza at a glance.</h2>
              <p className="mt-4 text-lg text-slate-600">
                Get a complete view of your property performance, tenant activity, and operational metrics — all in one place.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl" />
              <DashboardMockup />
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-24 bg-slate-50/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Built for performance</h2>
              <p className="mt-4 text-lg text-slate-600">
                Everything you need to run a more efficient, profitable plaza operation.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 rounded-card border border-slate-200 bg-white p-5">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="get-started" className="scroll-mt-16 py-20 lg:py-24 bg-primary">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Run your plaza with confidence.</h2>
            <p className="mt-4 text-lg text-primary-light/80">
              Bring your operations, tenants, payments, and insights together with PlazaOS.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="inline-flex min-h-[44px] items-center justify-center rounded-button bg-white px-6 text-[15px] font-semibold text-primary hover:bg-slate-100 transition-colors">
                Get Started
              </Link>
              <Link to="/login" className="inline-flex min-h-[44px] items-center justify-center rounded-button border border-white/30 px-6 text-[15px] font-semibold text-white hover:bg-white/10 transition-colors">
                Log In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
