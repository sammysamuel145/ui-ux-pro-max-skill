import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="wrap section" style={{ display: 'grid', gap: 24, justifyItems: 'start' }}>
      <h1 className="headline" style={{ textTransform: 'uppercase' }}>
        Page not found
      </h1>
      <p className="lead">This gecko or page may no longer be published.</p>
      <Link className="btn btn-dark" href="/geckos">
        View the catalogue
      </Link>
    </section>
  )
}
