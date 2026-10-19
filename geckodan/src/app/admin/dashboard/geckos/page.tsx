import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { STATUS_LABEL, VISIBILITY_LABEL } from '@/lib/labels'
import { sanitizeQuery } from '@/lib/catalog'
import type { GeckoStatus, GeckoVisibility } from '@/lib/types'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

type Row = {
  id: string
  code: string
  name: string
  status: GeckoStatus
  visibility: GeckoVisibility
  published: boolean
  archived: boolean
  featured: boolean
  gecko_photos: { id: string }[]
}

export default async function AdminGeckosPage({ searchParams }: Props) {
  const { supabase } = await requireAdmin()
  const sp = await searchParams
  const q = sanitizeQuery(typeof sp.q === 'string' ? sp.q : '')
  const status = typeof sp.status === 'string' && sp.status in STATUS_LABEL ? sp.status : ''
  const showArchived = sp.archived === '1'
  const draftsOnly = sp.published === '0'

  let query = supabase
    .from('geckos')
    .select('id, code, name, status, visibility, published, archived, featured, gecko_photos(id)')
    .eq('archived', showArchived)
    .order('created_at', { ascending: false })
    .limit(500)
  if (q) query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,morph.ilike.%${q}%`)
  if (status) query = query.eq('status', status)
  if (draftsOnly) query = query.eq('published', false)
  const { data, error } = await query
  const rows = (data ?? []) as Row[]

  return (
    <div className="admin-stack">
      <header className="admin-head">
        <h1 className="headline">Geckos</h1>
        <Link className="btn btn-primary" href="/admin/dashboard/geckos/new">
          Tambah gecko
        </Link>
      </header>
      {sp.deleted === '1' ? <p className="flash flash--ok">Gecko dihapus.</p> : null}

      <form className="filters" method="get" role="search">
        <div className="field field-search">
          <label htmlFor="q">Cari nama, ID, atau morph</label>
          <input id="q" name="q" type="search" defaultValue={q} maxLength={60} />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status}>
            <option value="">Semua</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <label className="check">
          <input type="checkbox" name="archived" value="1" defaultChecked={showArchived} />
          Arsip
        </label>
        <button type="submit" className="btn btn-dark">
          Terapkan
        </button>
      </form>

      {error ? (
        <p className="flash flash--error">Data gecko gagal dimuat.</p>
      ) : rows.length === 0 ? (
        <p>{q || status || draftsOnly ? 'Tidak ada gecko yang cocok.' : 'Belum ada gecko. Tambahkan yang pertama.'}</p>
      ) : (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Nama</th>
                <th scope="col">ID</th>
                <th scope="col">Status</th>
                <th scope="col">Tampil di</th>
                <th scope="col">Situs</th>
                <th scope="col">Foto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <td>
                    <Link href={`/admin/dashboard/geckos/${g.id}`}>{g.name}</Link>
                    {g.featured ? <span className="tag">Unggulan</span> : null}
                  </td>
                  <td>{g.code}</td>
                  <td>{STATUS_LABEL[g.status]}</td>
                  <td>{VISIBILITY_LABEL[g.visibility]}</td>
                  <td>{g.archived ? 'Arsip' : g.published ? 'Tayang' : 'Draft'}</td>
                  <td>{g.gecko_photos.length || <span className="warn">Belum ada</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
