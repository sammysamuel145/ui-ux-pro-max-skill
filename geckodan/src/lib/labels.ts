import type { GeckoSex, GeckoStatus, GeckoVisibility } from './types'

export const STATUS_LABEL: Record<GeckoStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
}

export const STATUS_HINT: Record<GeckoStatus, string> = {
  available: 'Available. Ask on WhatsApp to confirm.',
  reserved: 'Currently reserved by another buyer.',
  sold: 'Already sold.',
}

export const SEX_LABEL: Record<GeckoSex, string> = {
  male: 'Male',
  female: 'Female',
  unknown: 'Unknown',
}

export const VISIBILITY_LABEL: Record<GeckoVisibility, string> = {
  for_sale: 'For sale',
  showcase: 'Showcase',
  both: 'For sale and showcase',
}
