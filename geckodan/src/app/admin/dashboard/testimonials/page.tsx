import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { requireAdmin } from '@/lib/admin'
import type { ActionState } from '@/lib/action-state'
import type { Testimonial } from '@/lib/types'
import { deleteTestimonial, saveTestimonial } from '../content-actions'

const SOURCES: Record<Testimonial['source'], string> = {
  direct: 'Langsung',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  tokopedia: 'Tokopedia',
  other: 'Lainnya',
}

function TestimonialFields({ t, action, reset }: { t?: Testimonial; action: (fd: FormData) => Promise<ActionState>; reset?: boolean }) {
  const p = t?.id ?? 'new'
  return (
    <ActionForm action={action} className="admin-form" resetOnSuccess={reset} label={t ? `Ubah testimoni ${t.author_name}` : 'Testimoni baru'}>
      <fieldset>
        <legend>{t ? t.author_name : 'Testimoni baru'}</legend>
        <div className="row">
          <div className="field">
            <label htmlFor={`author_name-${p}`}>Nama pelanggan</label>
            <input id={`author_name-${p}`} name="author_name" required maxLength={120} defaultValue={t?.author_name} />
          </div>
          <div className="field">
            <label htmlFor={`author_location-${p}`}>Kota</label>
            <input id={`author_location-${p}`} name="author_location" maxLength={120} defaultValue={t?.author_location ?? ''} />
          </div>
        </div>
        <div className="field">
          <label htmlFor={`body-${p}`}>Isi testimoni (sesuai aslinya)</label>
          <textarea id={`body-${p}`} name="body" required rows={4} maxLength={4000} defaultValue={t?.body} />
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor={`source-${p}`}>Sumber</label>
            <select id={`source-${p}`} name="source" defaultValue={t?.source ?? 'whatsapp'}>
              {Object.entries(SOURCES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`sort_order-${p}`}>Urutan</label>
            <input id={`sort_order-${p}`} name="sort_order" type="number" min={0} max={9999} defaultValue={t?.sort_order ?? 0} />
          </div>
        </div>
        <div className="field">
          <label htmlFor={`permission_note-${p}`}>Catatan izin</label>
          <input
            id={`permission_note-${p}`}
            name="permission_note"
            maxLength={500}
            defaultValue={t?.permission_note ?? ''}
            placeholder="Contoh: izin lewat WhatsApp, 12 Okt 2026"
          />
        </div>
        <label className="check">
          <input type="checkbox" name="permission_granted" defaultChecked={t?.permission_granted ?? false} />
          Pelanggan sudah mengizinkan testimoni ini ditampilkan
        </label>
        <label className="check">
          <input type="checkbox" name="published" defaultChecked={t?.published ?? false} />
          Publikasikan
        </label>
      </fieldset>
      <div>
        <SubmitButton variant="btn-primary">{t ? 'Simpan' : 'Tambah testimoni'}</SubmitButton>
      </div>
    </ActionForm>
  )
}

export default async function AdminTestimonialsPage() {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase.from('testimonials').select('*').order('sort_order').order('created_at', { ascending: false })
  const items = (data ?? []) as Testimonial[]
  return (
    <div className="admin-stack">
      <h1 className="headline">Testimoni</h1>
      <p className="soft">
        Masukkan hanya testimoni asli dari pelanggan. Testimoni tayang setelah pelanggan memberi izin. Rating Google tidak disalin
        ke sini: situs menautkan langsung ke Google Reviews.
      </p>
      <section className="admin-section">
        <TestimonialFields action={saveTestimonial.bind(null, null)} reset />
      </section>
      {error ? <p className="flash flash--error">Testimoni gagal dimuat.</p> : null}
      {items.map((t) => (
        <details key={t.id} className="admin-item">
          <summary>
            <strong>{t.author_name}</strong> · {t.published ? 'Tayang' : t.permission_granted ? 'Draft' : 'Menunggu izin'}
          </summary>
          <TestimonialFields t={t} action={saveTestimonial.bind(null, t.id)} />
          <ActionForm action={deleteTestimonial.bind(null, t.id)} confirm="Hapus testimoni ini?" label="Hapus testimoni">
            <SubmitButton small variant="btn-quiet">
              Hapus
            </SubmitButton>
          </ActionForm>
        </details>
      ))}
    </div>
  )
}
