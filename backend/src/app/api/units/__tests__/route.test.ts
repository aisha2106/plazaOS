import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/units/route'
import { signToken } from '@/lib/jwt'
import { Unit } from '@/models/Unit'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Unit', () => ({
  Unit: { find: vi.fn(), countDocuments: vi.fn(), findOne: vi.fn(), create: vi.fn() },
}))

function adminGet(url: string) {
  const token = signToken({ sub: 'admin-1', role: 'admin' })
  return new NextRequest(url, { headers: { authorization: `Bearer ${token}` } })
}

function tenantGet(url: string) {
  const token = signToken({ sub: 'tenant-1', role: 'tenant' })
  return new NextRequest(url, { headers: { authorization: `Bearer ${token}` } })
}

function adminPost(body: unknown) {
  const token = signToken({ sub: 'admin-1', role: 'admin' })
  return new NextRequest('http://localhost/api/units', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function mockQuery(docs: unknown[]) {
  const query: { sort: ReturnType<typeof vi.fn>; skip: ReturnType<typeof vi.fn>; limit: ReturnType<typeof vi.fn> } = {
    sort: vi.fn(),
    skip: vi.fn(),
    limit: vi.fn(),
  }
  query.sort.mockReturnValue(query)
  query.skip.mockReturnValue(query)
  query.limit.mockResolvedValue(docs)
  return query
}

describe('GET /units', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a paginated, sorted list', async () => {
    const docs = [{ _id: 'unit-1', unitNumber: 'A-101', floor: '1', sizeSqft: 500, monthlyRent: 1200, status: 'vacant' }]
    vi.mocked(Unit.find).mockReturnValue(mockQuery(docs) as never)
    vi.mocked(Unit.countDocuments).mockResolvedValue(1 as never)

    const response = await GET(adminGet('http://localhost/api/units?page=1&pageSize=10'), undefined as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.total).toBe(1)
    expect(json.page).toBe(1)
    expect(json.pageSize).toBe(10)
    expect(json.data[0]).toMatchObject({ id: 'unit-1', unitNumber: 'A-101' })
  })

  it('rejects an unrecognized sortBy with 400', async () => {
    const response = await GET(adminGet('http://localhost/api/units?sortBy=notAField'), undefined as never)
    expect(response.status).toBe(400)
    expect(Unit.find).not.toHaveBeenCalled()
  })

  it('rejects a tenant-role token with 403', async () => {
    const response = await GET(tenantGet('http://localhost/api/units'), undefined as never)
    expect(response.status).toBe(403)
  })

  it('applies status and floor filters', async () => {
    const query = mockQuery([])
    vi.mocked(Unit.find).mockReturnValue(query as never)
    vi.mocked(Unit.countDocuments).mockResolvedValue(0 as never)

    await GET(adminGet('http://localhost/api/units?status=vacant&floor=2'), undefined as never)

    expect(Unit.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'vacant', floor: '2' }))
  })

  it('ignores "all" as a filter value', async () => {
    const query = mockQuery([])
    vi.mocked(Unit.find).mockReturnValue(query as never)
    vi.mocked(Unit.countDocuments).mockResolvedValue(0 as never)

    await GET(adminGet('http://localhost/api/units?status=all&floor=all'), undefined as never)

    expect(Unit.find).toHaveBeenCalledWith({})
  })
})

describe('POST /units', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a unit, defaulting status to vacant', async () => {
    vi.mocked(Unit.findOne).mockResolvedValue(null as never)
    vi.mocked(Unit.create).mockResolvedValue({ _id: 'unit-1' } as never)

    const response = await POST(adminPost({ unitNumber: 'A-101', floor: '1', sizeSqft: 500, monthlyRent: 1200 }), undefined as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ success: true, id: 'unit-1' })
    expect(Unit.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'vacant' }))
  })

  it('rejects a duplicate unitNumber with 409', async () => {
    vi.mocked(Unit.findOne).mockResolvedValue({ _id: 'existing' } as never)

    const response = await POST(adminPost({ unitNumber: 'A-101', floor: '1', sizeSqft: 500, monthlyRent: 1200 }), undefined as never)

    expect(response.status).toBe(409)
    expect(Unit.create).not.toHaveBeenCalled()
  })

  it('rejects a non-positive monthlyRent/sizeSqft', async () => {
    const response = await POST(adminPost({ unitNumber: 'A-101', floor: '1', sizeSqft: 500, monthlyRent: -100 }), undefined as never)
    expect(response.status).toBe(400)
  })

  it('rejects unknown extra fields (.strict())', async () => {
    const response = await POST(
      adminPost({ unitNumber: 'A-101', floor: '1', sizeSqft: 500, monthlyRent: 1200, extra: 'nope' }),
      undefined as never,
    )
    expect(response.status).toBe(400)
  })

  it('rejects a tenant-role token with 403', async () => {
    const token = signToken({ sub: 'tenant-1', role: 'tenant' })
    const request = new NextRequest('http://localhost/api/units', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ unitNumber: 'A-101', floor: '1', sizeSqft: 500, monthlyRent: 1200 }),
    })

    const response = await POST(request, undefined as never)
    expect(response.status).toBe(403)
  })
})
