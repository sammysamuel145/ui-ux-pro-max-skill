import type { Metadata } from 'next'
import { ErrorNotice, PendingContent, UnconfiguredNotice } from '@/components/Notices'
import { PageHead } from '@/components/PageHead'
import { listAwards } from '@/lib/data/public'
import { mediaUrl } from '@/lib/media'
import { paragraphs } from '@/lib/text'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Achievements',
  description: 'Prestasi kompetisi GeckoDan yang sudah diverifikasi, lengkap dengan buktinya.',
  alternates: { canonical: '/achievements' },
}

export default async function AchievementsPage() {
  const res = await listAwards()
  return (
    <>
      <PageHead title="Achievements" tagline="Hanya prestasi yang sudah diverifikasi.">
        <p className="lead">Setiap prestasi di halaman ini disertai bukti, seperti sertifikat atau pengumuman resmi penyelenggara.</p>
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 'var(--section)' }}>
        {res.state === 'unconfigured' ? (
          <UnconfiguredNotice />
        ) : res.state === 'error' ? (
          <ErrorNotice />
        ) : res.data.length === 0 ? (
          <PendingContent>Prestasi kompetisi akan tampil di sini setelah diverifikasi dan dilengkapi bukti oleh pemilik.</PendingContent>
        ) : (
          <ol className="award-list" style={{ maxWidth: '60ch' }}>
            {res.data.map((a) => {
              const evidence = a.evidence_url || mediaUrl(a.evidence_path)
              return (
                <li key={a.id} style={{ paddingBottom: 28 }}>
                  <strong>{a.title}</strong>
                  <p className="soft">{[a.placement, a.event_name, a.organizer, a.award_year].filter(Boolean).join(' · ')}</p>
                  {paragraphs(a.description).map((p, i) => (
                    <p key={i} style={{ marginTop: 8 }}>
                      {p}
                    </p>
                  ))}
                  {evidence ? (
                    <p style={{ marginTop: 8 }}>
                      <a className="text-link" href={evidence} target="_blank" rel="noopener noreferrer">
                        Lihat bukti
                      </a>
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </>
  )
}
