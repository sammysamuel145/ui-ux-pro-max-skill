'use client'

import { useInquiry, type InquiryItem } from './InquiryProvider'

export function InquiryToggle({ gecko }: { gecko: InquiryItem }) {
  const { has, toggle } = useInquiry()
  const selected = has(gecko.id)
  return (
    <button type="button" className="inquiry-toggle" aria-pressed={selected} onClick={() => toggle(gecko)}>
      {selected ? 'Ada di daftar tanya' : 'Tambah ke daftar tanya'}
      <span className="sr-only"> untuk {gecko.name}</span>
    </button>
  )
}
