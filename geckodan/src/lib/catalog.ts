import type { GeckoSex, GeckoStatus } from './types'

export type CatalogSort = 'newest' | 'name' | 'code'
export type StatusFilter = GeckoStatus | 'all' | 'open'

export type CatalogFilters = {
  q: string
  line: string
  status: StatusFilter
  sex: GeckoSex | ''
  sort: CatalogSort
}

const STATUS_VALUES: StatusFilter[] = ['open', 'available', 'reserved', 'sold', 'all']
const SEX_VALUES: Array<GeckoSex | ''> = ['', 'male', 'female', 'unknown']
const SORT_VALUES: CatalogSort[] = ['newest', 'name', 'code']

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? ''
}

/**
 * Search text is used inside a PostgREST filter, so only letters, digits,
 * spaces and hyphens survive. Nothing else can change the filter's meaning.
 */
export function sanitizeQuery(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N} -]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}

export function parseCatalogFilters(params: Record<string, string | string[] | undefined>): CatalogFilters {
  const status = first(params.status) as StatusFilter
  const sex = first(params.sex) as GeckoSex | ''
  const sort = first(params.sort) as CatalogSort
  const line = first(params.line).toLowerCase()
  return {
    q: sanitizeQuery(first(params.q)),
    line: /^[a-z0-9-]{1,40}$/.test(line) ? line : '',
    status: STATUS_VALUES.includes(status) ? status : 'open',
    sex: SEX_VALUES.includes(sex) ? sex : '',
    sort: SORT_VALUES.includes(sort) ? sort : 'newest',
  }
}

/** The statuses a filter value stands for. "open" hides sold animals. */
export function statusesFor(filter: StatusFilter): GeckoStatus[] {
  switch (filter) {
    case 'open':
      return ['available', 'reserved']
    case 'all':
      return ['available', 'reserved', 'sold']
    default:
      return [filter]
  }
}

export function hasActiveFilters(f: CatalogFilters): boolean {
  return Boolean(f.q || f.line || f.sex || f.status !== 'open')
}
