/**
 * Formats a WhatsApp number for display as "+62 851-7441-3278".
 * Accepts international digits (6285174413278) or a local number (085174413278).
 */
export function formatWhatsappDisplay(input: string): string {
  const digits = input.replace(/\D/g, '')
  const intl = digits.startsWith('0') ? `62${digits.slice(1)}` : digits
  if (!intl.startsWith('62') || intl.length < 10) return input.trim()
  const rest = intl.slice(2)
  return `+62 ${[rest.slice(0, 3), rest.slice(3, 7), rest.slice(7)].filter(Boolean).join('-')}`
}
