import type {
  Announcement,
  CalendarEvent,
  MaintenanceRequest,
  Payment,
  Reminder,
  Tenant,
  Unit,
} from './types'

// TODO: replace every export in this file with real calls through src/lib/api.ts
// once the backend endpoints for units/tenants/payments/maintenance/
// announcements/reminders/calendar are available at VITE_API_BASE_URL.

export const mockUnits: Unit[] = [
  { id: 'unit-1', unitNumber: 'A-101', floor: '1', sizeSqft: 420, monthlyRent: 1200, status: 'occupied', tenantId: 'tenant-1', tenantName: 'Jane Cooper' },
  { id: 'unit-2', unitNumber: 'A-102', floor: '1', sizeSqft: 380, monthlyRent: 1100, status: 'occupied', tenantId: 'tenant-2', tenantName: 'Devon Lane' },
  { id: 'unit-3', unitNumber: 'B-201', floor: '2', sizeSqft: 560, monthlyRent: 1600, status: 'occupied', tenantId: 'tenant-3', tenantName: 'Wade Warren' },
  { id: 'unit-4', unitNumber: 'B-202', floor: '2', sizeSqft: 540, monthlyRent: 1550, status: 'maintenance' },
  { id: 'unit-5', unitNumber: 'B-204', floor: '2', sizeSqft: 560, monthlyRent: 1600, status: 'occupied', tenantId: 'tenant-4', tenantName: 'Esther Howard' },
  { id: 'unit-6', unitNumber: 'C-301', floor: '3', sizeSqft: 700, monthlyRent: 2100, status: 'occupied', tenantId: 'tenant-5', tenantName: 'Cameron Williamson' },
  { id: 'unit-7', unitNumber: 'C-302', floor: '3', sizeSqft: 680, monthlyRent: 2000, status: 'vacant' },
  { id: 'unit-8', unitNumber: 'C-310', floor: '3', sizeSqft: 720, monthlyRent: 2150, status: 'occupied', tenantId: 'tenant-6', tenantName: 'Guy Hawkins' },
]

export const mockTenants: Tenant[] = [
  { id: 'tenant-1', name: 'Jane Cooper', email: 'jane.cooper@example.com', phone: '+1 (555) 010-1234', unitId: 'unit-1', unitNumber: 'A-101', leaseStart: '2025-02-01', leaseEnd: '2026-01-31', monthlyRent: 1200, rentStatus: 'paid', status: 'active', accountStatus: 'active', mustChangePassword: false },
  { id: 'tenant-2', name: 'Devon Lane', email: 'devon.lane@example.com', phone: '+1 (555) 010-2345', unitId: 'unit-2', unitNumber: 'A-102', leaseStart: '2025-05-15', leaseEnd: '2026-05-14', monthlyRent: 1100, rentStatus: 'due', status: 'active', accountStatus: 'active', mustChangePassword: false },
  { id: 'tenant-3', name: 'Wade Warren', email: 'wade.warren@example.com', phone: '+1 (555) 010-3456', unitId: 'unit-3', unitNumber: 'B-201', leaseStart: '2024-11-01', leaseEnd: '2025-10-31', monthlyRent: 1600, rentStatus: 'overdue', status: 'active', accountStatus: 'active', mustChangePassword: false },
  { id: 'tenant-4', name: 'Esther Howard', email: 'esther.howard@example.com', phone: '+1 (555) 010-4567', unitId: 'unit-5', unitNumber: 'B-204', leaseStart: '2025-03-01', leaseEnd: '2026-02-28', monthlyRent: 1600, rentStatus: 'paid', status: 'active', accountStatus: 'active', mustChangePassword: false },
  { id: 'tenant-5', name: 'Cameron Williamson', email: 'cameron.williamson@example.com', phone: '+1 (555) 010-5678', unitId: 'unit-6', unitNumber: 'C-301', leaseStart: '2025-07-01', leaseEnd: '2026-06-30', monthlyRent: 2100, rentStatus: 'paid', status: 'active', accountStatus: 'active', mustChangePassword: false },
  { id: 'tenant-6', name: 'Guy Hawkins', email: 'guy.hawkins@example.com', phone: '+1 (555) 010-6789', unitId: 'unit-8', unitNumber: 'C-310', leaseStart: '2024-08-01', leaseEnd: '2025-07-31', monthlyRent: 2150, rentStatus: 'due', status: 'inactive', accountStatus: 'active', mustChangePassword: false },
]

