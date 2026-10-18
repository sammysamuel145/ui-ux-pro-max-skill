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

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export type LineIconName = 'leaf' | 'diamond' | 'people' | 'globe' | 'trophy'

const LINE_PATHS: Record<LineIconName, React.ReactNode> = {
  leaf: <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14M5 19c2-5 5-8 9-10" />,
  diamond: <path d="M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l-1.5 5L12 20M15 4l1.5 5L12 20" />,
  people: <path d="M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 11a2.5 2.5 0 100-5M17 14.2c2.3.4 4 2.3 4 4.8" />,
  globe: <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.500-3.500 9c-2.500-2.500-3.500-5.500-3.500-9s1-6.500 3.500-9z" />,
  trophy: <path d="M8 4h8v5a4 4 0 01-8 0zM8 6H4c0 3 1.500 4.500 4 5M16 6h4c0 3-1.500 4.500-4 5M12 13v4M8 20h8M10 17h4" />,
}

export function LineIcon({ name }: { name: LineIconName }) {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" focusable="false" {...STROKE}>
      {LINE_PATHS[name]}
    </svg>
  )
}
