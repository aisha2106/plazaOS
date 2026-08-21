const DAY_MS = 24 * 60 * 60 * 1000

function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function daysBetween(from: Date, to: Date): number {
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((toMidnight.getTime() - fromMidnight.getTime()) / DAY_MS)
}

// en-GB orders day before month ('30 Jul'); en-US would read 'Jul 30'.
const DATE_LOCALE = 'en-GB'

/** '30 Jul' for this year, '30 Jul 2025' otherwise. Used as the fallback inside the relative formatters below. */
function formatShortDate(isoDate: string): string {
  const date = parseLocalDate(isoDate)
  const now = new Date()
  const options: Intl.DateTimeFormatOptions =
    date.getFullYear() === now.getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' }
  return new Intl.DateTimeFormat(DATE_LOCALE, options).format(date)
}

/** 'FRIDAY, 21 AUGUST' — for the dashboard greeting header. */
export function formatHeaderDate(date: Date): string {
  const parts = new Intl.DateTimeFormat(DATE_LOCALE, { weekday: 'long', day: 'numeric', month: 'long' }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('weekday')}, ${get('day')} ${get('month')}`.toUpperCase()
}

/** For past-leaning dates (e.g. payment history): 'Today', 'Yesterday', else formatShortDate. */
export function formatPastDate(isoDate: string): string {
  const diff = daysBetween(parseLocalDate(isoDate), new Date())
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return formatShortDate(isoDate)
}

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat(DATE_LOCALE, { weekday: 'long' })

/** For future-leaning dates (e.g. upcoming calendar): 'Today', 'Tomorrow', 'in N days', 'next {Weekday}', else formatShortDate. */
export function formatRelativeFutureDate(isoDate: string): string {
  const target = parseLocalDate(isoDate)
  const diff = daysBetween(new Date(), target)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff <= 6) return `in ${diff} days`
  if (diff > 6 && diff <= 13) return `next ${WEEKDAY_FORMATTER.format(target)}`
  if (diff < 0) return formatShortDate(isoDate)
  return formatShortDate(isoDate)
}

/** Age since creation, for Needs attention rows: 'Today', 'Yesterday', else '{n} days'. */
export function formatAge(isoDate: string): string {
  const diff = daysBetween(parseLocalDate(isoDate), new Date())
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff} days`
}
