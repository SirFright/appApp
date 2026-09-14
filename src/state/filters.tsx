import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Segment } from '../types'

interface Ctx {
  query: string
  setQuery: (q: string) => void
  segment: Segment
  setSegment: (s: Segment) => void
  town: string
  setTown: (t: string) => void
  /** Contractor id to focus/expand (set when navigating from the map). */
  focusId: string | null
  setFocusId: (id: string | null) => void
}

const FiltersCtx = createContext<Ctx | null>(null)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<Segment>('all')
  const [town, setTown] = useState('')
  const [focusId, setFocusId] = useState<string | null>(null)

  const value = useMemo<Ctx>(
    () => ({
      query,
      setQuery,
      segment,
      setSegment,
      town,
      setTown,
      focusId,
      setFocusId,
    }),
    [query, segment, town, focusId],
  )

  return <FiltersCtx.Provider value={value}>{children}</FiltersCtx.Provider>
}

export function useFilters(): Ctx {
  const ctx = useContext(FiltersCtx)
  if (!ctx) throw new Error('useFilters must be used within FiltersProvider')
  return ctx
}
