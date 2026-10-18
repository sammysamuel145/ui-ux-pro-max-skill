/** Splits owner-written plain text into paragraphs on blank lines. */
export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return []
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function excerpt(text: string | null | undefined, max = 180): string {
  const flat = (text ?? '').replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).trimEnd()}…`
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : dateFmt.format(d)
}
