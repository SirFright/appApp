import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Contractor } from '../types'
import { useData } from '../data/dataSource'
import { useFilters } from '../state/filters'
import { useVisibleContractors } from '../lib/useVisible'
import { plural } from '../lib/format'
import Header from '../components/Header'
import DataSourceControl from '../components/DataSourceControl'
import Filters from '../components/Filters'
import CompanyCard from '../components/CompanyCard'
import { DATASET_PAGE } from '../data/ctApi'
import { Alert, Building, Info, ListIcon } from '../components/Icons'

export default function CompaniesPage() {
  const navigate = useNavigate()
  const { mode, contractors, status, error, usingFallback, scanned } = useData()
  const { list, counts } = useVisibleContractors()
  const { setQuery, setTown, setSegment, focusId, setFocusId } = useFilters()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Focus + expand a specific card when navigated from the map.
  useEffect(() => {
    if (!focusId) return
    setExpandedId(focusId)
    const id = focusId
    setFocusId(null)
    const t = window.setTimeout(() => {
      document
        .getElementById(`card-${id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
    return () => window.clearTimeout(t)
  }, [focusId, setFocusId])

  const onShowOnMap = (c: Contractor) => {
    setQuery('')
    setTown('')
    setSegment('all')
    setFocusId(c.id)
    navigate('/map')
  }

  const subtitle =
    mode === 'live'
      ? usingFallback
        ? 'Sample data (live unavailable)'
        : `Live CT data · ${plural(contractors.length, 'company', 'companies')}`
      : `Sample data · ${plural(contractors.length, 'company', 'companies')}`

  return (
    <div className="scroll">
      <Header title="CT Electricians" subtitle={subtitle}>
        <DataSourceControl />
      </Header>

      {mode === 'live' && status === 'error' && (
        <div className="banner banner--warn">
          <Alert />
          <div>
            <b>Couldn’t load live data.</b> {error}{' '}
            <a href={DATASET_PAGE} target="_blank" rel="noreferrer">
              Open the CT dataset ↗
            </a>
          </div>
        </div>
      )}
      {mode === 'live' && status === 'ready' && !usingFallback && (
        <div className="banner banner--info">
          <Info />
          <div>
            Showing <b>{contractors.length}</b> E-1 electrical companies from
            Connecticut’s official license data
            {scanned ? ` (scanned ${scanned} electrical records)` : ''}.
          </div>
        </div>
      )}
      {mode === 'sample' && (
        <div className="banner banner--info">
          <Info />
          <div>
            Demo mode with <b>{contractors.length}</b> example companies. Flip{' '}
            <b>Live</b> on to pull real E-1 contractors from the State of
            Connecticut.
          </div>
        </div>
      )}

      <div className="stats">
        <div className="stat">
          <b>{counts.all}</b>
          <span>Companies</span>
        </div>
        <div className="stat new">
          <b>{counts.new}</b>
          <span>New</span>
        </div>
        <div className="stat fav">
          <b>{counts.favorites}</b>
          <span>Saved</span>
        </div>
        <div className="stat applied">
          <b>{counts.applied}</b>
          <span>Applied</span>
        </div>
      </div>

      <Filters counts={counts} />

      {list.length === 0 ? (
        <div className="empty">
          <ListIcon />
          <h3>No companies here yet</h3>
          <p>
            Try a different filter or search term. New companies you haven’t
            opened show up under <b>New</b>.
          </p>
        </div>
      ) : (
        <div className="list">
          {list.map((c) => (
            <div id={`card-${c.id}`} key={c.id}>
              <CompanyCard
                c={c}
                expanded={expandedId === c.id}
                onToggle={() =>
                  setExpandedId((cur) => (cur === c.id ? null : c.id))
                }
                onShowOnMap={onShowOnMap}
              />
            </div>
          ))}
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-faint)',
              fontSize: 12,
              padding: '14px 0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Building style={{ width: 14, height: 14 }} />
            {list.length} shown · E-1 unlimited electrical contractors
          </div>
        </div>
      )}
    </div>
  )
}
