import { ActionForm, SubmitButton } from './ActionForm'
import type { ActionState } from '@/lib/action-state'
import type { Award } from '@/lib/types'

type Props = {
  action: (formData: FormData) => Promise<ActionState>
  award?: Award
  geckos: Array<{ id: string; name: string; code: string }>
}

export function AwardForm({ action, award, geckos }: Props) {
  return (
    <ActionForm action={action} className="admin-form" label={award ? 'Ubah prestasi' : 'Prestasi baru'}>
      <fieldset>
        <legend>Prestasi</legend>
        <div className="field">
          <label htmlFor="title">Judul</label>
          <input id="title" name="title" required maxLength={200} defaultValue={award?.title} placeholder="Contoh: Juara 1 kelas Tangerine" />
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="event_name">Nama acara</label>
            <input id="event_name" name="event_name" maxLength={200} defaultValue={award?.event_name ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="organizer">Penyelenggara</label>
            <input id="organizer" name="organizer" maxLength={200} defaultValue={award?.organizer ?? ''} />
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="award_year">Tahun</label>
            <input id="award_year" name="award_year" inputMode="numeric" maxLength={4} defaultValue={award?.award_year ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="placement">Peringkat</label>
            <input id="placement" name="placement" maxLength={120} defaultValue={award?.placement ?? ''} />
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="gecko_id">Gecko terkait</label>
            <select id="gecko_id" name="gecko_id" defaultValue={award?.gecko_id ?? ''}>
              <option value="">Tidak ada</option>
              {geckos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sort_order">Urutan</label>
            <input id="sort_order" name="sort_order" type="number" min={0} max={9999} defaultValue={award?.sort_order ?? 0} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="description">Keterangan</label>
          <textarea id="description" name="description" rows={4} maxLength={4000} defaultValue={award?.description ?? ''} />
        </div>
      </fieldset>
      <fieldset>
        <legend>Bukti dan verifikasi</legend>
        <div className="field">
          <label htmlFor="evidence_url">Tautan bukti (https)</label>
          <input id="evidence_url" name="evidence_url" type="url" maxLength={500} defaultValue={award?.evidence_url ?? ''} placeholder="https://" />
          <p className="hint">Misalnya postingan resmi penyelenggara. Gambar sertifikat bisa diunggah setelah prestasi disimpan.</p>
        </div>
        <label className="check">
          <input type="checkbox" name="verified" defaultChecked={award?.verified ?? false} />
          Saya sudah memeriksa bukti ini dan prestasinya benar
        </label>
        <label className="check">
          <input type="checkbox" name="published" defaultChecked={award?.published ?? false} />
          Publikasikan (butuh verifikasi dan bukti)
        </label>
      </fieldset>
      <div>
        <SubmitButton variant="btn-primary">{award ? 'Simpan prestasi' : 'Buat prestasi'}</SubmitButton>
      </div>
    </ActionForm>
  )
}
