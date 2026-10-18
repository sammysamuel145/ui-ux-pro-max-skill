'use client'

import { multiInquiryMessage, whatsappLink } from '@/lib/whatsapp'
import { useInquiry } from './InquiryProvider'

export function InquiryBar() {
  const { items, clear, whatsappNumber } = useInquiry()
  if (items.length === 0) return null
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const message = multiInquiryMessage(
    items.map((i) => ({ name: i.name, code: i.code, url: `${origin}/geckos/${i.slug}` })),
  )
  return (
    <aside className="inquiry-bar on-night" aria-label="Daftar tanya">
      <p aria-live="polite">
        <strong>{items.length} gecko</strong> di daftar tanya Anda. Ketersediaan dipastikan oleh GeckoDan lewat WhatsApp.
      </p>
      <a className="btn btn-primary" href={whatsappLink(whatsappNumber, message)} target="_blank" rel="noopener noreferrer">
        Tanya via WhatsApp
      </a>
      <button type="button" className="btn btn-quiet" onClick={clear}>
        Kosongkan
      </button>
    </aside>
  )
}
