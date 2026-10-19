// WhatsApp click-to-chat links. No API is involved: the visitor's own WhatsApp
// opens with a prefilled message they can edit before sending.

export type InquiryGecko = { name: string; code: string; url: string }

/** Keeps digits only and converts an Indonesian 08xx number to 628xx. */
export function normalizeWhatsappNumber(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  return digits
}

export function whatsappLink(number: string, message?: string): string {
  const base = `https://wa.me/${normalizeWhatsappNumber(number)}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function geckoInquiryMessage(gecko: InquiryGecko): string {
  return `Hello GeckoDan, I'm interested in the gecko ${gecko.name} (ID: ${gecko.code}). Is it still available? Link: ${gecko.url}`
}

export function multiInquiryMessage(geckos: InquiryGecko[]): string {
  if (geckos.length === 1 && geckos[0]) return geckoInquiryMessage(geckos[0])
  const lines = geckos.map((g, i) => `${i + 1}. ${g.name} (ID: ${g.code}) ${g.url}`)
  return [
    'Hello GeckoDan, I\'m interested in these geckos:',
    ...lines,
    'Are they still available?',
  ].join('\n')
}

export function generalInquiryMessage(): string {
  return 'Hello GeckoDan, I would like to ask about your available geckos.'
}

// ---------------------------------------------------------------------------
// Messages that follow the click: each button says what the visitor was
// looking at, so the seller knows the context before replying.
// ---------------------------------------------------------------------------

export type StockFilters = {
  /** Display name of the selected signature line, such as "MANTRA". */
  line?: string | null
  sex?: string | null
  q?: string | null
}

/** Asking about stock in general, or within the filters the visitor had chosen. */
export function stockInquiryMessage(filters: StockFilters = {}): string {
  const extras: string[] = []
  if (filters.line) extras.push(`I'm interested in the ${filters.line} line.`)
  if (filters.sex === 'male' || filters.sex === 'female') extras.push(`I'm looking for a ${filters.sex}.`)
  if (filters.q) extras.push(`I searched for "${filters.q}".`)
  return ['Hello GeckoDan, which geckos do you currently have available?', ...extras].join(' ')
}

export function lineInquiryMessage(lineName: string, url: string): string {
  return `Hello GeckoDan, I'm interested in geckos from the ${lineName} line. Which ones are available? Link: ${url}`
}

/** For a gecko that cannot be bought right now: a collection piece or a sold one. */
export function similarInquiryMessage(gecko: InquiryGecko, reason: 'collection' | 'sold'): string {
  const where = reason === 'sold' ? 'which is sold' : 'in your collection'
  const lead = reason === 'sold' ? `I saw ${gecko.name} (ID: ${gecko.code}), ${where}.` : `I saw ${gecko.name} (ID: ${gecko.code}) ${where}.`
  return `Hello GeckoDan, ${lead} Do you have a similar gecko available? Link: ${gecko.url}`
}

export function shippingInquiryMessage(): string {
  return 'Hello GeckoDan, I would like to ask about shipping a gecko.'
}

export function faqInquiryMessage(): string {
  return 'Hello GeckoDan, I have a question that I could not find in your FAQ.'
}

/**
 * The message for the WhatsApp buttons in the header and footer, chosen from
 * the page the visitor is on. `origin` is the public site address.
 */
export function pageInquiryMessage(pathname: string, origin: string): string {
  const path = pathname.replace(/\/+$/, '') || '/'
  const url = `${origin}${path}`
  const seg = path.split('/').filter(Boolean)
  if (seg[0] === 'geckos' && seg[1]) return `Hello GeckoDan, I have a question about the gecko on this page. Link: ${url}`
  if (seg[0] === 'geckos') return stockInquiryMessage()
  if (seg[0] === 'lines' && seg[1]) return lineInquiryMessage(seg[1].toUpperCase(), url)
  if (seg[0] === 'showcase') return `Hello GeckoDan, I'm looking at your collection and have a question. Link: ${url}`
  if (seg[0] === 'shipping') return shippingInquiryMessage()
  if (seg[0] === 'faq') return faqInquiryMessage()
  if (seg[0] === 'our-story' || seg[0] === 'achievements' || seg[0] === 'reviews') {
    return `Hello GeckoDan, I read about GeckoDan on your website and have a question. Link: ${url}`
  }
  return generalInquiryMessage()
}
