// Seeds MongoDB with data shaped like src/routes/admin/data/mockData.ts in the
// frontend repo, so local dev against this real backend looks identical to
// today's mock-data experience. Run with: npm run seed
import 'dotenv/config'
import mongoose from 'mongoose'
import { dbConnect } from '../src/lib/db'
import { hashPassword } from '../src/lib/password'
import { User } from '../src/models/User'
import { Unit } from '../src/models/Unit'
import { Payment } from '../src/models/Payment'
import { MaintenanceRequest } from '../src/models/MaintenanceRequest'
import { Announcement } from '../src/models/Announcement'
import { Reminder } from '../src/models/Reminder'
import { CalendarEvent } from '../src/models/CalendarEvent'
import { Notification } from '../src/models/Notification'

async function seed() {
  await dbConnect()

  console.log('Clearing existing collections...')
  await Promise.all([
    User.deleteMany({}),
    Unit.deleteMany({}),
    Payment.deleteMany({}),
    MaintenanceRequest.deleteMany({}),
    Announcement.deleteMany({}),
    Reminder.deleteMany({}),
    CalendarEvent.deleteMany({}),
    Notification.deleteMany({}),
  ])

  const adminPasswordHash = await hashPassword('admin123')
  const admin = await User.create({
    name: 'Dev Admin',
    email: 'admin@plaza.test',
    passwordHash: adminPasswordHash,
    role: 'admin',
    accountStatus: 'active',
    mustChangePassword: false,
  })
  console.log('Created admin: admin@plaza.test / admin123')

  const tenantPasswordHash = await hashPassword('tenant123')

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
      leaseStart: def.leaseStart,
      leaseEnd: def.leaseEnd,
      monthlyRent: def.monthlyRent,
      rentStatus: def.rentStatus,
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
  console.log(`Created ${tenants.length} tenants (password: tenant123 for all)`)

  const tenantByEmail = new Map(tenants.map((tenant) => [tenant.email, tenant]))
  const jane = tenantByEmail.get('jane.cooper@example.com')!
  const devon = tenantByEmail.get('devon.lane@example.com')!
  const wade = tenantByEmail.get('wade.warren@example.com')!
  const esther = tenantByEmail.get('esther.howard@example.com')!
  const cameron = tenantByEmail.get('cameron.williamson@example.com')!
  const guy = tenantByEmail.get('guy.hawkins@example.com')!

  await Payment.insertMany([
    { tenantId: jane._id, tenantName: jane.name, unitId: unitByNumber.get('A-101')?._id, unitNumber: 'A-101', amount: 1200, method: 'gateway', status: 'paid', date: '2026-07-01' },
    { tenantId: devon._id, tenantName: devon.name, unitId: unitByNumber.get('A-102')?._id, unitNumber: 'A-102', amount: 1100, method: 'gateway', status: 'pending', date: '2026-07-28' },
    { tenantId: wade._id, tenantName: wade.name, unitId: unitByNumber.get('B-201')?._id, unitNumber: 'B-201', amount: 1600, method: 'bank_transfer', status: 'failed', date: '2026-07-15', note: 'Bank declined the transfer, tenant notified.', recordedBy: admin._id },
    { tenantId: esther._id, tenantName: esther.name, unitId: unitByNumber.get('B-204')?._id, unitNumber: 'B-204', amount: 1600, method: 'gateway', status: 'paid', date: '2026-07-02' },
    { tenantId: cameron._id, tenantName: cameron.name, unitId: unitByNumber.get('C-301')?._id, unitNumber: 'C-301', amount: 2100, method: 'cash', status: 'paid', date: '2026-07-03', note: 'Paid in person at the office.', recordedBy: admin._id },
    { tenantId: guy._id, tenantName: guy.name, unitId: unitByNumber.get('C-310')?._id, unitNumber: 'C-310', amount: 2150, method: 'check', status: 'pending', date: '2026-07-30', recordedBy: admin._id },
    { tenantId: jane._id, tenantName: jane.name, unitId: unitByNumber.get('A-101')?._id, unitNumber: 'A-101', amount: 1200, method: 'gateway', status: 'paid', date: '2026-06-01' },
    { tenantId: wade._id, tenantName: wade.name, unitId: unitByNumber.get('B-201')?._id, unitNumber: 'B-201', amount: 1600, method: 'gateway', status: 'paid', date: '2026-06-01' },
  ])
  console.log('Created payments')

  await MaintenanceRequest.insertMany([
    { tenantId: jane._id, tenantName: jane.name, unitId: unitByNumber.get('A-101')?._id, unitNumber: 'A-101', title: 'Leaking kitchen faucet', description: 'The faucet has been dripping steadily for two days.', status: 'open', priority: 'medium', images: ['https://placehold.co/640x480?text=Maintenance+Photo'], notes: '' },
    { tenantId: wade._id, tenantName: wade.name, unitId: unitByNumber.get('B-201')?._id, unitNumber: 'B-201', title: 'AC not cooling', description: 'Unit blows warm air, checked filter already.', status: 'in_progress', priority: 'high', images: ['https://placehold.co/640x480?text=Maintenance+Photo'], notes: 'Technician scheduled for Aug 5.' },
    { tenantId: esther._id, tenantName: esther.name, unitId: unitByNumber.get('B-204')?._id, unitNumber: 'B-204', title: 'Broken window latch', description: 'Latch on the west-facing window won\u2019t catch.', status: 'resolved', priority: 'low', images: ['https://placehold.co/640x480?text=Maintenance+Photo'], notes: 'Latch replaced.', resolvedAt: '2026-07-12' },
    { tenantId: cameron._id, tenantName: cameron.name, unitId: unitByNumber.get('C-301')?._id, unitNumber: 'C-301', title: 'Flickering hallway light', description: 'Light outside the unit flickers intermittently.', status: 'open', priority: 'low', images: ['https://placehold.co/640x480?text=Maintenance+Photo'], notes: '' },
    { tenantId: guy._id, tenantName: guy.name, unitId: unitByNumber.get('C-310')?._id, unitNumber: 'C-310', title: 'Clogged drain', description: 'Bathroom sink drains very slowly.', status: 'in_progress', priority: 'medium', images: ['https://placehold.co/640x480?text=Maintenance+Photo'], notes: 'Plumber snaked the drain, monitoring.' },
    { tenantId: devon._id, tenantName: devon.name, unitId: unitByNumber.get('A-102')?._id, unitNumber: 'A-102', title: 'Door lock sticking', description: 'Front door lock is hard to turn, may need lubrication or replacement.', status: 'resolved', priority: 'medium', images: ['https://placehold.co/640x480?text=Maintenance+Photo'], notes: 'Lock lubricated and tested.', resolvedAt: '2026-07-06' },
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

  await CalendarEvent.insertMany([
    { title: 'Wade Warren lease renewal', type: 'lease_renewal', date: '2026-08-31', tenantId: wade._id, relatedLabel: 'B-201' },
    { title: 'Guy Hawkins lease renewal', type: 'lease_renewal', date: '2026-08-01', tenantId: guy._id, relatedLabel: 'C-310' },
    { title: 'Rent due reminder sent', type: 'reminder', date: '2026-07-29', relatedLabel: 'All tenants' },
    { title: 'Elevator outage reminder', type: 'reminder', date: '2026-08-02', tenantId: wade._id, relatedLabel: 'B block' },
    { title: 'Rent due', type: 'rent_due', date: '2026-08-01', relatedLabel: 'All tenants' },
    { title: 'Jane Cooper lease renewal', type: 'lease_renewal', date: '2026-01-31', tenantId: jane._id, relatedLabel: 'A-101' },
  ])
  console.log('Created calendar events')

  await Notification.insertMany([
    { audience: 'tenant', recipientId: jane._id, type: 'payment', title: 'Payment received', body: 'Your payment was processed.', date: '2026-07-01', read: false },
    { audience: 'tenant', recipientId: wade._id, type: 'maintenance', title: 'Request update', body: 'Technician scheduled.', date: '2026-07-12', read: true },
    { audience: 'admin', recipientId: null, type: 'payment', title: 'Payment received from Jane Cooper', body: '$1,200 paid via gateway.', date: '2026-07-01', read: false },
    { audience: 'admin', recipientId: null, type: 'maintenance', title: 'New maintenance request', body: 'Wade Warren reported: AC not cooling.', date: '2026-07-25', read: false },
    { audience: 'admin', recipientId: null, type: 'reminder', title: 'Reminder sent', body: 'Rent due reminder sent to all tenants.', date: '2026-07-29', read: true },
  ])
  console.log('Created notifications')

  console.log('\nSeed complete. Sample logins:')
  console.log('  admin@plaza.test / admin123')
  console.log('  jane.cooper@example.com / tenant123')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
