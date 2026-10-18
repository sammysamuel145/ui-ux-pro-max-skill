import { describe, expect, it } from 'vitest'
import {
  geckoInquiryMessage,
  multiInquiryMessage,
  normalizeWhatsappNumber,
  whatsappLink,
} from './whatsapp'

describe('normalizeWhatsappNumber', () => {
  it('converts the local business number to international format', () => {
    expect(normalizeWhatsappNumber('085174413278')).toBe('6285174413278')
  })
  it('keeps an international number and strips formatting', () => {
    expect(normalizeWhatsappNumber('+62 851-7441-3278')).toBe('6285174413278')
  })
})

describe('whatsappLink', () => {
  it('builds a wa.me link with an encoded message', () => {
    const link = whatsappLink('085174413278', 'Hello & ask: 100%?')
    expect(link).toBe('https://wa.me/6285174413278?text=Hello%20%26%20ask%3A%20100%25%3F')
  })
  it('omits the text parameter without a message', () => {
    expect(whatsappLink('6285174413278')).toBe('https://wa.me/6285174413278')
  })
})

describe('inquiry messages', () => {
  const gecko = { name: 'Ember', code: 'GD-0007', url: 'https://geckodan.example/geckos/ember' }

  it('includes the name, ID and detail URL of one gecko', () => {
    expect(geckoInquiryMessage(gecko)).toBe(
      "Hello GeckoDan, I'm interested in the gecko Ember (ID: GD-0007). Is it still available? Link: https://geckodan.example/geckos/ember",
    )
  })

  it('lists every selected gecko in one message', () => {
    const msg = multiInquiryMessage([gecko, { name: 'Sol', code: 'GD-0010', url: 'https://geckodan.example/geckos/sol' }])
    expect(msg).toContain('1. Ember (ID: GD-0007) https://geckodan.example/geckos/ember')
    expect(msg).toContain('2. Sol (ID: GD-0010) https://geckodan.example/geckos/sol')
    expect(msg.split('\n')).toHaveLength(4)
  })

  it('falls back to the single-gecko wording for a list of one', () => {
    expect(multiInquiryMessage([gecko])).toBe(geckoInquiryMessage(gecko))
  })

  it('round-trips through the link encoding', () => {
    const msg = geckoInquiryMessage(gecko)
    const link = new URL(whatsappLink('085174413278', msg))
    expect(link.searchParams.get('text')).toBe(msg)
  })
})
