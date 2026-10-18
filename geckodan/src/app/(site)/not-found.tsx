import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="wrap section" style={{ display: 'grid', gap: 24, justifyItems: 'start' }}>
      <h1 className="headline" style={{ textTransform: 'uppercase' }}>
        Halaman tidak ditemukan
      </h1>
      <p className="lead">Gecko atau halaman ini mungkin sudah tidak dipublikasikan.</p>
      <Link className="btn btn-dark" href="/geckos">
        Lihat katalog
      </Link>
    </section>
  )
}
