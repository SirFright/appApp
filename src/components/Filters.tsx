import type { Segment } from '../types'
import { useFilters } from '../state/filters'
import { useTowns, type Counts } from '../lib/useVisible'
import { Search } from './Icons'

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'applied', label: 'Applied' },
]

interface Props {
  counts: Counts
  showSegments?: boolean
  showTown?: boolean
  placeholder?: string
}

export default function Filters({
  counts,
  showSegments = true,
  showTown = true,
  placeholder = 'Search company, town, license…',
}: Props) {
  const { query, setQuery, segment, setSegment, town, setTown } = useFilters()
  const towns = useTowns()

  const countFor = (k: Segment) =>
    k === 'all'
      ? counts.all
      : k === 'new'
        ? counts.new
        : k === 'favorites'
          ? counts.favorites
          : counts.applied

  return (
    <div className="controls">
      <div className="search">
        <Search />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          type="search"
          enterKeyHint="search"
          aria-label="Search companies"
        />
      </div>

      {showTown && towns.length > 1 && (
        <div className="search" style={{ paddingRight: 6 }}>
          <select
            value={town}
            onChange={(e) => setTown(e.target.value)}
            aria-label="Filter by town"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'none',
              color: town ? 'var(--text)' : 'var(--text-faint)',
            }}
          >
            <option value="">All towns ({towns.length})</option>
            {towns.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      {showSegments && (
        <div className="segment" role="tablist" aria-label="Filter by status">
          {SEGMENTS.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={segment === s.key}
              className={`segment__btn${segment === s.key ? ' active' : ''}`}
              onClick={() => setSegment(s.key)}
            >
              {s.label}
              <span className="segment__count">{countFor(s.key)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
