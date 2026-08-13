import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/units/[id]/route'
import { signToken } from '@/lib/jwt'
import { Unit } from '@/models/Unit'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Unit', () => ({ Unit: { findById: vi.fn() } }))

function adminRequest(body: unknown) {
  const token = signToken({ sub: 'admin-1', role: 'admin' })
  return new NextRequest('http://localhost/api/units/unit-1', {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /units/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects moving an occupied unit to vacant without explicitly clearing the tenant', async () => {
    vi.mocked(Unit.findById).mockResolvedValue({
      _id: 'unit-1',
      status: 'occupied',
      tenantId: 'tenant-1',
      tenantName: 'Jane Cooper',
      save: vi.fn(),
    } as never)

    const response = await PATCH(adminRequest({ status: 'vacant' }), { params: Promise.resolve({ id: 'unit-1' }) })

    expect(response.status).toBe(409)
  })

  it('allows moving to vacant when tenantId is explicitly cleared in the same request', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    vi.mocked(Unit.findById).mockResolvedValue({
      _id: 'unit-1',
      unitNumber: 'A-101',
      floor: '1',
      sizeSqft: 500,
      monthlyRent: 1200,
      status: 'occupied',
      tenantId: 'tenant-1',
      tenantName: 'Jane Cooper',
      save,
    } as never)

    const response = await PATCH(adminRequest({ status: 'vacant', tenantId: null, tenantName: null }), {
      params: Promise.resolve({ id: 'unit-1' }),
    })

    expect(response.status).toBe(200)
    expect(save).toHaveBeenCalledOnce()
  })

  it('allows unrelated field updates while a unit is occupied', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    vi.mocked(Unit.findById).mockResolvedValue({
      _id: 'unit-1',
      unitNumber: 'A-101',
      floor: '1',
      sizeSqft: 500,
      monthlyRent: 1200,
      status: 'occupied',
      tenantId: 'tenant-1',
      tenantName: 'Jane Cooper',
      save,
    } as never)

    const response = await PATCH(adminRequest({ monthlyRent: 1300 }), { params: Promise.resolve({ id: 'unit-1' }) })

    expect(response.status).toBe(200)
  })
})
