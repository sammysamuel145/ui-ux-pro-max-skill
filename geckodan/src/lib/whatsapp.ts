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
