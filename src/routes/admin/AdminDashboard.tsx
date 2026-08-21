import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../components'
import { useAuth } from '../../context/AuthContext'
import { mockCalendarEvents, mockMaintenanceRequests, mockPayments, mockTenants, mockUnits } from './data/mockData'
import type { PaymentStatus } from './data/types'
import { formatAge, formatHeaderDate, formatPastDate, formatRelativeFutureDate } from './dateFormat'

const SECTION_LABEL = 'font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500'

// TODO: replace these derived stats with a real summary endpoint once the
// backend is reachable.
const totalUnits = mockUnits.length
const occupiedUnits = mockUnits.filter((unit) => unit.status === 'occupied').length
const vacantUnits = mockUnits.filter((unit) => unit.status === 'vacant').length
const maintenanceUnits = mockUnits.filter((unit) => unit.status === 'maintenance').length
const activeTenantCount = mockTenants.filter((tenant) => tenant.status === 'active').length
const overdueTenants = mockTenants.filter((tenant) => tenant.rentStatus === 'overdue')
const failedPayments = mockPayments.filter((payment) => payment.status === 'failed')
const openMaintenanceRequests = mockMaintenanceRequests.filter((request) => request.status === 'open')

interface AttentionItem {
  id: string
  title: string
  unitTag: string
  statusLabel: string
  trailing: string
  href: string
  dot: 'red' | 'amber'
}

// Order matters: overdue rent, then failed payments, then open maintenance.
const attentionItems: AttentionItem[] = [
  ...overdueTenants.map(
    (tenant): AttentionItem => ({
      id: `tenant-${tenant.id}`,
      title: tenant.name,
      unitTag: tenant.unitNumber,
      statusLabel: 'Rent overdue',
      trailing: `$${tenant.monthlyRent.toLocaleString()}`,
      href: `/admin/tenants/${tenant.id}`,
      dot: 'red',
    }),
  ),
  ...failedPayments.map(
    (payment): AttentionItem => ({
      id: `payment-${payment.id}`,
      title: payment.tenantName,
      unitTag: payment.unitNumber,
      statusLabel: 'Payment failed',
      trailing: formatPastDate(payment.date),
      href: `/admin/payments/${payment.id}`,
      dot: 'red',
    }),
  ),
  ...openMaintenanceRequests.map(
    (request): AttentionItem => ({
      id: `maintenance-${request.id}`,
      title: request.title,
      unitTag: request.unitNumber,
      statusLabel: 'Maintenance',
      trailing: formatAge(request.createdAt),
      href: `/admin/maintenance/${request.id}`,
      dot: 'amber',
    }),
  ),
]

const VISIBLE_ATTENTION_CAP = 5
const visibleAttentionItems = attentionItems.slice(0, VISIBLE_ATTENTION_CAP)
const attentionOverflow = attentionItems.length > VISIBLE_ATTENTION_CAP

// When capped, "View all" points at whichever category contributes the most
// items — there's no single combined list page for all three resource types.
const fullestListHref = (
  [
    ['/admin/tenants', overdueTenants.length],
    ['/admin/payments', failedPayments.length],
    ['/admin/maintenance', openMaintenanceRequests.length],
  ] as const
).reduce((max, current) => (current[1] > max[1] ? current : max))[0]

const recentPayments = [...mockPayments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)

