import { describe, expect, it } from 'vitest'
import { formatWhatsappDisplay } from './phone'

describe('formatWhatsappDisplay', () => {
  it('formats the GeckoDan number with +62', () => {
    expect(formatWhatsappDisplay('6285174413278')).toBe('+62 851-7441-3278')
  })

  it('accepts local and already formatted input', () => {
    expect(formatWhatsappDisplay('085174413278')).toBe('+62 851-7441-3278')
    expect(formatWhatsappDisplay('+62 851-7441-3278')).toBe('+62 851-7441-3278')
    expect(formatWhatsappDisplay('0851 7441 3278')).toBe('+62 851-7441-3278')
  })

  it('leaves numbers it cannot parse unchanged', () => {
    expect(formatWhatsappDisplay('12345')).toBe('12345')
  })
})
