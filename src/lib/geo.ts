import { CT_TOWNS } from '../data/ctTowns'

export interface NamedPlace {
  label: string
  lat: number
  lng: number
}

const EARTH_RADIUS_MILES = 3958.8

/** Great-circle distance in miles between two lat/lng points. */
export function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)))
}

function titleCaseTown(key: string): string {
  return key.replace(/\b\w/g, (m) => m.toUpperCase())
}

/** Selectable town centers for the "distance from a town" picker. */
export const CT_TOWN_PLACES: NamedPlace[] = Object.entries(CT_TOWNS)
  .map(([key, [lat, lng]]) => ({ label: titleCaseTown(key), lat, lng }))
  .sort((a, b) => a.label.localeCompare(b.label))

/** Radius choices in miles; null means "any distance" (sort only, no cap). */
export const RADIUS_OPTIONS: (number | null)[] = [5, 10, 25, 50, null]

export function formatMiles(mi: number): string {
  if (mi < 0.1) return 'here'
  if (mi < 10) return `${mi.toFixed(1)} mi`
  return `${Math.round(mi)} mi`
}
