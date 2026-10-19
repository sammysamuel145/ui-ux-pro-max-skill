'use client'

import { useInquiry, type InquiryItem } from './InquiryProvider'

export function InquiryToggle({ gecko }: { gecko: InquiryItem }) {
  const { has, toggle } = useInquiry()
  const selected = has(gecko.id)
  return (
    <button type="button" className="inquiry-toggle" aria-pressed={selected} onClick={() => toggle(gecko)}>
      {selected ? 'On your inquiry list' : 'Add to inquiry list'}
      <span className="sr-only"> for {gecko.name}</span>
    </button>
  )
}
