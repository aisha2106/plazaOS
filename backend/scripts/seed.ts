// Seeds MongoDB with FAKE development/test data shaped like
// src/routes/admin/data/mockData.ts in the frontend repo, so local dev against
// this real backend looks identical to today's mock-data experience.
// Dev/test-only: refuses to run when NODE_ENV=production, and never creates
// the real admin account (run `npm run bootstrap:admin` for that, separately,
// per BACKEND_BUILD_PLAN.md §8/§9) so fake data never mixes with it.
// Run with: npm run seed
import 'dotenv/config'
import mongoose from 'mongoose'
import { dbConnect } from '../src/lib/db'
import { hashPassword, generateTempPassword } from '../src/lib/password'
import { User } from '../src/models/User'
import { Unit } from '../src/models/Unit'
import { Lease } from '../src/models/Lease'
import { RentCharge } from '../src/models/RentCharge'
import { Payment } from '../src/models/Payment'
import { MaintenanceRequest } from '../src/models/MaintenanceRequest'
import { Announcement } from '../src/models/Announcement'
import { Reminder } from '../src/models/Reminder'
import { CalendarEvent } from '../src/models/CalendarEvent'
import { Notification } from '../src/models/Notification'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run the development seed script with NODE_ENV=production.')
  process.exit(1)
}

