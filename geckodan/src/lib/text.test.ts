import { describe, expect, it } from 'vitest'
import { excerpt, formatDate, formatRupiah, paragraphs, slugify } from './text'

describe('text helpers', () => {
  it('splits paragraphs on blank lines only', () => {
    expect(paragraphs('Satu\nbaris\n\nDua\r\n\r\n\nTiga')).toEqual(['Satu\nbaris', 'Dua', 'Tiga'])
    expect(paragraphs(null)).toEqual([])
  })
  it('makes URL-safe slugs', () => {
    expect(slugify('Ember Ráptor #7')).toBe('ember-raptor-7')
  })
  it('shortens long text on a word boundary', () => {
    const e = excerpt('kata '.repeat(100), 40)
    expect(e.length).toBeLessThanOrEqual(41)
    expect(e.endsWith('…')).toBe(true)
  })
  it('formats dates in English (en-GB) without timezone drift', () => {
    expect(formatDate('2024-03-01')).toBe('1 March 2024')
    expect(formatDate('nope')).toBeNull()
  })

  it('writes rupiah with dots between thousands', () => {
    expect(formatRupiah(1500000)).toBe('Rp 1.500.000')
    expect(formatRupiah(750000)).toBe('Rp 750.000')
    expect(formatRupiah(999)).toBe('Rp 999')
    expect(formatRupiah(12000000000)).toBe('Rp 12.000.000.000')
  })
})
