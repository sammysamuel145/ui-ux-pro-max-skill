import type { GeckoSex, GeckoStatus, GeckoVisibility } from './types'

export const STATUS_LABEL: Record<GeckoStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
}

export const STATUS_HINT: Record<GeckoStatus, string> = {
  available: 'Tersedia. Tanyakan via WhatsApp untuk memastikan.',
  reserved: 'Sedang dipesan pembeli lain.',
  sold: 'Sudah terjual.',
}

export const SEX_LABEL: Record<GeckoSex, string> = {
  male: 'Jantan',
  female: 'Betina',
  unknown: 'Belum diketahui',
}

export const VISIBILITY_LABEL: Record<GeckoVisibility, string> = {
  for_sale: 'Dijual',
  showcase: 'Koleksi',
  both: 'Dijual dan koleksi',
}
