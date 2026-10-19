import { describe, expect, it } from 'vitest'
import { excerpt, formatDate, paragraphs, slugify } from './text'

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
})
