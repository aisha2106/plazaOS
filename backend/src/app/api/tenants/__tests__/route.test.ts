import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import mongoose from 'mongoose'
import { POST } from '@/app/api/tenants/route'
import { signToken } from '@/lib/jwt'
import { Unit } from '@/models/Unit'
import { User } from '@/models/User'
import { Lease } from '@/models/Lease'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/lib/password', () => ({
  generateTempPassword: vi.fn(() => 'Temp1234'),
  hashPassword: vi.fn(async () => 'hashed-temp1234'),
}))
vi.mock('@/models/Unit', () => ({ Unit: { findById: vi.fn() } }))
vi.mock('@/models/User', () => ({ User: { findOne: vi.fn(), create: vi.fn() } }))
vi.mock('@/models/Lease', () => ({ Lease: { create: vi.fn(), findOne: vi.fn() } }))
vi.mock('@/models/RentCharge', () => ({ RentCharge: { find: vi.fn() } }))
vi.mock('mongoose', () => ({ default: { startSession: vi.fn() } }))

function adminRequest(body: unknown) {
  const token = signToken({ sub: 'admin-1', role: 'admin' })
  return new NextRequest('http://localhost/api/tenants', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  name: 'Jane Cooper',
  email: 'jane.cooper@example.com',
  phone: '+1 (555) 010-1234',
  unitId: 'unit-1',
  leaseStart: '2026-08-01',
  leaseEnd: '2027-07-31',
  monthlyRent: 1200,
}

function mockSessionQuery(resolvedValue: unknown) {
  return vi.fn(() => ({ session: vi.fn().mockResolvedValue(resolvedValue) }))
}

describe('POST /tenants', () => {
  let session: { withTransaction: ReturnType<typeof vi.fn>; endSession: ReturnType<typeof vi.fn>; abortTransaction: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()
    session = {
      withTransaction: vi.fn(async (fn: () => Promise<void>) => fn()),
      endSession: vi.fn(),
      abortTransaction: vi.fn(),
    }
    vi.mocked(mongoose.startSession).mockResolvedValue(session as never)
  })

  it('rejects assigning a tenant to a unit that is not vacant', async () => {
    Unit.findById = mockSessionQuery({ _id: 'unit-1', status: 'occupied', unitNumber: 'A-101' }) as never

    const response = await POST(adminRequest(validBody), undefined as never)

    expect(response.status).toBe(409)
    expect(User.create).not.toHaveBeenCalled()
    expect(session.endSession).toHaveBeenCalledOnce()
  })

  it('rolls back (creates nothing) when the lease step fails mid-transaction', async () => {
    const unitDoc = { _id: 'unit-1', status: 'vacant', unitNumber: 'A-101', save: vi.fn().mockResolvedValue(undefined) }
    Unit.findById = mockSessionQuery(unitDoc) as never
    User.findOne = mockSessionQuery(null) as never
    vi.mocked(User.create).mockResolvedValue([{ _id: 'tenant-1', name: 'Jane Cooper' }] as never)
    vi.mocked(Lease.create).mockRejectedValue(new Error('lease write failed'))

    const response = await POST(adminRequest(validBody), undefined as never)

    // withTransaction's callback threw, so the route's `created` var was
    // never assigned and nothing is reported as successfully created.
    expect(response.status).toBe(500)
    expect(session.endSession).toHaveBeenCalledOnce()
  })

  it('creates the tenant, occupies the unit, and creates a lease atomically on success', async () => {
    const unitDoc = { _id: 'unit-1', status: 'vacant', unitNumber: 'A-101', save: vi.fn().mockResolvedValue(undefined) }
    Unit.findById = mockSessionQuery(unitDoc) as never
    User.findOne = mockSessionQuery(null) as never
    vi.mocked(User.create).mockResolvedValue([{ _id: 'tenant-1', name: 'Jane Cooper' }] as never)
    vi.mocked(Lease.create).mockResolvedValue([{ _id: 'lease-1' }] as never)

    const response = await POST(adminRequest(validBody), undefined as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.tempPassword).toBe('Temp1234')
    expect(unitDoc.status).toBe('occupied')
    expect(unitDoc.save).toHaveBeenCalledOnce()
  })

  it('rejects creating a tenant with an email that already exists', async () => {
    const unitDoc = { _id: 'unit-1', status: 'vacant', unitNumber: 'A-101', save: vi.fn() }
    Unit.findById = mockSessionQuery(unitDoc) as never
    User.findOne = mockSessionQuery({ _id: 'existing-user' }) as never

    const response = await POST(adminRequest(validBody), undefined as never)

    expect(response.status).toBe(409)
    expect(User.create).not.toHaveBeenCalled()
  })
})
