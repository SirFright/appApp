import type { Contractor } from '../types'
import { geocodeTown } from './ctTowns'

// -----------------------------------------------------------------------------
// LIVE DATA — State of Connecticut "State Licenses and Credentials" open dataset
// (Socrata). Dataset page:
//   https://data.ct.gov/Business/State-Licenses-and-Credentials/ngch-56tr
//
// This works from a real device/browser. Some sandboxed/CI networks block
// data.ct.gov, in which case the app stays on bundled sample data.
//
// The dataset's exact Socrata field identifiers can vary, so instead of
// hard-coding them we fetch one record, detect the relevant columns, then
// query + normalize defensively. If CT renames columns, adjust CANDIDATES.
// -----------------------------------------------------------------------------

export const DATASET_RESOURCE = 'ngch-56tr'
export const DATASET_BASE = `https://data.ct.gov/resource/${DATASET_RESOURCE}.json`
export const DATASET_PAGE = `https://data.ct.gov/Business/State-Licenses-and-Credentials/${DATASET_RESOURCE}`

/** Max rows to pull for the electrical subset. */
const FETCH_LIMIT = 5000

type Logical =
  | 'credType'
  | 'fullCode'
  | 'credential'
  | 'credNumber'
  | 'business'
  | 'dba'
  | 'person'
  | 'status'
  | 'issue'
  | 'expiration'
  | 'address'
  | 'city'
  | 'state'
  | 'zip'

// Ordered candidate field names (lowercased) for each logical column.
const CANDIDATES: Record<Logical, string[]> = {
  credType: ['credentialtype', 'credential_type', 'licensetype', 'license_type'],
  fullCode: ['fullcredentialcode', 'full_credential_code', 'credentialcode'],
  credential: ['credential', 'credentialsubcategory', 'subcategory'],
  credNumber: [
    'credentialnumber',
    'credential_number',
    'licensenumber',
    'license_number',
  ],
  business: ['businessname', 'business_name', 'business', 'organizationname'],
  dba: ['dba', 'doingbusinessas'],
  person: ['name', 'fullname', 'full_name', 'licenseename'],
  status: ['status', 'credentialstatus', 'credential_status'],
  issue: ['issuedate', 'issue_date', 'effectivedate', 'effective_date'],
  expiration: ['expirationdate', 'expiration_date', 'expiredate'],
  address: ['address', 'addressline1', 'address_1', 'address1', 'streetaddress'],
  city: ['city', 'town'],
  state: ['state'],
  zip: ['zip', 'zipcode', 'zip_code', 'postalcode', 'postal_code'],
}

type FieldMap = Partial<Record<Logical, string>>

function detectFields(keysLower: string[]): FieldMap {
  const set = new Set(keysLower)
  const map: FieldMap = {}
  for (const logical of Object.keys(CANDIDATES) as Logical[]) {
    const cands = CANDIDATES[logical]
    // Exact match first.
    let found = cands.find((c) => set.has(c))
    // Then substring match.
    if (!found) {
      found = keysLower.find((k) => cands.some((c) => k.includes(c)))
    }
    if (found) map[logical] = found
  }
  return map
}

function lowerKeys(rec: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(rec)) {
    if (v == null) continue
    out[k.toLowerCase()] = typeof v === 'string' ? v : String(v)
  }
  return out
}

function val(rec: Record<string, string>, map: FieldMap, f: Logical): string {
  const key = map[f]
  return key ? (rec[key] ?? '').trim() : ''
}

/** Does this record represent an E-1 (unlimited electrical contractor)? */
function isE1(fields: {
  credType: string
  fullCode: string
  credential: string
}): boolean {
  const hay = `${fields.fullCode} ${fields.credType} ${fields.credential}`.toUpperCase()
  // Match an "E-1" / "E1" token not part of a larger number (E-10, E-12...).
  const hasE1 = /(^|[^A-Z0-9])E-?1([^0-9]|$)/.test(hay)
  const electrical = hay.includes('ELECTR')
  // Accept if it clearly says E-1, or it's electrical and coded E-1.
  return hasE1 && (electrical || /(^|[^A-Z0-9])E-?1/.test(fields.fullCode.toUpperCase()))
}

export class HttpError extends Error {
  status: number
  constructor(status: number, body: string) {
    super(`CT data request failed (HTTP ${status}). ${body}`)
    this.status = status
    this.name = 'HttpError'
  }
}

async function socrataGet(
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<Record<string, unknown>[]> {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${DATASET_BASE}?${qs}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new HttpError(res.status, body.slice(0, 300))
  }
  return (await res.json()) as Record<string, unknown>[]
}

