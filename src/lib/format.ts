import type { ApplicationStage, Contractor } from '../types'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** "Apr 12, 2019" from an ISO-ish date string. */
export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/** Compact relative time: "now", "3d", "2w", "5mo", or a short date. */
export function relativeTime(ts?: number): string {
  if (!ts) return '—'
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d`
  const wk = Math.floor(day / 7)
  if (wk < 5) return `${wk}w`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo}mo`
  return `${Math.floor(day / 365)}y`
}

export const STAGE_LABEL: Record<ApplicationStage, string> = {
  none: 'Not applied',
  applied: 'Applied',
  in_contact: 'In contact',
  hired: 'Hired',
  passed: 'Passed',
}

/** Short label used in the compact status column. */
export const STAGE_SHORT: Record<ApplicationStage, string> = {
  none: '—',
  applied: 'Applied',
  in_contact: 'Contact',
  hired: 'Hired',
  passed: 'Passed',
}

export const APPLY_STAGES: ApplicationStage[] = [
  'applied',
  'in_contact',
  'hired',
  'passed',
]

/** "1 pin" / "3 pins"; pass an explicit plural for irregular words. */
export function plural(n: number, one: string, many?: string): string {
  return `${n} ${n === 1 ? one : (many ?? one + 's')}`
}

export function fullAddress(c: Contractor): string {
  const line2 = [c.town, c.state, c.zip].filter(Boolean).join(', ').replace(
    /, (\d)/,
    ' $1',
  )
  return [c.address, line2].filter(Boolean).join(', ')
}

/**
 * Build a readable one-line address block (street on one line, town/state/zip
 * on the next). Returns { line1, line2 }.
 */
export function addressLines(c: Contractor): { line1: string; line2: string } {
  const line2 = [c.town, c.state].filter(Boolean).join(', ')
  return {
    line1: c.address || c.town,
    line2: c.address ? `${line2}${c.zip ? ' ' + c.zip : ''}` : c.state,
  }
}

/**
 * Compose a brief description for a contractor. Uses the record's own
 * description when present; otherwise builds a factual summary from the
 * license fields (used for live data, which has no marketing copy).
 */
export function describe(c: Contractor): string {
  if (c.description) return c.description
  const parts: string[] = []
  parts.push(
    `${c.licenseType} licensed electrical contractor${
      c.town ? ` based in ${c.town}, ${c.state}` : ''
    }.`,
  )
  if (c.licenseHolder) parts.push(`License holder: ${c.licenseHolder}.`)
  if (c.status) parts.push(`Credential status: ${c.status}.`)
  if (c.issueDate) {
    const yr = new Date(c.issueDate).getFullYear()
    if (!Number.isNaN(yr)) parts.push(`Licensed since ${yr}.`)
  }
  return parts.join(' ')
}

/** URL to verify this license on CT's official eLicense lookup. */
export function eLicenseUrl(): string {
  return 'https://www.elicense.ct.gov/Lookup/LicenseLookup.aspx'
}

/** A Google search URL prefilled with the business name + CT electrician. */
export function webSearchUrl(c: Contractor): string {
  const q = encodeURIComponent(
    `${c.businessName} ${c.town} CT electrician`,
  )
  return `https://www.google.com/search?q=${q}`
}

/** Google Maps directions/search for the address. */
export function mapsUrl(c: Contractor): string {
  const q = encodeURIComponent(fullAddress(c) || `${c.businessName} ${c.town} CT`)
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

export function telHref(phone?: string): string | undefined {
  if (!phone) return undefined
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export function normalizeWebsite(url?: string): string | undefined {
  if (!url) return undefined
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}
