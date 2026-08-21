import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/tenant/announcements/route'
import { signToken } from '@/lib/jwt'
import { Announcement } from '@/models/Announcement'

vi.mock('@/lib/db', () => ({ dbConnect: vi.fn() }))
vi.mock('@/models/Announcement', () => ({ Announcement: { find: vi.fn(), countDocuments: vi.fn() } }))

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

function tenantRequest(sub = 'tenant-1') {
  const token = signToken({ sub, role: 'tenant' })
  return new NextRequest('http://localhost/api/tenant/announcements', { headers: { authorization: `Bearer ${token}` } })
}

describe('GET /tenant/announcements', () => {
  beforeEach(() => vi.clearAllMocks())

  it('filters to audience:all OR (selected AND this tenant included)', async () => {
    const query = mockQuery([])
    vi.mocked(Announcement.find).mockReturnValue(query as never)
    vi.mocked(Announcement.countDocuments).mockResolvedValue(0 as never)

    await GET(tenantRequest('tenant-1'), undefined as never)

    expect(Announcement.find).toHaveBeenCalledWith({
      $or: [{ audience: 'all' }, { audience: 'selected', audienceTenantIds: 'tenant-1' }],
    })
  })

  it('returns the mapped, paginated announcement list', async () => {
    const doc = { _id: 'ann-1', title: 'Notice', body: 'Body', important: true, createdAt: new Date('2026-08-01') }
    vi.mocked(Announcement.find).mockReturnValue(mockQuery([doc]) as never)
    vi.mocked(Announcement.countDocuments).mockResolvedValue(1 as never)

    const response = await GET(tenantRequest(), undefined as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data[0]).toMatchObject({ id: 'ann-1', title: 'Notice', important: true })
  })

  it('rejects an admin-role token with 403', async () => {
    const token = signToken({ sub: 'admin-1', role: 'admin' })
    const response = await GET(
      new NextRequest('http://localhost/api/tenant/announcements', { headers: { authorization: `Bearer ${token}` } }),
      undefined as never,
    )
    expect(response.status).toBe(403)
  })
})
