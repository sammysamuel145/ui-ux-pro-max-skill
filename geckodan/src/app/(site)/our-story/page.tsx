import type { Metadata } from 'next'
import Image from 'next/image'
import { PendingContent } from '@/components/Notices'
import { getSettings } from '@/lib/data/public'
import { paragraphs } from '@/lib/text'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'Cerita GeckoDan: sekitar sepuluh tahun di dunia gecko, dari Pamulang, Tangerang Selatan.',
  alternates: { canonical: '/our-story' },
}

export default async function StoryPage() {
  const settings = await getSettings()
  const body = paragraphs(settings.story.body)
  return (
    <section className="letter-band" aria-labelledby="story-title" style={{ paddingTop: 'clamp(48px, 8vw, 112px)' }}>
      <article className="letter reveal">
        <Image className="letter__logo" src="/brand/geckodan-logo-256.png" alt="" width={256} height={242} />
        <h1 id="story-title" className="headline" style={{ marginTop: 24, textTransform: 'uppercase' }}>
          {settings.story.title || 'Our Story'}
        </h1>
        <p className="tagline soft" style={{ marginTop: 12 }}>
          A Decade of Passion.
        </p>
        <div className="prose">
          {body.length ? (
            body.map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <PendingContent>
              Cerita perjalanan GeckoDan akan ditulis oleh pemilik: bagaimana semuanya dimulai, sekitar sepuluh tahun di dunia gecko, dan
              apa yang dicari di setiap generasi.
            </PendingContent>
          )}
        </div>
        {settings.story.signature ? <p className="letter__sign">{settings.story.signature}</p> : null}
      </article>
    </section>
  )
}
