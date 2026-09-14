// Core domain types for CT Sparks.

export type ApplicationStage =
  | 'none'
  | 'applied'
  | 'in_contact'
  | 'hired'
  | 'passed'

export interface Contractor {
  /** Stable unique id (credential number when available, else derived). */
  id: string
  /** Company / business name — the entity "operating a company". */
  businessName: string
  /** Person named on the license, if known. */
  licenseHolder?: string
  /** Short license code, e.g. "E-1". */
  licenseType: string
  /** Human label, e.g. "E-1 · Unlimited Electrical Contractor". */
  licenseTypeLabel: string
  credentialNumber?: string
  /** License status, e.g. "Active". */
  status: string
  /** ISO date the credential was issued. */
  issueDate?: string
  /** ISO date the credential expires. */
  expirationDate?: string
  address?: string
  /** City / town. */
  town: string
  state: string
  zip?: string
  lat: number
  lng: number
  /** True when lat/lng was derived from a town/zip centroid, not an exact address. */
  approxLocation?: boolean
  phone?: string
  website?: string
  email?: string
  /** Brief description of the company. */
  description?: string
  /** Where this record came from. */
  source: 'sample' | 'live'
}

export interface ApplicationInfo {
  stage: ApplicationStage
  /** Timestamp of the most recent stage change. */
  updatedAt?: number
  /** Timestamp the user first marked "applied". */
  appliedAt?: number
  note?: string
}

/** Per-contractor user state, persisted locally on the device. */
export interface UserRecord {
  favorite?: boolean
  favoritedAt?: number
  viewedAt?: number
  application: ApplicationInfo
}

export type UserState = Record<string, UserRecord>

export type Segment = 'all' | 'new' | 'favorites' | 'applied'

export type DataMode = 'sample' | 'live'
