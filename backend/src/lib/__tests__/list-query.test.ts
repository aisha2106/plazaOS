import { describe, it, expect } from 'vitest'
import { paginate, parsePageParams, escapeRegex } from '@/lib/list-query'

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1)

  it('slices the sorted array to the requested page/pageSize and reports the true total', () => {
    const result = paginate(items, 2, 10)
    expect(result).toEqual({ data: Array.from({ length: 10 }, (_, i) => i + 11), total: 25, page: 2, pageSize: 10 })
  })

  it('returns an empty page past the end of the data without erroring', () => {
    const result = paginate(items, 10, 10)
    expect(result.data).toEqual([])
    expect(result.total).toBe(25)
  })

  it('returns everything on one page when pageSize exceeds the total count', () => {
    const result = paginate(items, 1, 100)
    expect(result.data).toHaveLength(25)
  })
})

describe('parsePageParams', () => {
  it('defaults to page 1 / pageSize 20 when absent', () => {
    expect(parsePageParams(new URLSearchParams())).toEqual({ page: 1, pageSize: 20 })
  })

  it('parses valid page/pageSize values from the query string', () => {
    expect(parsePageParams(new URLSearchParams('page=3&pageSize=50'))).toEqual({ page: 3, pageSize: 50 })
  })

  it('clamps page below 1 up to 1', () => {
    expect(parsePageParams(new URLSearchParams('page=0'))).toEqual({ page: 1, pageSize: 20 })
    expect(parsePageParams(new URLSearchParams('page=-5'))).toEqual({ page: 1, pageSize: 20 })
  })

  it('clamps an out-of-range pageSize up to 200', () => {
    expect(parsePageParams(new URLSearchParams('pageSize=9999'))).toEqual({ page: 1, pageSize: 200 })
  })

  it('treats pageSize=0 as falsy and falls back to the default of 20', () => {
    expect(parsePageParams(new URLSearchParams('pageSize=0'))).toEqual({ page: 1, pageSize: 20 })
  })

  it('falls back to defaults for non-numeric input rather than NaN', () => {
    expect(parsePageParams(new URLSearchParams('page=abc&pageSize=xyz'))).toEqual({ page: 1, pageSize: 20 })
  })
})

describe('escapeRegex', () => {
  it('escapes every regex-special character so it is treated literally', () => {
    expect(escapeRegex('a.b*c?d')).toBe('a\\.b\\*c\\?d')
    expect(escapeRegex('$100 (rent)')).toBe('\\$100 \\(rent\\)')
  })

  it('leaves plain alphanumeric search text untouched', () => {
    expect(escapeRegex('Jane Cooper 101')).toBe('Jane Cooper 101')
  })
})
