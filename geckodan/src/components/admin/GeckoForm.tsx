import { ActionForm, SubmitButton } from './ActionForm'
import { SEX_LABEL, STATUS_LABEL, VISIBILITY_LABEL } from '@/lib/labels'
import type { ActionState } from '@/lib/action-state'
import type { Gecko, SignatureLine } from '@/lib/types'

type ParentOption = Pick<Gecko, 'id' | 'name' | 'code' | 'sex'>

type Props = {
  action: (formData: FormData) => Promise<ActionState>
  gecko?: Gecko
  lines: Pick<SignatureLine, 'id' | 'name'>[]
  parents: ParentOption[]
}

export function GeckoForm({ action, gecko, lines, parents }: Props) {
  const others = parents.filter((p) => p.id !== gecko?.id)
  const parentLabel = (p: ParentOption) => `${p.name} (${p.code})`

  return (
    <ActionForm action={action} className="admin-form" label={gecko ? `Ubah ${gecko.name}` : 'Gecko baru'}>
      <fieldset>
        <legend>Identitas</legend>
        <div className="row">
          <div className="field">
            <label htmlFor="name">Nama</label>
            <input id="name" name="name" required maxLength={120} defaultValue={gecko?.name} />
          </div>
          <div className="field">
            <label htmlFor="code">ID gecko</label>
            <input id="code" name="code" required maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9\-]{0,31}" defaultValue={gecko?.code} />
            <p className="hint">Huruf, angka, dan tanda hubung. Contoh GD-0007.</p>
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="slug">Slug URL</label>
            <input id="slug" name="slug" maxLength={80} defaultValue={gecko?.slug} />
            <p className="hint">Kosongkan untuk dibuat otomatis dari nama.</p>
          </div>
          <div className="field">
            <label htmlFor="morph">Morph</label>
            <input id="morph" name="morph" maxLength={200} defaultValue={gecko?.morph ?? ''} />
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="line_id">Signature line</label>
            <select id="line_id" name="line_id" defaultValue={gecko?.line_id ?? ''}>
              <option value="">Tanpa line</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sex">Jenis kelamin</label>
            <select id="sex" name="sex" defaultValue={gecko?.sex ?? 'unknown'}>
              {Object.entries(SEX_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="hatch_date">Tanggal menetas</label>
            <input id="hatch_date" name="hatch_date" type="date" defaultValue={gecko?.hatch_date ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="weight_grams">Berat (gram)</label>
            <input id="weight_grams" name="weight_grams" inputMode="decimal" defaultValue={gecko?.weight_grams ?? ''} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="description">Deskripsi</label>
          <textarea id="description" name="description" rows={6} maxLength={8000} defaultValue={gecko?.description ?? ''} />
          <p className="hint">Pisahkan paragraf dengan baris kosong. Jangan tulis harga.</p>
        </div>
      </fieldset>

      <fieldset>
        <legend>Silsilah</legend>
        <p className="hint">Isi hanya dengan data yang benar-benar tercatat.</p>
        <div className="row">
          <div className="field">
            <label htmlFor="sire_id">Induk jantan (sire)</label>
            <select id="sire_id" name="sire_id" defaultValue={gecko?.sire_id ?? ''}>
              <option value="">Tidak dicatat</option>
              {others
                .filter((p) => p.sex !== 'female')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {parentLabel(p)}
                  </option>
                ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="dam_id">Induk betina (dam)</label>
            <select id="dam_id" name="dam_id" defaultValue={gecko?.dam_id ?? ''}>
              <option value="">Tidak dicatat</option>
              {others
                .filter((p) => p.sex !== 'male')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {parentLabel(p)}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="lineage">Catatan silsilah</label>
          <textarea id="lineage" name="lineage" rows={3} maxLength={4000} defaultValue={gecko?.lineage ?? ''} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Status dan tampilan</legend>
        <div className="row">
          <div className="field">
            <label htmlFor="status">Status penjualan</label>
            <select id="status" name="status" defaultValue={gecko?.status ?? 'available'}>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="visibility">Tampil di</label>
            <select id="visibility" name="visibility" defaultValue={gecko?.visibility ?? 'for_sale'}>
              {Object.entries(VISIBILITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="check">
          <input type="checkbox" name="published" defaultChecked={gecko?.published ?? false} />
          Publikasikan di situs
        </label>
        <label className="check">
          <input type="checkbox" name="featured" defaultChecked={gecko?.featured ?? false} />
          Tampilkan di beranda (unggulan)
        </label>
      </fieldset>

      <fieldset>
        <legend>SEO</legend>
        <div className="field">
          <label htmlFor="seo_title">Judul halaman</label>
          <input id="seo_title" name="seo_title" maxLength={120} defaultValue={gecko?.seo_title ?? ''} />
        </div>
        <div className="field">
          <label htmlFor="seo_description">Deskripsi halaman</label>
          <textarea id="seo_description" name="seo_description" rows={2} maxLength={300} defaultValue={gecko?.seo_description ?? ''} />
        </div>
      </fieldset>

      <div>
        <SubmitButton variant="btn-primary">{gecko ? 'Simpan perubahan' : 'Buat gecko'}</SubmitButton>
      </div>
    </ActionForm>
  )
}
