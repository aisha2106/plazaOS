import { describe, expect, it } from 'vitest'
import { getAvailableFloors, getUnit, getUnits } from './data'

describe('getUnits', () => {
  it('returns all units with default params', async () => {
    const result = await getUnits()

    expect(result.total).toBe(8)
    expect(result.data).toHaveLength(8)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it('filters by search, case-insensitively', async () => {
    const result = await getUnits({ search: 'a-10' })

    expect(result.data.map((unit) => unit.unitNumber)).toEqual(['A-101', 'A-102'])
    expect(result.total).toBe(2)
  })

  it('filters by status', async () => {
    const result = await getUnits({ status: 'vacant' })

    expect(result.data).toHaveLength(1)
    expect(result.data[0].unitNumber).toBe('C-302')
  })

  it('filters by floor', async () => {
    const result = await getUnits({ floor: '2' })

    expect(result.data.map((unit) => unit.unitNumber)).toEqual(['B-201', 'B-202', 'B-204'])
  })

  it('combines multiple filters', async () => {
    const result = await getUnits({ floor: '2', status: 'occupied' })

    expect(result.data.map((unit) => unit.unitNumber)).toEqual(['B-201', 'B-204'])
  })

  it('sorts by monthlyRent ascending by default direction', async () => {
    const result = await getUnits({ sortBy: 'monthlyRent', sortDir: 'asc' })

    const rents = result.data.map((unit) => unit.monthlyRent)
    expect(rents).toEqual([...rents].sort((a, b) => a - b))
  })

  it('sorts descending when requested', async () => {
    const result = await getUnits({ sortBy: 'monthlyRent', sortDir: 'desc' })

    const rents = result.data.map((unit) => unit.monthlyRent)
    expect(rents).toEqual([...rents].sort((a, b) => b - a))
  })

  it('paginates the filtered results', async () => {
    const page1 = await getUnits({ sortBy: 'unitNumber', sortDir: 'asc', page: 1, pageSize: 3 })
    const page2 = await getUnits({ sortBy: 'unitNumber', sortDir: 'asc', page: 2, pageSize: 3 })

    expect(page1.data).toHaveLength(3)
    expect(page2.data).toHaveLength(3)
    expect(page1.total).toBe(8)
    expect(page2.total).toBe(8)
    expect(page1.data[0].unitNumber).not.toBe(page2.data[0].unitNumber)
  })
})

describe('getAvailableFloors', () => {
  it('returns distinct floors sorted numerically', async () => {
    expect(await getAvailableFloors()).toEqual(['1', '2', '3'])
  })
})

describe('getUnit', () => {
  it('returns the matching unit', async () => {
    expect((await getUnit('unit-3'))?.unitNumber).toBe('B-201')
  })

  it('returns undefined for an unknown id', async () => {
    expect(await getUnit('does-not-exist')).toBeUndefined()
  })
})

