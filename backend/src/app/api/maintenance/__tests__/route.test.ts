import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/maintenance/route'
import { signToken } from '@/lib/jwt'
import { MaintenanceRequest } from '@/models/MaintenanceRequest'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/MaintenanceRequest', () => ({
  MaintenanceRequest: { find: vi.fn(), countDocuments: vi.fn() },
}))

function adminGet(url: string) {
  const token = signToken({ sub: 'admin-1', role: 'admin' })
  return new NextRequest(url, { headers: { authorization: `Bearer ${token}` } })
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

const sampleDoc = {
  _id: 'req-1',
  tenantId: 'tenant-1',
  tenantName: 'Jane Cooper',
  unitId: 'unit-1',
  unitNumber: 'A-101',
  title: 'Leaky faucet',
  description: 'Kitchen sink drips',
  status: 'open',
  priority: 'medium',
  images: [{ url: 'https://example.com/a.jpg' }],
  notes: '',
  createdAt: new Date('2026-08-01'),
  resolvedAt: null,
}

describe('GET /maintenance (admin)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a paginated admin-wide list', async () => {
    vi.mocked(MaintenanceRequest.find).mockReturnValue(mockQuery([sampleDoc]) as never)
    vi.mocked(MaintenanceRequest.countDocuments).mockResolvedValue(1 as never)

    const response = await GET(adminGet('http://localhost/api/maintenance'), undefined as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.total).toBe(1)
    expect(json.data[0]).toMatchObject({ id: 'req-1', tenantName: 'Jane Cooper', images: ['https://example.com/a.jpg'] })
  })

  it('rejects an unrecognized sortBy with 400', async () => {
    const response = await GET(adminGet('http://localhost/api/maintenance?sortBy=notAField'), undefined as never)
    expect(response.status).toBe(400)
  })

  it('filters by status and priority', async () => {
    const query = mockQuery([])
    vi.mocked(MaintenanceRequest.find).mockReturnValue(query as never)
    vi.mocked(MaintenanceRequest.countDocuments).mockResolvedValue(0 as never)

    await GET(adminGet('http://localhost/api/maintenance?status=open&priority=high'), undefined as never)

    expect(MaintenanceRequest.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'open', priority: 'high' }))
  })

  it('searches by title or tenantName via a case-insensitive regex', async () => {
    const query = mockQuery([])
    vi.mocked(MaintenanceRequest.find).mockReturnValue(query as never)
    vi.mocked(MaintenanceRequest.countDocuments).mockResolvedValue(0 as never)

    await GET(adminGet('http://localhost/api/maintenance?search=leak'), undefined as never)

    const filterArg = vi.mocked(MaintenanceRequest.find).mock.calls[0][0] as unknown as { $or: unknown[] }
    expect(filterArg.$or).toHaveLength(2)
  })

  it('rejects a tenant-role token with 403', async () => {
    const token = signToken({ sub: 'tenant-1', role: 'tenant' })
    const response = await GET(new NextRequest('http://localhost/api/maintenance', { headers: { authorization: `Bearer ${token}` } }), undefined as never)
    expect(response.status).toBe(403)
  })
})