export const mockPayments: Payment[] = [
  { id: 'payment-1', tenantId: 'tenant-1', tenantName: 'Jane Cooper', unitNumber: 'A-101', amount: 1200, method: 'gateway', status: 'paid', date: '2026-07-01', receiptAvailable: true },
  { id: 'payment-2', tenantId: 'tenant-2', tenantName: 'Devon Lane', unitNumber: 'A-102', amount: 1100, method: 'gateway', status: 'pending', date: '2026-07-28', receiptAvailable: false },
  { id: 'payment-3', tenantId: 'tenant-3', tenantName: 'Wade Warren', unitNumber: 'B-201', amount: 1600, method: 'bank_transfer', status: 'failed', date: '2026-07-15', note: 'Bank declined the transfer, tenant notified.', recordedBy: 'Admin', receiptAvailable: false },
  { id: 'payment-4', tenantId: 'tenant-4', tenantName: 'Esther Howard', unitNumber: 'B-204', amount: 1600, method: 'gateway', status: 'paid', date: '2026-07-02', receiptAvailable: true },
  { id: 'payment-5', tenantId: 'tenant-5', tenantName: 'Cameron Williamson', unitNumber: 'C-301', amount: 2100, method: 'cash', status: 'paid', date: '2026-07-03', note: 'Paid in person at the office.', recordedBy: 'Admin', receiptAvailable: true },
  { id: 'payment-6', tenantId: 'tenant-6', tenantName: 'Guy Hawkins', unitNumber: 'C-310', amount: 2150, method: 'check', status: 'pending', date: '2026-07-30', recordedBy: 'Admin', receiptAvailable: false },
  { id: 'payment-7', tenantId: 'tenant-1', tenantName: 'Jane Cooper', unitNumber: 'A-101', amount: 1200, method: 'gateway', status: 'paid', date: '2026-06-01', receiptAvailable: true },
  { id: 'payment-8', tenantId: 'tenant-3', tenantName: 'Wade Warren', unitNumber: 'B-201', amount: 1600, method: 'gateway', status: 'paid', date: '2026-06-01', receiptAvailable: true },
]

export const mockMaintenanceRequests: MaintenanceRequest[] = [
  { id: 'maint-1', tenantId: 'tenant-1', tenantName: 'Jane Cooper', unitId: 'unit-1', unitNumber: 'A-101', title: 'Leaking kitchen faucet', description: 'The faucet has been dripping steadily for two days.', status: 'open', priority: 'medium', images: ['https://placehold.co/640x480?text=Maintenance+Photo'], notes: '', createdAt: '2026-07-29', resolvedAt: null },
  { id: 'maint-2', tenantId: 'tenant-3', tenantName: 'Wade Warren', unitId: 'unit-3', unitNumber: 'B-201', title: 'AC not cooling', description: 'Unit blows warm air, checked filter already.', status: 'in_progress', priority: 'high', images: ['https://placehold.co/640x480?text=Maintenance+Photo'], notes: 'Technician scheduled for Aug 5.', createdAt: '2026-07-25', resolvedAt: null },
  { id: 'maint-3', tenantId: 'tenant-4', tenantName: 'Esther Howard', unitId: 'unit-5', unitNumber: 'B-204', title: 'Broken window latch', description: 'Latch on the west-facing window won’t catch.', status: 'resolved', priority: 'low', images: ['https://placehold.co/640x480?text=Maintenance+Photo'], notes: 'Latch replaced.', createdAt: '2026-07-10', resolvedAt: '2026-07-12' },
  { id: 'maint-4', tenantId: 'tenant-5', tenantName: 'Cameron Williamson', unitId: 'unit-6', unitNumber: 'C-301', title: 'Flickering hallway light', description: 'Light outside the unit flickers intermittently.', status: 'open', priority: 'low', images: ['https://placehold.co/640x480?text=Maintenance+Photo'], notes: '', createdAt: '2026-07-30', resolvedAt: null },
  { id: 'maint-5', tenantId: 'tenant-6', tenantName: 'Guy Hawkins', unitId: 'unit-8', unitNumber: 'C-310', title: 'Clogged drain', description: 'Bathroom sink drains very slowly.', status: 'in_progress', priority: 'medium', images: ['https://placehold.co/640x480?text=Maintenance+Photo'], notes: 'Plumber snaked the drain, monitoring.', createdAt: '2026-07-22', resolvedAt: null },
  { id: 'maint-6', tenantId: 'tenant-2', tenantName: 'Devon Lane', unitId: 'unit-2', unitNumber: 'A-102', title: 'Door lock sticking', description: 'Front door lock is hard to turn, may need lubrication or replacement.', status: 'resolved', priority: 'medium', images: ['https://placehold.co/640x480?text=Maintenance+Photo'], notes: 'Lock lubricated and tested.', createdAt: '2026-07-05', resolvedAt: '2026-07-06' },
]

