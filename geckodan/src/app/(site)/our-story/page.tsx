import type { Metadata } from 'next'
import { PendingContent } from '@/components/Notices'
import { PageHead } from '@/components/PageHead'
import { getSettings } from '@/lib/data/public'
import { paragraphs } from '@/lib/text'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'The GeckoDan story: about ten years in the gecko world, from Pamulang, South Tangerang.',
  alternates: { canonical: '/our-story' },
}

export default async function StoryPage() {
  const settings = await getSettings()
  const body = paragraphs(settings.story.body)
  return (
    <>
      <PageHead
        title={settings.story.title || 'Our Story'}
        tagline="A Decade of Passion."
        action={{ label: 'Explore our geckos', href: '/geckos' }}
      />
      <section className="letter-band" aria-label="Story" style={{ paddingTop: 'clamp(16px, 3vw, 40px)' }}>
        <article className="letter reveal">
          <div className="prose">
            {body.length ? (
              body.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <PendingContent>
                The GeckoDan story will be written by the owner: how it all began, about ten years in the gecko world, and
                what is sought in every generation.
              </PendingContent>
            )}
          </div>
          {settings.story.signature ? <p className="letter__sign">{settings.story.signature}</p> : null}
        </article>
      </section>
    </>
  )
}
