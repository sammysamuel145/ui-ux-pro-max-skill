import { siFacebook, siGooglemaps, siInstagram, siTiktok, siWhatsapp, siYoutube } from 'simple-icons'

const BRAND = {
  facebook: siFacebook,
  instagram: siInstagram,
  tiktok: siTiktok,
  youtube: siYoutube,
  whatsapp: siWhatsapp,
  maps: siGooglemaps,
} as const

export type BrandIconName = keyof typeof BRAND

/** Official brand marks from the simple-icons set. */
export function BrandIcon({ name }: { name: BrandIconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={BRAND[name].path} />
    </svg>
  )
}

export function ArrowIcon() {
  return (
    <svg className="arrow" viewBox="0 0 18 12" aria-hidden="true" focusable="false">
      <path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function PinIcon() {
  return (
    <svg viewBox="0 0 14 18" aria-hidden="true" focusable="false">
      <path
        d="M7 0C3.1 0 0 3.1 0 6.9 0 12 7 18 7 18s7-6 7-11.1C14 3.1 10.9 0 7 0zm0 9.5A2.6 2.6 0 1 1 7 4.3a2.6 2.6 0 0 1 0 5.2z"
        fill="currentColor"
      />
    </svg>
  )
}
