import Link from 'next/link'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { requireAdmin } from '@/lib/admin'
import { createLine } from '../../content-actions'

export default async function NewLinePage() {
  await requireAdmin()
  return (
    <div className="admin-stack">
      <p>
        <Link className="text-link" href="/admin/dashboard/lines">
          Semua line
        </Link>
      </p>
      <h1 className="headline">Line baru</h1>
      <ActionForm action={createLine} className="admin-form" label="Line baru">
        <fieldset>
          <legend>Data dasar</legend>
          <div className="field">
            <label htmlFor="name">Nama line</label>
            <input id="name" name="name" required maxLength={80} placeholder="Contoh: ORION" />
          </div>
          <div className="field">
            <label htmlFor="slug">Alamat halaman (opsional)</label>
            <input id="slug" name="slug" maxLength={80} placeholder="Kosongkan agar dibuat dari nama" />
            <p className="hint">
              Halaman line akan ada di /lines/<em>alamat</em>. Hanya huruf kecil, angka, dan tanda hubung. Tidak bisa diubah
              setelah dibuat, karena link lama akan putus.
            </p>
          </div>
        </fieldset>
        <p className="soft">Line disimpan sebagai draft. Setelah itu isi cerita dan foto sampul, lalu centang Tayang.</p>
        <div>
          <SubmitButton variant="btn-primary">Buat line</SubmitButton>
        </div>
      </ActionForm>
    </div>
  )
}