async function seed() {
  await dbConnect()

  const admin = await User.findOne({ role: 'admin' })
  if (!admin) {
    console.error('No admin account found. Run `npm run bootstrap:admin` first (see BACKEND_BUILD_PLAN.md §9).')
    process.exit(1)
  }

  console.log('Clearing existing fake/dev data (tenant users + mock collections)...')
  await Promise.all([
    User.deleteMany({ role: 'tenant' }),
    Unit.deleteMany({}),
    Lease.deleteMany({}),
    RentCharge.deleteMany({}),
    Payment.deleteMany({}),
    MaintenanceRequest.deleteMany({}),
    Announcement.deleteMany({}),
    Reminder.deleteMany({}),
    CalendarEvent.deleteMany({}),
    Notification.deleteMany({}),
  ])

  const tenantPassword = process.env.SEED_TENANT_PASSWORD || generateTempPassword()
  const tenantPasswordHash = await hashPassword(tenantPassword)

  const unitDefs = [
    { unitNumber: 'A-101', floor: '1', sizeSqft: 420, monthlyRent: 1200, status: 'occupied' as const },
    { unitNumber: 'A-102', floor: '1', sizeSqft: 380, monthlyRent: 1100, status: 'occupied' as const },
    { unitNumber: 'B-201', floor: '2', sizeSqft: 560, monthlyRent: 1600, status: 'occupied' as const },
    { unitNumber: 'B-202', floor: '2', sizeSqft: 540, monthlyRent: 1550, status: 'maintenance' as const },
    { unitNumber: 'B-204', floor: '2', sizeSqft: 560, monthlyRent: 1600, status: 'occupied' as const },
    { unitNumber: 'C-301', floor: '3', sizeSqft: 700, monthlyRent: 2100, status: 'occupied' as const },
    { unitNumber: 'C-302', floor: '3', sizeSqft: 680, monthlyRent: 2000, status: 'vacant' as const },
    { unitNumber: 'C-310', floor: '3', sizeSqft: 720, monthlyRent: 2150, status: 'occupied' as const },
  ]
  const units = await Unit.insertMany(unitDefs)
  const unitByNumber = new Map(units.map((unit) => [unit.unitNumber, unit]))

  const tenantDefs = [
    { name: 'Jane Cooper', email: 'jane.cooper@example.com', phone: '+1 (555) 010-1234', unitNumber: 'A-101', leaseStart: '2025-02-01', leaseEnd: '2026-01-31', monthlyRent: 1200, rentStatus: 'paid' as const, status: 'active' as const },
    { name: 'Devon Lane', email: 'devon.lane@example.com', phone: '+1 (555) 010-2345', unitNumber: 'A-102', leaseStart: '2025-05-15', leaseEnd: '2026-05-14', monthlyRent: 1100, rentStatus: 'due' as const, status: 'active' as const },
    { name: 'Wade Warren', email: 'wade.warren@example.com', phone: '+1 (555) 010-3456', unitNumber: 'B-201', leaseStart: '2024-11-01', leaseEnd: '2025-10-31', monthlyRent: 1600, rentStatus: 'overdue' as const, status: 'active' as const },
    { name: 'Esther Howard', email: 'esther.howard@example.com', phone: '+1 (555) 010-4567', unitNumber: 'B-204', leaseStart: '2025-03-01', leaseEnd: '2026-02-28', monthlyRent: 1600, rentStatus: 'paid' as const, status: 'active' as const },
    { name: 'Cameron Williamson', email: 'cameron.williamson@example.com', phone: '+1 (555) 010-5678', unitNumber: 'C-301', leaseStart: '2025-07-01', leaseEnd: '2026-06-30', monthlyRent: 2100, rentStatus: 'paid' as const, status: 'active' as const },
    { name: 'Guy Hawkins', email: 'guy.hawkins@example.com', phone: '+1 (555) 010-6789', unitNumber: 'C-310', leaseStart: '2024-08-01', leaseEnd: '2025-07-31', monthlyRent: 2150, rentStatus: 'due' as const, status: 'inactive' as const },
  ]

  const tenants = []
  for (const def of tenantDefs) {
    const unit = unitByNumber.get(def.unitNumber)
    const tenant = await User.create({
      name: def.name,
      email: def.email,
      passwordHash: tenantPasswordHash,
      role: 'tenant',
      phone: def.phone,
      unitId: unit?._id,
      unitNumber: def.unitNumber,
      status: def.status,
      accountStatus: 'active',
      mustChangePassword: false,
    })
    if (unit) {
      unit.tenantId = tenant._id
      unit.tenantName = tenant.name
      await unit.save()
    }
    tenants.push(tenant)
  }
  console.log(`Created ${tenants.length} tenants (password: ${tenantPassword})`)

  // Each tenant gets a Lease (the ongoing agreement) and a single open
  // RentCharge for the current period, derived from the old `rentStatus` value.
  const rentChargeByEmail = new Map<string, InstanceType<typeof RentCharge>>()
  for (let i = 0; i < tenantDefs.length; i++) {
    const def = tenantDefs[i]
    const tenant = tenants[i]
    const lease = await Lease.create({
      tenantId: tenant._id,
      unitId: tenant.unitId,
      startDate: def.leaseStart,
      endDate: def.leaseEnd,
      rentAmount: def.monthlyRent,
      rentDueDay: 1,
      status: 'active',
    })
    const rentCharge = await RentCharge.create({
      tenantId: tenant._id,
      unitId: tenant.unitId,
      leaseId: lease._id,
      period: '2026-07',
      amount: def.monthlyRent,
      dueDate: '2026-07-01',
      status: def.rentStatus,
    })
    rentChargeByEmail.set(def.email, rentCharge)
  }
  console.log(`Created ${tenantDefs.length} leases and rent charges`)

  const tenantByEmail = new Map(tenants.map((tenant) => [tenant.email, tenant]))
  const jane = tenantByEmail.get('jane.cooper@example.com')!
  const devon = tenantByEmail.get('devon.lane@example.com')!
  const wade = tenantByEmail.get('wade.warren@example.com')!
  const esther = tenantByEmail.get('esther.howard@example.com')!
  const cameron = tenantByEmail.get('cameron.williamson@example.com')!
  const guy = tenantByEmail.get('guy.hawkins@example.com')!

  await Payment.insertMany([
    { tenantId: jane._id, tenantName: jane.name, unitId: unitByNumber.get('A-101')?._id, unitNumber: 'A-101', rentChargeId: rentChargeByEmail.get(jane.email)?._id, amount: 1200, method: 'gateway', status: 'paid', date: '2026-07-01' },
    { tenantId: devon._id, tenantName: devon.name, unitId: unitByNumber.get('A-102')?._id, unitNumber: 'A-102', rentChargeId: rentChargeByEmail.get(devon.email)?._id, amount: 1100, method: 'gateway', status: 'pending', date: '2026-07-28' },
    { tenantId: wade._id, tenantName: wade.name, unitId: unitByNumber.get('B-201')?._id, unitNumber: 'B-201', amount: 1600, method: 'bank_transfer', status: 'failed', date: '2026-07-15', note: 'Bank declined the transfer, tenant notified.', recordedBy: admin._id },
    { tenantId: esther._id, tenantName: esther.name, unitId: unitByNumber.get('B-204')?._id, unitNumber: 'B-204', rentChargeId: rentChargeByEmail.get(esther.email)?._id, amount: 1600, method: 'gateway', status: 'paid', date: '2026-07-02' },
    { tenantId: cameron._id, tenantName: cameron.name, unitId: unitByNumber.get('C-301')?._id, unitNumber: 'C-301', rentChargeId: rentChargeByEmail.get(cameron.email)?._id, amount: 2100, method: 'cash', status: 'paid', date: '2026-07-03', note: 'Paid in person at the office.', recordedBy: admin._id },
    { tenantId: guy._id, tenantName: guy.name, unitId: unitByNumber.get('C-310')?._id, unitNumber: 'C-310', amount: 2150, method: 'check', status: 'pending', date: '2026-07-30', recordedBy: admin._id },
    { tenantId: jane._id, tenantName: jane.name, unitId: unitByNumber.get('A-101')?._id, unitNumber: 'A-101', amount: 1200, method: 'gateway', status: 'paid', date: '2026-06-01' },
    { tenantId: wade._id, tenantName: wade.name, unitId: unitByNumber.get('B-201')?._id, unitNumber: 'B-201', amount: 1600, method: 'gateway', status: 'paid', date: '2026-06-01' },
  ])
  console.log('Created payments')

  await MaintenanceRequest.insertMany([
    { tenantId: jane._id, tenantName: jane.name, unitId: unitByNumber.get('A-101')?._id, unitNumber: 'A-101', title: 'Leaking kitchen faucet', description: 'The faucet has been dripping steadily for two days.', status: 'open', priority: 'medium', images: [{ url: 'https://placehold.co/640x480?text=Maintenance+Photo', publicId: 'seed-placeholder-1' }], notes: '' },
    { tenantId: wade._id, tenantName: wade.name, unitId: unitByNumber.get('B-201')?._id, unitNumber: 'B-201', title: 'AC not cooling', description: 'Unit blows warm air, checked filter already.', status: 'in_progress', priority: 'high', images: [{ url: 'https://placehold.co/640x480?text=Maintenance+Photo', publicId: 'seed-placeholder-2' }], notes: 'Technician scheduled for Aug 5.' },
    { tenantId: esther._id, tenantName: esther.name, unitId: unitByNumber.get('B-204')?._id, unitNumber: 'B-204', title: 'Broken window latch', description: 'Latch on the west-facing window won\u2019t catch.', status: 'resolved', priority: 'low', images: [{ url: 'https://placehold.co/640x480?text=Maintenance+Photo', publicId: 'seed-placeholder-3' }], notes: 'Latch replaced.', resolvedAt: '2026-07-12' },
    { tenantId: cameron._id, tenantName: cameron.name, unitId: unitByNumber.get('C-301')?._id, unitNumber: 'C-301', title: 'Flickering hallway light', description: 'Light outside the unit flickers intermittently.', status: 'open', priority: 'low', images: [{ url: 'https://placehold.co/640x480?text=Maintenance+Photo', publicId: 'seed-placeholder-4' }], notes: '' },
    { tenantId: guy._id, tenantName: guy.name, unitId: unitByNumber.get('C-310')?._id, unitNumber: 'C-310', title: 'Clogged drain', description: 'Bathroom sink drains very slowly.', status: 'in_progress', priority: 'medium', images: [{ url: 'https://placehold.co/640x480?text=Maintenance+Photo', publicId: 'seed-placeholder-5' }], notes: 'Plumber snaked the drain, monitoring.' },
    { tenantId: devon._id, tenantName: devon.name, unitId: unitByNumber.get('A-102')?._id, unitNumber: 'A-102', title: 'Door lock sticking', description: 'Front door lock is hard to turn, may need lubrication or replacement.', status: 'resolved', priority: 'medium', images: [{ url: 'https://placehold.co/640x480?text=Maintenance+Photo', publicId: 'seed-placeholder-6' }], notes: 'Lock lubricated and tested.', resolvedAt: '2026-07-06' },
  ])
  console.log('Created maintenance requests')

  await Announcement.insertMany([
    { title: 'Water shutoff scheduled for Aug 6', body: 'Water will be shut off plaza-wide from 9am to 1pm for routine maintenance.', important: true, audience: 'all', audienceTenantIds: [], author: 'Admin' },
    { title: 'Reminder: rent due Aug 1', body: 'This is a friendly reminder that rent is due on the 1st of the month.', important: false, audience: 'all', audienceTenantIds: [], author: 'Admin' },
    { title: 'Elevator maintenance in B block', body: 'The elevator serving B block will be out of service Aug 3\u20134.', important: true, audience: 'selected', audienceTenantIds: [wade._id, esther._id], author: 'Admin' },
  ])
  console.log('Created announcements')

  await Reminder.insertMany([
    { title: 'Rent due reminder', message: 'Your rent payment is due in 3 days.', type: 'automatic', target: 'everyone', targetLabel: 'All tenants', scheduledFor: '2026-07-29', status: 'sent' },
    { title: 'Lease renewal approaching', message: 'Your lease renews in 30 days \u2014 contact the office with questions.', type: 'automatic', target: 'tenant', targetTenantIds: [wade._id], targetLabel: 'Wade Warren', scheduledFor: '2026-08-01', status: 'scheduled' },
    { title: 'Overdue rent follow-up', message: 'Your rent payment is overdue, please settle it as soon as possible.', type: 'manual', target: 'tenant', targetTenantIds: [wade._id], targetLabel: 'Wade Warren', scheduledFor: '2026-07-20', status: 'sent' },
    { title: 'B block elevator outage', message: 'Reminder: the elevator will be out of service Aug 3\u20134.', type: 'manual', target: 'group', targetTenantIds: [wade._id, esther._id], targetLabel: 'Wade Warren, Esther Howard', scheduledFor: '2026-08-02', status: 'scheduled' },
    { title: 'Payment gateway maintenance', message: 'The payment gateway will be briefly unavailable tonight.', type: 'manual', target: 'everyone', targetLabel: 'All tenants', scheduledFor: '2026-07-18', status: 'failed' },
  ])
  console.log('Created reminders')

  // No standalone CalendarEvent docs seeded: rent-due/lease-renewal/reminder
  // dates are derived from RentCharge/Lease/Reminder at read time by
  // GET /tenant/calendar (see BACKEND_BUILD_PLAN.md §1) rather than duplicated
  // here — CalendarEvent is reserved for genuinely standalone events only.

  await Notification.insertMany([
    { audience: 'tenant', recipientId: jane._id, type: 'payment', title: 'Payment received', body: 'Your payment was processed.', date: '2026-07-01', read: false },
    { audience: 'tenant', recipientId: wade._id, type: 'maintenance', title: 'Request update', body: 'Technician scheduled.', date: '2026-07-12', read: true },
    { audience: 'admin', recipientId: null, type: 'payment', title: 'Payment received from Jane Cooper', body: '$1,200 paid via gateway.', date: '2026-07-01', read: false },
    { audience: 'admin', recipientId: null, type: 'maintenance', title: 'New maintenance request', body: 'Wade Warren reported: AC not cooling.', date: '2026-07-25', read: false },
    { audience: 'admin', recipientId: null, type: 'reminder', title: 'Reminder sent', body: 'Rent due reminder sent to all tenants.', date: '2026-07-29', read: true },
  ])
  console.log('Created notifications')

  console.log('\nSeed complete. Sample logins:')
  console.log(`  ${admin.email} (bootstrapped separately via npm run bootstrap:admin)`)
  console.log(`  jane.cooper@example.com / ${tenantPassword}`)

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
