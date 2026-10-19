import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { AdminImage } from '@/components/admin/AdminImage'
import { PhotoUploader } from '@/components/admin/PhotoUploader'
import { requireAdmin } from '@/lib/admin'
import { mediaUrl } from '@/lib/media'
import type { SignatureLine } from '@/lib/types'
import { attachLineCover, deleteLine, removeLineCover, saveLine } from '../../content-actions'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EditLinePage({ params, searchParams }: Props) {
  const { id } = await params
  const created = (await searchParams).created === '1'
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('signature_lines').select('*').eq('id', id).maybeSingle()
  const line = data as SignatureLine | null
  if (!line) notFound()
  const cover = mediaUrl(line.cover_photo_path)

  return (
    <div className="admin-stack">
      <p>
        <Link className="text-link" href="/admin/dashboard/lines">
          Semua line
        </Link>
      </p>
      <header className="admin-head">
        <div>
          <h1 className="headline">Line {line.name}</h1>
          <p className="soft">
            Alamat halaman: /lines/{line.slug} (tetap) · {line.published ? 'Tayang di situs' : 'Draft, belum tayang'}
          </p>
        </div>
        <Link className="btn btn-quiet" href={`/lines/${line.slug}`} target="_blank">
          Lihat halaman publik
        </Link>
      </header>

      {created ? <p className="flash flash--ok">Line dibuat sebagai draft. Isi cerita dan foto sampul, lalu centang Tayang.</p> : null}

      <section className="admin-section" aria-labelledby="cover-title">
        <h2 id="cover-title">Foto sampul</h2>
        {cover ? (
          <div className="photo-card" style={{ maxWidth: 320 }}>
            <AdminImage src={cover} alt={line.cover_photo_alt ?? ''} />
            <ActionForm action={removeLineCover.bind(null, line.id)} confirm="Hapus foto sampul line ini?" label="Hapus sampul">
              <SubmitButton small variant="btn-quiet">
                Hapus sampul
              </SubmitButton>
            </ActionForm>
          </div>
        ) : (
          <p className="soft">Belum ada foto sampul. Situs menampilkan pelat logo sampai foto asli diunggah.</p>
        )}
        <PhotoUploader folder={`lines/${line.id}`} attach={attachLineCover.bind(null, line.id)} multiple={false} label="Ganti foto sampul" />
      </section>

      <section className="admin-section" aria-labelledby="text-title">
        <h2 id="text-title">Isi</h2>
        <ActionForm action={saveLine.bind(null, line.id)} className="admin-form" label={`Ubah line ${line.name}`}>
          <fieldset>
            <legend>Cerita line</legend>
            <div className="field">
              <label htmlFor="tagline">Tagline</label>
              <input id="tagline" name="tagline" maxLength={200} defaultValue={line.tagline ?? ''} />
            </div>
            <div className="field">
              <label htmlFor="description">Deskripsi</label>
              <textarea id="description" name="description" rows={8} maxLength={8000} defaultValue={line.description ?? ''} />
              <p className="hint">Pisahkan paragraf dengan baris kosong.</p>
            </div>
            <div className="field">
              <label htmlFor="cover_photo_alt">Deskripsi foto sampul</label>
              <input id="cover_photo_alt" name="cover_photo_alt" maxLength={300} defaultValue={line.cover_photo_alt ?? ''} />
            </div>
            <label className="check">
              <input type="checkbox" name="published" defaultChecked={line.published} />
              Tampilkan halaman line di situs
            </label>
          </fieldset>
          <fieldset>
            <legend>SEO</legend>
            <div className="field">
              <label htmlFor="seo_title">Judul halaman</label>
              <input id="seo_title" name="seo_title" maxLength={120} defaultValue={line.seo_title ?? ''} />
            </div>
            <div className="field">
              <label htmlFor="seo_description">Deskripsi halaman</label>
              <textarea id="seo_description" name="seo_description" rows={2} maxLength={300} defaultValue={line.seo_description ?? ''} />
            </div>
          </fieldset>
          <div>
            <SubmitButton variant="btn-primary">Simpan line</SubmitButton>
          </div>
        </ActionForm>
      </section>

      <section className="admin-section" aria-labelledby="line-danger-title">
        <h2 id="line-danger-title">Hapus line</h2>
        <p className="soft">
          Untuk menyembunyikan line tanpa menghapusnya, matikan Tayang di atas. Hapus permanen hanya bisa kalau belum ada gecko
          di line ini.
        </p>
        <ActionForm action={deleteLine.bind(null, line.id)} confirm={`Hapus line ${line.name} secara permanen?`} label="Hapus line">
          <SubmitButton variant="btn-quiet">Hapus line</SubmitButton>
        </ActionForm>
      </section>
    </div>
  )
}
