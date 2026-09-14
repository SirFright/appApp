import { useMemo } from 'react'
import type { Contractor, Segment, UserState } from '../types'
import { useData } from '../data/dataSource'
import { useUserState } from '../store/userState'
import { useFilters } from '../state/filters'

export interface Counts {
  all: number
  new: number
  favorites: number
  applied: number
}

function isNew(state: UserState, id: string): boolean {
  return !state[id]?.viewedAt
}
function isFav(state: UserState, id: string): boolean {
  return !!state[id]?.favorite
}
function isApplied(state: UserState, id: string): boolean {
  const s = state[id]?.application?.stage
  return !!s && s !== 'none'
}

function matchesSearch(c: Contractor, q: string): boolean {
  if (!q) return true
  const hay = `${c.businessName} ${c.town} ${c.licenseHolder ?? ''} ${
    c.zip ?? ''
  } ${c.address ?? ''}`.toLowerCase()
  return hay.includes(q.toLowerCase())
}

function inSegment(state: UserState, id: string, segment: Segment): boolean {
  switch (segment) {
    case 'new':
      return isNew(state, id)
    case 'favorites':
      return isFav(state, id)
    case 'applied':
      return isApplied(state, id)
    default:
      return true
  }
}

/**
 * Contractors after search + town filters, and the per-segment counts
 * computed over that same base (so the tab badges reflect the search).
 */
export function useVisibleContractors(): {
  base: Contractor[]
  list: Contractor[]
  counts: Counts
} {
  const { contractors } = useData()
  const { state } = useUserState()
  const { query, town, segment } = useFilters()

  return useMemo(() => {
    const base = contractors.filter(
      (c) =>
        matchesSearch(c, query) &&
        (!town || c.town.toLowerCase() === town.toLowerCase()),
    )

    const counts: Counts = {
      all: base.length,
      new: base.filter((c) => isNew(state, c.id)).length,
      favorites: base.filter((c) => isFav(state, c.id)).length,
      applied: base.filter((c) => isApplied(state, c.id)).length,
    }

    const list = base.filter((c) => inSegment(state, c.id, segment))

    list.sort((a, b) => {
      if (segment === 'favorites') {
        return (
          (state[b.id]?.favoritedAt ?? 0) - (state[a.id]?.favoritedAt ?? 0) ||
          a.businessName.localeCompare(b.businessName)
        )
      }
      if (segment === 'applied') {
        return (
          (state[b.id]?.application?.updatedAt ?? 0) -
            (state[a.id]?.application?.updatedAt ?? 0) ||
          a.businessName.localeCompare(b.businessName)
        )
      }
      if (segment === 'all') {
        // Unviewed (new) first to help triage, then alphabetical.
        const an = isNew(state, a.id) ? 0 : 1
        const bn = isNew(state, b.id) ? 0 : 1
        if (an !== bn) return an - bn
      }
      return a.businessName.localeCompare(b.businessName)
    })

    return { base, list, counts }
  }, [contractors, state, query, town, segment])
}

/** Distinct town names present in the dataset, alphabetized. */
export function useTowns(): string[] {
  const { contractors } = useData()
  return useMemo(() => {
    const set = new Set<string>()
    for (const c of contractors) if (c.town) set.add(c.town)
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [contractors])
}