export interface LiveResult {
  contractors: Contractor[]
  detected: FieldMap
  /** Total electrical rows pulled before the E-1 / business filters. */
  scanned: number
}

/**
 * Fetch registered E-1 electrical contractors that are operating a company
 * (i.e. have a business name) from Connecticut's open dataset.
 */
export async function fetchLiveContractors(
  signal?: AbortSignal,
): Promise<LiveResult> {
  // 1. Sniff one row to learn the actual column names.
  const sample = await socrataGet({ $limit: '1' }, signal)
  if (!sample.length) throw new Error('CT dataset returned no rows.')
  const map = detectFields(Object.keys(lowerKeys(sample[0])))
  if (!map.credType && !map.fullCode) {
    throw new Error(
      'Could not detect the credential-type column in the CT dataset.',
    )
  }

  // 2. Build a server-side filter for electrical credentials to keep the
  //    payload small, with a broad fallback if the WHERE is rejected.
  const typeKey = map.credType || map.fullCode!
  const clauses = [`upper(${typeKey}) like '%ELECTR%'`, `upper(${typeKey}) like 'E-%'`]
  if (map.fullCode && map.fullCode !== typeKey) {
    clauses.push(`upper(${map.fullCode}) like 'E-%'`)
  }
  const where = clauses.join(' OR ')

  let rows: Record<string, unknown>[]
  try {
    rows = await socrataGet(
      { $where: where, $limit: String(FETCH_LIMIT) },
      signal,
    )
  } catch (err) {
    if (err instanceof HttpError && err.status === 400) {
      // Fallback: full-text search, filter fully on the client.
      rows = await socrataGet(
        { $q: 'electrical', $limit: String(FETCH_LIMIT) },
        signal,
      )
    } else {
      throw err
    }
  }

  // 3. Normalize + filter.
  const scanned = rows.length
  const seen = new Set<string>()
  const contractors: Contractor[] = []

  for (const raw of rows) {
    const rec = lowerKeys(raw)
    const credType = val(rec, map, 'credType')
    const fullCode = val(rec, map, 'fullCode')
    const credential = val(rec, map, 'credential')
    if (!isE1({ credType, fullCode, credential })) continue

    const business = val(rec, map, 'business') || val(rec, map, 'dba')
    if (!business) continue // must be operating a company

    const state = val(rec, map, 'state')
    if (state && state.toUpperCase() !== 'CT') continue

    const status = val(rec, map, 'status')
    if (status && !/active/i.test(status)) continue

    const credNumber =
      val(rec, map, 'credNumber') || fullCode || `${business}-${rec['city'] ?? ''}`
    const id = credNumber.trim()
    if (seen.has(id)) continue
    seen.add(id)

    const town = val(rec, map, 'city')
    const address = val(rec, map, 'address')
    const { lat, lng, approx } = geocodeTown(town, id + address)

    contractors.push({
      id,
      businessName: titleCase(business),
      licenseHolder: titleCase(val(rec, map, 'person')) || undefined,
      licenseType: 'E-1',
      licenseTypeLabel: 'E-1 · Unlimited Electrical Contractor',
      credentialNumber: credNumber || undefined,
      status: status || 'Active',
      issueDate: val(rec, map, 'issue') || undefined,
      expirationDate: val(rec, map, 'expiration') || undefined,
      address: address ? titleCase(address) : undefined,
      town: titleCase(town) || 'Connecticut',
      state: 'CT',
      zip: val(rec, map, 'zip') || undefined,
      lat,
      lng,
      approxLocation: approx,
      description: undefined, // built on the fly from license fields
      source: 'live',
    })
  }

  contractors.sort((a, b) => a.businessName.localeCompare(b.businessName))
  return { contractors, detected: map, scanned }
}

/** Convert ALL-CAPS or lowercase agency text to Title Case, preserving suffixes. */
function titleCase(s: string): string {
  if (!s) return ''
  if (!/[a-z]/.test(s) || !/[A-Z]/.test(s)) {
    s = s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase())
  }
  return s
    .replace(/\bLlc\b/gi, 'LLC')
    .replace(/\bInc\b/gi, 'Inc')
    .replace(/\bCo\b/gi, 'Co')
    .replace(/\bLp\b/gi, 'LP')
    .replace(/\bLtd\b/gi, 'Ltd')
    .replace(/\bIi\b/g, 'II')
    .replace(/\bIii\b/g, 'III')
}