export const mockAnnouncements: Announcement[] = [
  { id: 'announce-1', title: 'Water shutoff scheduled for Aug 6', body: 'Water will be shut off plaza-wide from 9am to 1pm for routine maintenance.', audience: 'all', audienceTenantIds: [], createdAt: '2026-07-30', author: 'Admin' },
  { id: 'announce-2', title: 'Reminder: rent due Aug 1', body: 'This is a friendly reminder that rent is due on the 1st of the month.', audience: 'all', audienceTenantIds: [], createdAt: '2026-07-28', author: 'Admin' },
  { id: 'announce-3', title: 'Elevator maintenance in B block', body: 'The elevator serving B block will be out of service Aug 3–4.', audience: 'selected', audienceTenantIds: ['tenant-3', 'tenant-4'], createdAt: '2026-07-27', author: 'Admin' },
]

export const mockReminders: Reminder[] = [
  { id: 'reminder-1', title: 'Rent due reminder', message: 'Your rent payment is due in 3 days.', type: 'automatic', target: 'everyone', targetLabel: 'All tenants', scheduledFor: '2026-07-29', status: 'sent' },
  { id: 'reminder-2', title: 'Lease renewal approaching', message: 'Your lease renews in 30 days — contact the office with questions.', type: 'automatic', target: 'tenant', targetLabel: 'Wade Warren', scheduledFor: '2026-08-01', status: 'scheduled' },
  { id: 'reminder-3', title: 'Overdue rent follow-up', message: 'Your rent payment is overdue, please settle it as soon as possible.', type: 'manual', target: 'tenant', targetLabel: 'Wade Warren', scheduledFor: '2026-07-20', status: 'sent' },
  { id: 'reminder-4', title: 'B block elevator outage', message: 'Reminder: the elevator will be out of service Aug 3–4.', type: 'manual', target: 'group', targetLabel: 'Wade Warren, Esther Howard', scheduledFor: '2026-08-02', status: 'scheduled' },
  { id: 'reminder-5', title: 'Payment gateway maintenance', message: 'The payment gateway will be briefly unavailable tonight.', type: 'manual', target: 'everyone', targetLabel: 'All tenants', scheduledFor: '2026-07-18', status: 'failed' },
]

export const mockCalendarEvents: CalendarEvent[] = [
  { id: 'event-1', title: 'Wade Warren lease renewal', type: 'lease_renewal', date: '2026-08-31', relatedLabel: 'B-201' },
  { id: 'event-2', title: 'Guy Hawkins lease renewal', type: 'lease_renewal', date: '2026-08-01', relatedLabel: 'C-310' },
  { id: 'event-3', title: 'Rent due reminder sent', type: 'reminder', date: '2026-07-29', relatedLabel: 'All tenants' },
  { id: 'event-4', title: 'Elevator outage reminder', type: 'reminder', date: '2026-08-02', relatedLabel: 'B block' },
  { id: 'event-5', title: 'Rent due', type: 'rent_due', date: '2026-08-01', relatedLabel: 'All tenants' },
  { id: 'event-6', title: 'Jane Cooper lease renewal', type: 'lease_renewal', date: '2026-01-31', relatedLabel: 'A-101' },
]

export function getUnitById(unitId: string): Unit | undefined {
  return mockUnits.find((unit) => unit.id === unitId)
}

export function getTenantById(tenantId: string): Tenant | undefined {
  return mockTenants.find((tenant) => tenant.id === tenantId)
}

export function getPaymentById(paymentId: string): Payment | undefined {
  return mockPayments.find((payment) => payment.id === paymentId)
}

export function getReminderById(reminderId: string): Reminder | undefined {
  return mockReminders.find((reminder) => reminder.id === reminderId)
}
