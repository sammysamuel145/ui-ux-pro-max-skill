import { describe, expect, it } from 'vitest'
import { hasActiveFilters, parseCatalogFilters, sanitizeQuery, statusesFor } from './catalog'

describe('sanitizeQuery', () => {
  it('removes characters that could change a PostgREST filter', () => {
    expect(sanitizeQuery('Ember,name.eq.x)(%*')).toBe('Ember name eq x')
  })
  it('keeps IDs with hyphens and limits length', () => {
    expect(sanitizeQuery('  GD-0007  ')).toBe('GD-0007')
    expect(sanitizeQuery('a'.repeat(100))).toHaveLength(60)
  })
})

describe('parseCatalogFilters', () => {
  it('uses safe defaults for missing or unknown values', () => {
    expect(parseCatalogFilters({ status: 'deleted', sort: 'price', sex: 'x', line: '../etc' })).toEqual({
      q: '',
      line: '',
      status: 'open',
      sex: '',
      sort: 'newest',
    })
  })
  it('accepts valid values and the first of repeated params', () => {
    expect(parseCatalogFilters({ q: ['Sol', 'x'], line: 'MANTRA', status: 'sold', sex: 'female', sort: 'price-high' })).toEqual({
      q: 'Sol',
      line: 'mantra',
      status: 'sold',
      sex: 'female',
      sort: 'price-high',
    })
  })
  it('offers newest, oldest and the two price orders, and nothing else', () => {
    for (const sort of ['newest', 'oldest', 'price-high', 'price-low']) expect(parseCatalogFilters({ sort }).sort).toBe(sort)
    for (const sort of ['name', 'code', 'price', '']) expect(parseCatalogFilters({ sort }).sort).toBe('newest')
  })
})

describe('statusesFor', () => {
  it('hides sold geckos by default', () => {
    expect(statusesFor('open')).toEqual(['available', 'reserved'])
    expect(statusesFor('all')).toContain('sold')
    expect(statusesFor('reserved')).toEqual(['reserved'])
  })
})

describe('hasActiveFilters', () => {
  it('is false for the default view only', () => {
    expect(hasActiveFilters(parseCatalogFilters({}))).toBe(false)
    expect(hasActiveFilters(parseCatalogFilters({ q: 'sol' }))).toBe(true)
    expect(hasActiveFilters(parseCatalogFilters({ sort: 'oldest' }))).toBe(true)
  })
})
