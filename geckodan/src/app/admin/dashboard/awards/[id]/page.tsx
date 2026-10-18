import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { AwardForm } from '@/components/admin/AwardForm'
import { PhotoUploader } from '@/components/admin/PhotoUploader'
import { requireAdmin } from '@/lib/admin'
import { mediaUrl } from '@/lib/media'
import type { Award } from '@/lib/types'
import { deleteAward, saveAward, uploadAwardEvidence } from '../../content-actions'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EditAwardPage({ params, searchParams }: Props) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const { supabase } = await requireAdmin()
  const [awardRes, geckos] = await Promise.all([
    supabase.from('awards').select('*').eq('id', id).maybeSingle(),
    supabase.from('geckos').select('id, name, code').order('name').limit(1000),
  ])
  const award = awardRes.data as Award | null
  if (!award) notFound()
  const evidence = mediaUrl(award.evidence_path)
  const created = (await searchParams).created === '1'

  return (
    <div className="admin-stack">
      <p>
        <Link className="text-link" href="/admin/dashboard/awards">
          Semua prestasi
        </Link>
      </p>
      <h1 className="headline">{award.title}</h1>
      {created ? <p className="flash flash--ok">Prestasi dibuat sebagai draft. Tambahkan bukti, verifikasi, lalu publikasikan.</p> : null}

      <section className="admin-section" aria-labelledby="evidence-title">
        <h2 id="evidence-title">Gambar bukti</h2>
        {evidence ? (
          <div className="photo-card" style={{ maxWidth: 320 }}>
            <a href={evidence} target="_blank" rel="noopener noreferrer">
              <img src={evidence} alt={`Bukti ${award.title}`} />
            </a>
          </div>
        ) : (
          <p className="soft">Belum ada gambar bukti.</p>
        )}
        <PhotoUploader
          action={uploadAwardEvidence.bind(null, award.id)}
          field="evidence"
          multiple={false}
          withAlt={false}
          label={evidence ? 'Ganti gambar bukti' : 'Unggah sertifikat atau foto piala'}
        />
      </section>

      <section className="admin-section" aria-labelledby="award-title">
        <h2 id="award-title">Data prestasi</h2>
        <AwardForm action={saveAward.bind(null, award.id)} award={award} geckos={geckos.data ?? []} />
      </section>

      <section className="admin-section">
        <ActionForm action={deleteAward.bind(null, award.id)} confirm="Hapus prestasi ini secara permanen?" label="Hapus prestasi">
          <SubmitButton variant="btn-quiet">Hapus prestasi</SubmitButton>
        </ActionForm>
      </section>
    </div>
  )
}
