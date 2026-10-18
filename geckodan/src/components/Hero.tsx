import Image from 'next/image'
import Link from 'next/link'
import { mediaUrl } from '@/lib/media'
import type { HeroSettings, SiteSettings } from '@/lib/types'
import conceptImage from '../../public/hero/concept-gecko.jpg'
import { ArrowIcon, PinIcon } from './Icons'
import { SocialIconRow } from './SocialLinks'

function splitHeadline(headline: string): [string, string] {
  // "A Decade of Passion." becomes two balanced lines, as in the approved concept.
  const words = headline.trim().split(/\s+/)
  if (words.length < 3) return [headline, '']
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

export function Hero({ settings }: { settings: SiteSettings }) {
  const hero: HeroSettings = settings.hero
  const uploaded = mediaUrl(hero.image_path)
  const [line1, line2] = splitHeadline(hero.headline)
  const isConcept = !uploaded || hero.image_is_concept
  const alt = uploaded
    ? hero.image_alt || 'Leopard gecko among tropical foliage'
    : 'Concept illustration: an orange leopard gecko on a mossy rock in a tropical forest'

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__media">
        {uploaded ? (
          <Image src={uploaded} alt={alt} fill preload sizes="(max-width: 900px) 100vw, 72vw" style={{ objectFit: 'cover' }} />
        ) : (
          <Image src={conceptImage} alt={alt} fill preload placeholder="blur" sizes="(max-width: 900px) 100vw, 72vw" style={{ objectFit: 'cover', objectPosition: 'var(--hero-pos, 40% 50%)' }} />
        )}
      </div>
      <div className="wrap hero__inner">
        <div className="hero__copy">
          <p className="eyebrow" /* taste-skill-ignore: shown in the approved hero reference */>{hero.eyebrow}</p>
          <h1 id="hero-title" className="display">
            {line1}
            {line2 ? (
              <>
                <br />
                {line2}
              </>
            ) : null}
          </h1>
          {hero.tagline ? <p className="tagline">{hero.tagline}</p> : null}
          {hero.body ? <p className="hero__body">{hero.body}</p> : null}
          <Link className="btn btn-primary" href={hero.cta_href || '/geckos'}>
            {hero.cta_label} <ArrowIcon />
          </Link>
        </div>
        <div className="hero__foot">
          <div className="socials-wrap" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <SocialIconRow socials={settings.socials} />
            <span className="socials__label">Follow our journey</span>
          </div>
          <p className="hero__place">
            <PinIcon /> Pamulang, South Tangerang
          </p>
        </div>
      </div>
      {isConcept ? (
        <p className="hero__caption">Concept illustration, not a photograph of a GeckoDan animal.</p>
      ) : null}
    </section>
  )
}
