import type { SocialSettings } from '@/lib/types'
import { BrandIcon, type BrandIconName } from './Icons'

type Platform = { key: keyof SocialSettings; label: string; icon: BrandIconName | null }

export const PLATFORMS: Platform[] = [
  { key: 'facebook', label: 'Facebook', icon: 'facebook' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram' },
  { key: 'tiktok', label: 'TikTok', icon: 'tiktok' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube' },
  { key: 'tokopedia', label: 'Tokopedia', icon: null },
]

/** Only platforms with a configured https URL are rendered: no dead links. */
export function activePlatforms(socials: SocialSettings) {
  return PLATFORMS.filter((p) => /^https:\/\//.test(socials[p.key] ?? ''))
}

export function SocialIconRow({ socials }: { socials: SocialSettings }) {
  return (
    <ul className="socials">
      {activePlatforms(socials).map((p) => (
        <li key={p.key}>
          <a
            href={socials[p.key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`GeckoDan on ${p.label} (opens in a new tab)`}
          >
            {p.icon ? <BrandIcon name={p.icon} /> : <span>{p.label}</span>}
          </a>
        </li>
      ))}
    </ul>
  )
}
