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

import {
  faqInquiryMessage,
  generalInquiryMessage,
  lineInquiryMessage,
  pageInquiryMessage,
  shippingInquiryMessage,
  similarInquiryMessage,
  stockInquiryMessage,
} from './whatsapp'

describe('context messages', () => {
  const gecko = { name: 'Ember', code: 'GD-0007', url: 'https://geckodan.example/geckos/ember' }
  const site = 'https://geckodan.example'

  it('stock: general, then narrowed by the filters the visitor chose', () => {
    expect(stockInquiryMessage()).toBe('Hello GeckoDan, which geckos do you currently have available?')
    const m = stockInquiryMessage({ line: 'MANTRA', sex: 'female', q: 'tang' })
    expect(m).toContain('MANTRA line')
    expect(m).toContain('looking for a female')
    expect(m).toContain('"tang"')
    expect(stockInquiryMessage({ sex: 'unknown' })).not.toContain('looking for')
  })

  it('line: names the line and carries its page link', () => {
    const m = lineInquiryMessage('KAFKA', 'https://geckodan.example/lines/kafka')
    expect(m).toContain('KAFKA line')
    expect(m).toContain('https://geckodan.example/lines/kafka')
  })

  it('similar: says whether the gecko is in the collection or sold, with name, ID and link', () => {
    const c = similarInquiryMessage(gecko, 'collection')
    expect(c).toContain('Ember (ID: GD-0007) in your collection')
    expect(c).toContain(gecko.url)
    const s = similarInquiryMessage(gecko, 'sold')
    expect(s).toContain('which is sold')
    expect(s).not.toContain('collection')
  })

  it('page messages follow the page the visitor is on', () => {
    expect(pageInquiryMessage('/', site)).toBe(generalInquiryMessage())
    expect(pageInquiryMessage('/contact', site)).toBe(generalInquiryMessage())
    expect(pageInquiryMessage('/geckos', site)).toBe(stockInquiryMessage())
    expect(pageInquiryMessage('/geckos/ember', site)).toContain(`${site}/geckos/ember`)
    expect(pageInquiryMessage('/lines/mantra', site)).toContain('MANTRA line')
    expect(pageInquiryMessage('/lines/mantra/', site)).toContain(`${site}/lines/mantra`)
    expect(pageInquiryMessage('/shipping', site)).toBe(shippingInquiryMessage())
    expect(pageInquiryMessage('/faq', site)).toBe(faqInquiryMessage())
    expect(pageInquiryMessage('/showcase', site)).toContain('your collection')
    expect(pageInquiryMessage('/our-story', site)).toContain('read about GeckoDan')
  })

  it('every context produces a different message', () => {
    const all = ['/', '/geckos', '/geckos/x', '/lines/kafka', '/showcase', '/shipping', '/faq', '/our-story'].map((p) => pageInquiryMessage(p, site))
    expect(new Set(all).size).toBe(all.length)
  })
})
