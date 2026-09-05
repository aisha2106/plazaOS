/**
 * Format a number as Nigerian Naira (₦)
 */
export function formatNaira(amount: number | undefined | null): string {
  if (amount == null) return '₦0'
  return `₦${amount.toLocaleString('en-NG')}`
}

/**
 * Format a date string to human-readable format
 */
export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Format a date and time
 */
export function formatDateTime(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncate(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length)}…` : text
}
