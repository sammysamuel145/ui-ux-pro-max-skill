import type { BusinessSettings } from '@/lib/types'
import { BrandIcon } from './Icons'

/**
 * Separate actions for reading and writing Google reviews. A link is shown only
 * once the owner has saved a verified URL; otherwise the slot says it is pending.
 * No rating or review count is ever shown, because none is read from Google.
 */
export function ReviewActions({ business }: { business: BusinessSettings }) {
  const read = /^https:\/\//.test(business.google_reviews_url) ? business.google_reviews_url : ''
  const write = /^https:\/\//.test(business.google_write_review_url) ? business.google_write_review_url : ''
  return (
    <div className="inline-actions">
      {read ? (
        <a className="btn btn-dark" href={read} target="_blank" rel="noopener noreferrer">
          <BrandIcon name="maps" /> Baca ulasan Google
        </a>
      ) : (
        <p>
          <span className="placeholder-tag">Menunggu tautan</span>{' '}
          <span className="soft">Tautan ulasan Google GeckoDan belum diatur.</span>
        </p>
      )}
      {write ? (
        <a className="btn btn-quiet" href={write} target="_blank" rel="noopener noreferrer">
          Tulis ulasan di Google
        </a>
      ) : null}
    </div>
  )
}
