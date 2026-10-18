import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { PhotoUploader } from '@/components/admin/PhotoUploader'
import { requireAdmin } from '@/lib/admin'
import { DEFAULT_SETTINGS } from '@/lib/defaults'
import { mediaUrl } from '@/lib/media'
import type { SiteSettings } from '@/lib/types'
import { removeHeroImage, saveSetting, uploadHeroImage } from '../content-actions'

function Text({ id, label, value, hint, ...rest }: { id: string; label: string; value: string | number | null; hint?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id.split('.')[1]} defaultValue={value ?? ''} {...rest} />
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  )
}

function Area({ id, label, value, rows = 6, max, hint }: { id: string; label: string; value: string; rows?: number; max: number; hint?: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} name={id.split('.')[1]} rows={rows} maxLength={max} defaultValue={value} />
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  )
}

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('site_settings').select('key, value')
  const s = structuredClone(DEFAULT_SETTINGS) as unknown as Record<string, Record<string, unknown>>
  for (const row of (data ?? []) as Array<{ key: string; value: Record<string, unknown> }>) {
    if (row.key in s) s[row.key] = { ...s[row.key], ...row.value }
  }
  const { business, socials, hero, story, shipping, seo } = s as unknown as SiteSettings
  const heroSrc = mediaUrl(hero.image_path)

  return (
    <div className="admin-stack">
      <h1 className="headline">Pengaturan situs</h1>

      <ActionForm action={saveSetting.bind(null, 'business')} className="admin-form" label="Bisnis dan kontak">
        <fieldset>
          <legend>Bisnis dan kontak</legend>
          <div className="row">
            <Text id="business.brand" label="Nama brand" value={business.brand} required maxLength={80} />
            <Text id="business.location" label="Lokasi" value={business.location} required maxLength={200} />
          </div>
          <div className="row">
            <Text
              id="business.whatsapp_number"
              label="Nomor WhatsApp (untuk tautan)"
              value={business.whatsapp_number}
              required
              maxLength={20}
              hint="Contoh 6285174413278 atau 085174413278."
            />
          </div>
          <Text id="business.maps_url" label="Tautan Google Maps" value={business.maps_url} type="url" maxLength={500} />
          <Text
            id="business.google_reviews_url"
            label="Tautan baca ulasan Google"
            value={business.google_reviews_url}
            type="url"
            maxLength={500}
            hint="Dari Google Business Profile. Kosongkan bila belum ada: situs menampilkan keterangan menunggu tautan."
          />
          <Text
            id="business.google_write_review_url"
            label="Tautan tulis ulasan Google"
            value={business.google_write_review_url}
            type="url"
            maxLength={500}
            hint="Dari Google Business Profile, menu Minta ulasan."
          />
          <div className="row">
            <Text id="business.experience_years" label="Lama pengalaman (tahun)" value={business.experience_years} inputMode="numeric" maxLength={2} />
            <Text id="business.experience_text" label="Keterangan pengalaman" value={business.experience_text} maxLength={300} />
          </div>
        </fieldset>
        <div>
          <SubmitButton variant="btn-primary">Simpan kontak</SubmitButton>
        </div>
      </ActionForm>

      <ActionForm action={saveSetting.bind(null, 'socials')} className="admin-form" label="Media sosial">
        <fieldset>
          <legend>Media sosial</legend>
          <p className="hint">Hanya tautan https. Kosongkan untuk menyembunyikan ikon.</p>
          <Text id="socials.instagram" label="Instagram" value={socials.instagram} type="url" maxLength={500} />
          <Text id="socials.facebook" label="Facebook" value={socials.facebook} type="url" maxLength={500} />
          <Text id="socials.tiktok" label="TikTok" value={socials.tiktok} type="url" maxLength={500} />
          <Text id="socials.youtube" label="YouTube" value={socials.youtube} type="url" maxLength={500} />
          <Text id="socials.tokopedia" label="Tokopedia" value={socials.tokopedia} type="url" maxLength={500} />
        </fieldset>
        <div>
          <SubmitButton variant="btn-primary">Simpan media sosial</SubmitButton>
        </div>
      </ActionForm>

      <section className="admin-section" aria-labelledby="hero-image-title">
        <h2 id="hero-image-title">Gambar hero</h2>
        {heroSrc ? (
          <div className="photo-card" style={{ maxWidth: 420 }}>
            <img src={heroSrc} alt={hero.image_alt} />
            <ActionForm action={removeHeroImage} confirm="Kembali ke ilustrasi konsep?" label="Hapus gambar hero">
              <SubmitButton small variant="btn-quiet">
                Kembali ke ilustrasi konsep
              </SubmitButton>
            </ActionForm>
          </div>
        ) : (
          <p className="soft">Saat ini hero memakai ilustrasi konsep yang disetujui, dengan keterangan bahwa itu bukan foto hewan GeckoDan.</p>
        )}
        <PhotoUploader action={uploadHeroImage} field="hero" multiple={false} label="Unggah foto hero asli" />
      </section>

      <ActionForm action={saveSetting.bind(null, 'hero')} className="admin-form" label="Teks hero">
        <fieldset>
          <legend>Teks hero</legend>
          <Text id="hero.eyebrow" label="Teks kecil di atas judul" value={hero.eyebrow} maxLength={60} />
          <Text id="hero.headline" label="Judul" value={hero.headline} required maxLength={60} />
          <Text id="hero.tagline" label="Tagline" value={hero.tagline} maxLength={80} />
          <Area id="hero.body" label="Paragraf" value={hero.body} rows={3} max={300} />
          <div className="row">
            <Text id="hero.cta_label" label="Label tombol" value={hero.cta_label} required maxLength={40} />
            <Text id="hero.cta_href" label="Tujuan tombol" value={hero.cta_href} required maxLength={200} hint="Tautan internal, contoh /geckos." />
          </div>
          <Text id="hero.image_alt" label="Deskripsi gambar hero" value={hero.image_alt} maxLength={300} />
          <label className="check">
            <input type="checkbox" name="image_is_concept" defaultChecked={hero.image_is_concept} />
            Gambar hero adalah ilustrasi konsep (tampilkan keterangan)
          </label>
        </fieldset>
        <div>
          <SubmitButton variant="btn-primary">Simpan hero</SubmitButton>
        </div>
      </ActionForm>

      <ActionForm action={saveSetting.bind(null, 'story')} className="admin-form" label="Cerita">
        <fieldset>
          <legend>Our Story</legend>
          <Text id="story.title" label="Judul" value={story.title} required maxLength={80} />
          <Area id="story.body" label="Cerita" value={story.body} rows={12} max={12000} hint="Pisahkan paragraf dengan baris kosong. Tulis hanya yang benar terjadi." />
          <Text id="story.signature" label="Tanda tangan" value={story.signature} maxLength={120} />
        </fieldset>
        <div>
          <SubmitButton variant="btn-primary">Simpan cerita</SubmitButton>
        </div>
      </ActionForm>

      <ActionForm action={saveSetting.bind(null, 'shipping')} className="admin-form" label="Pengiriman">
        <fieldset>
          <legend>Pengiriman</legend>
          <Area id="shipping.body" label="Kebijakan pengiriman" value={shipping.body} rows={10} max={12000} hint="Area, jasa kirim, jadwal, dan jaminan hidup yang benar-benar berlaku." />
        </fieldset>
        <div>
          <SubmitButton variant="btn-primary">Simpan pengiriman</SubmitButton>
        </div>
      </ActionForm>

      <ActionForm action={saveSetting.bind(null, 'seo')} className="admin-form" label="SEO">
        <fieldset>
          <legend>SEO</legend>
          <Text id="seo.site_title" label="Judul situs" value={seo.site_title} required maxLength={80} />
          <Area id="seo.default_description" label="Deskripsi default" value={seo.default_description} rows={3} max={300} />
        </fieldset>
        <div>
          <SubmitButton variant="btn-primary">Simpan SEO</SubmitButton>
        </div>
      </ActionForm>
    </div>
  )
}