// ISO dates sort correctly as strings. "Upcoming" means from today forward —
// the previous version took the 4 earliest dates in the array regardless of
// whether they'd already passed, which read fine as raw ISO strings but is
// visibly wrong once rendered as relative dates ("29 Jul" showing as a past
// date in a list called "Upcoming").
// Built from local date parts, not toISOString() (which is UTC and can be
// off by a day depending on timezone), matching dateFormat.ts's local-date handling.
const todayLocal = new Date()
const todayIso = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`
const upcomingEvents = [...mockCalendarEvents]
  .filter((event) => event.date >= todayIso)
  .sort((a, b) => a.date.localeCompare(b.date))
  .slice(0, 4)

const paymentStatusLabel: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
}

// Existing StatusBadge (bg-*/10, text-*) is shared app-wide, so left alone —
// these pills are softer specifically for this page, per the redesign spec,
// using Tailwind's own shade scales since success/warning/danger are flat
// single-value tokens with no -50/-700 variants to draw on.
const paymentPillClasses: Record<PaymentStatus, string> = {
  paid: 'bg-green-50 text-green-700 ring-1 ring-green-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  failed: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function buildSummaryLine(overdueCount: number, maintenanceCount: number): string {
  const parts: string[] = []
  if (overdueCount > 0) {
    parts.push(`${overdueCount} tenant${overdueCount === 1 ? '' : 's'} ${overdueCount === 1 ? 'is' : 'are'} behind on rent`)
  }
  if (maintenanceCount > 0) {
    parts.push(
      `${maintenanceCount} maintenance request${maintenanceCount === 1 ? '' : 's'} ${maintenanceCount === 1 ? 'is' : 'are'} waiting`,
    )
  }
  if (parts.length === 0) return 'Everything is up to date.'
  return `${parts.join(' and ')}.`
}

export function AdminDashboard() {
  const { user } = useAuth()
  const now = new Date()
  const firstName = user?.name?.split(' ')[0] ?? ''
  const greeting = getGreeting(now.getHours())
  const summaryLine = buildSummaryLine(overdueTenants.length, openMaintenanceRequests.length)

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Greeting header */}
      <div>
        <p className={SECTION_LABEL}>{formatHeaderDate(now)}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#16161F]">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-2 text-[15px] text-slate-600">{summaryLine}</p>
      </div>

      {/* 2. Needs attention */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className={SECTION_LABEL}>Needs attention</h2>
          {attentionItems.length > 0 && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              {attentionItems.length}
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-card border border-slate-200 bg-white">
          {attentionItems.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[15px] font-medium text-slate-900">Nothing needs your attention right now.</p>
              <p className="mt-1 text-sm text-slate-500">New maintenance requests and overdue payments will appear here.</p>
            </div>
          ) : (
            <>
              <ul>
                {visibleAttentionItems.map((item, index) => (
                  <li key={item.id} className={index > 0 ? 'border-t border-slate-100' : ''}>
                    <Link
                      to={item.href}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light focus-visible:ring-inset"
                    >
                      <span
                        aria-hidden="true"
                        className={`h-2 w-2 shrink-0 rounded-full ${item.dot === 'red' ? 'bg-danger' : 'bg-warning'}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-slate-900">{item.title}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-[13px] text-slate-500">
                          <span className="font-mono text-[11px] tracking-wide">{item.unitTag}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.statusLabel}</span>
                        </span>
                      </span>
                      <span className="shrink-0 text-[13px] text-slate-500">{item.trailing}</span>
                      <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-slate-400" />
                    </Link>
                  </li>
                ))}
              </ul>
              {attentionOverflow && (
                <div className="border-t border-slate-100 px-4 py-3">
                  <Link to={fullestListHref} className="text-[13px] font-medium text-primary hover:text-primary-light">
                    View all ({attentionItems.length})
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 3. Plaza at a glance */}
      <section>
        <h2 className={`mb-3 ${SECTION_LABEL}`}>Plaza at a glance</h2>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-slate-200 bg-slate-200 sm:grid-cols-4">
          <div className="bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Units</p>
            <p className="mt-1 text-2xl font-semibold text-[#16161F]">{totalUnits}</p>
            <p className="mt-1 text-xs text-slate-500">
              {occupiedUnits} occupied · {vacantUnits} vacant{maintenanceUnits > 0 ? ` · ${maintenanceUnits} maintenance` : ''}
            </p>
          </div>
          <div className="bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Active tenants</p>
            <p className="mt-1 text-2xl font-semibold text-[#16161F]">{activeTenantCount}</p>
            <p className="mt-1 text-xs text-slate-500">of {mockTenants.length} total</p>
          </div>
          <div className="bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Rent overdue</p>
            <p className="mt-1 text-2xl font-semibold text-[#16161F]">{overdueTenants.length}</p>
            <p className="mt-1 text-xs text-slate-500">tenant{overdueTenants.length === 1 ? '' : 's'} behind on rent</p>
          </div>
          <div className="bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Open maintenance</p>
            <p className="mt-1 text-2xl font-semibold text-[#16161F]">{openMaintenanceRequests.length}</p>
            <p className="mt-1 text-xs text-slate-500">request{openMaintenanceRequests.length === 1 ? '' : 's'} awaiting action</p>
          </div>
        </div>
      </section>

      {/* 4. The two panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className={SECTION_LABEL}>Recent payments</h2>
            <Link to="/admin/payments" className="text-[13px] font-medium text-primary hover:text-primary-light">
              View all
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No payments yet.</p>
          ) : (
            <ul className="flex flex-col">
              {recentPayments.map((payment) => (
                <li key={payment.id}>
                  <Link
                    to={`/admin/payments/${payment.id}`}
                    className="flex items-center justify-between gap-3 rounded-button px-2 py-2.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-slate-900">{payment.tenantName}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[13px] text-slate-500">
                        <span className="font-mono text-[11px] tracking-wide">{payment.unitNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatPastDate(payment.date)}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${paymentPillClasses[payment.status]}`}>
                      {paymentStatusLabel[payment.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className={SECTION_LABEL}>Upcoming calendar</h2>
            <Link to="/admin/calendar" className="text-[13px] font-medium text-primary hover:text-primary-light">
              View calendar
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Nothing scheduled.</p>
          ) : (
            <ul className="flex flex-col">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 px-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] text-slate-900">{event.title}</p>
                    {event.relatedLabel ? (
                      <p className="mt-0.5 font-mono text-[11px] tracking-wide text-slate-500">{event.relatedLabel}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[13px] text-slate-500">{formatRelativeFutureDate(event.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
