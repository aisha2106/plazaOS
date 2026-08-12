// Shared status enums used by both the admin and tenant halves of the app —
// keep these as the single source of truth so the two sides can't drift again.
export type PaymentStatus = 'paid' | 'pending' | 'failed' 
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved'
