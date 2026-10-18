import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { requireAdmin } from '@/lib/admin'
import type { ActionState } from '@/lib/action-state'
import type { Faq } from '@/lib/types'
import { deleteFaq, saveFaq } from '../content-actions'

const CATEGORIES: Record<Faq['category'], string> = {
  general: 'Umum',
  purchase: 'Pembelian',
  shipping: 'Pengiriman',
  care: 'Perawatan',
}

function FaqFields({ f, action, reset }: { f?: Faq; action: (fd: FormData) => Promise<ActionState>; reset?: boolean }) {
  const p = f?.id ?? 'new'
  return (
    <ActionForm action={action} className="admin-form" resetOnSuccess={reset} label={f ? 'Ubah FAQ' : 'FAQ baru'}>
      <fieldset>
        <legend>{f ? 'Ubah FAQ' : 'FAQ baru'}</legend>
        <div className="field">
          <label htmlFor={`question-${p}`}>Pertanyaan</label>
          <input id={`question-${p}`} name="question" required maxLength={300} defaultValue={f?.question} />
        </div>
        <div className="field">
          <label htmlFor={`answer-${p}`}>Jawaban</label>
          <textarea id={`answer-${p}`} name="answer" required rows={5} maxLength={4000} defaultValue={f?.answer} />
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor={`category-${p}`}>Kategori</label>
            <select id={`category-${p}`} name="category" defaultValue={f?.category ?? 'general'}>
              {Object.entries(CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`sort_order-${p}`}>Urutan</label>
            <input id={`sort_order-${p}`} name="sort_order" type="number" min={0} max={9999} defaultValue={f?.sort_order ?? 0} />
          </div>
        </div>
        <label className="check">
          <input type="checkbox" name="published" defaultChecked={f?.published ?? true} />
          Publikasikan
        </label>
      </fieldset>
      <div>
        <SubmitButton variant="btn-primary">{f ? 'Simpan' : 'Tambah FAQ'}</SubmitButton>
      </div>
    </ActionForm>
  )
}

export default async function AdminFaqsPage() {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase.from('faqs').select('*').order('category').order('sort_order')
  const items = (data ?? []) as Faq[]
  return (
    <div className="admin-stack">
      <h1 className="headline">FAQ</h1>
      <p className="soft">Pertanyaan berkategori Pengiriman juga tampil di halaman Shipping.</p>
      <section className="admin-section">
        <FaqFields action={saveFaq.bind(null, null)} reset />
      </section>
      {error ? <p className="flash flash--error">FAQ gagal dimuat.</p> : null}
      {items.map((f) => (
        <details key={f.id} className="admin-item">
          <summary>
            <strong>{f.question}</strong> · {CATEGORIES[f.category]} · {f.published ? 'Tayang' : 'Draft'}
          </summary>
          <FaqFields f={f} action={saveFaq.bind(null, f.id)} />
          <ActionForm action={deleteFaq.bind(null, f.id)} confirm="Hapus FAQ ini?" label="Hapus FAQ">
            <SubmitButton small variant="btn-quiet">
              Hapus
            </SubmitButton>
          </ActionForm>
        </details>
      ))}
    </div>
  )
}
