import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { GeckoForm } from '@/components/admin/GeckoForm'
import { AdminImage } from '@/components/admin/AdminImage'
import { PhotoUploader } from '@/components/admin/PhotoUploader'
import { requireAdmin } from '@/lib/admin'
import { mediaUrl } from '@/lib/media'
import type { Gecko, GeckoPhoto } from '@/lib/types'
import {
  attachPhoto,
  deleteGecko,
  deletePhoto,
  saveGecko,
  setArchived,
  setCoverPhoto,
  updatePhoto,
} from '../actions'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EditGeckoPage({ params, searchParams }: Props) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const { supabase } = await requireAdmin()
  const [geckoRes, photosRes, lines, parents] = await Promise.all([
    supabase.from('geckos').select('*').eq('id', id).maybeSingle(),
    supabase.from('gecko_photos').select('*').eq('gecko_id', id).order('is_cover', { ascending: false }).order('sort_order'),
    supabase.from('signature_lines').select('id, name').order('sort_order'),
    supabase.from('geckos').select('id, name, code, sex').order('name').limit(1000),
  ])
  const gecko = geckoRes.data as Gecko | null
  if (!gecko) notFound()
  const photos = (photosRes.data ?? []) as GeckoPhoto[]
  const created = (await searchParams).created === '1'
  const isPublic = gecko.published && !gecko.archived

  return (
    <div className="admin-stack">
      <p>
        <Link className="text-link" href="/admin/dashboard/geckos">
          Semua gecko
        </Link>
      </p>
      <header className="admin-head">
        <div>
          <h1 className="headline">{gecko.name}</h1>
          <p className="soft">
            ID {gecko.code} · {gecko.archived ? 'Diarsipkan' : gecko.published ? 'Tayang di situs' : 'Draft, belum tayang'}
          </p>
        </div>
        {isPublic ? (
          <Link className="btn btn-quiet" href={`/geckos/${gecko.slug}`} target="_blank">
            Lihat halaman publik
          </Link>
        ) : null}
      </header>
      {created ? <p className="flash flash--ok">Gecko dibuat. Tambahkan foto di bawah, lalu publikasikan.</p> : null}

      <section aria-labelledby="photos-title" className="admin-section">
        <h2 id="photos-title">Foto</h2>
        {photos.length ? (
          <ul className="photo-grid">
            {photos.map((p) => {
              const src = mediaUrl(p.storage_path)
              return (
                <li key={p.id} className="photo-card">
                  {src ? <AdminImage src={src} alt={p.alt} /> : null}
                  {p.is_cover ? <span className="tag">Sampul</span> : null}
                  <ActionForm action={updatePhoto.bind(null, p.id)} className="photo-card__form" label="Ubah foto">
                    <div className="field">
                      <label htmlFor={`alt-${p.id}`}>Deskripsi</label>
                      <input id={`alt-${p.id}`} name="alt" maxLength={300} defaultValue={p.alt} />
                    </div>
                    <div className="field">
                      <label htmlFor={`order-${p.id}`}>Urutan</label>
                      <input id={`order-${p.id}`} name="sort_order" type="number" min={0} max={9999} defaultValue={p.sort_order} />
                    </div>
                    <SubmitButton small>Simpan</SubmitButton>
                  </ActionForm>
                  <div className="inline-actions">
                    {!p.is_cover ? (
                      <ActionForm action={setCoverPhoto.bind(null, gecko.id, p.id)} label="Jadikan sampul">
                        <SubmitButton small variant="btn-quiet">
                          Jadikan sampul
                        </SubmitButton>
                      </ActionForm>
                    ) : null}
                    <ActionForm action={deletePhoto.bind(null, p.id)} confirm="Hapus foto ini secara permanen?" label="Hapus foto">
                      <SubmitButton small variant="btn-quiet">
                        Hapus
                      </SubmitButton>
                    </ActionForm>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="soft">Belum ada foto. Situs menampilkan pelat &ldquo;Foto menyusul&rdquo; sampai foto asli diunggah.</p>
        )}
        <PhotoUploader folder={`geckos/${gecko.id}`} attach={attachPhoto.bind(null, gecko.id)} />
      </section>

      <section aria-labelledby="data-title" className="admin-section">
        <h2 id="data-title">Data gecko</h2>
        <GeckoForm
          action={saveGecko.bind(null, gecko.id)}
          gecko={gecko}
          lines={lines.data ?? []}
          parents={parents.data ?? []}
        />
      </section>

      <section aria-labelledby="danger-title" className="admin-section">
        <h2 id="danger-title">Arsip dan hapus</h2>
        <p className="soft">Arsip menyembunyikan gecko dari situs tanpa menghapus datanya. Hapus bersifat permanen, termasuk semua fotonya.</p>
        <div className="inline-actions">
          <ActionForm action={setArchived.bind(null, gecko.id, !gecko.archived)} label="Arsip">
            <SubmitButton variant="btn-dark">{gecko.archived ? 'Kembalikan dari arsip' : 'Arsipkan'}</SubmitButton>
          </ActionForm>
          <ActionForm
            action={deleteGecko.bind(null, gecko.id)}
            confirm={`Hapus ${gecko.name} dan semua fotonya secara permanen?`}
            label="Hapus gecko"
          >
            <SubmitButton variant="btn-quiet">Hapus permanen</SubmitButton>
          </ActionForm>
        </div>
      </section>
    </div>
  )
}
