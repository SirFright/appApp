import { useNavigate } from 'react-router-dom'
import type { Contractor } from '../types'
import { useData } from '../data/dataSource'
import { useFilters } from '../state/filters'
import { useVisibleContractors } from '../lib/useVisible'
import { plural } from '../lib/format'
import Header from '../components/Header'
import DataSourceControl from '../components/DataSourceControl'
import Filters from '../components/Filters'
import MapView from '../components/MapView'

const LEGEND: { c: string; label: string }[] = [
  { c: '#38bdf8', label: 'New' },
  { c: '#ffca45', label: 'Favorite' },
  { c: '#37c46b', label: 'Applied' },
  { c: '#8b97a7', label: 'Viewed' },
]

export default function MapPage() {
  const navigate = useNavigate()
  const { mode, usingFallback } = useData()
  const { list, counts } = useVisibleContractors()
  const { focusId, setFocusId } = useFilters()

  const onDetails = (c: Contractor) => {
    setFocusId(c.id)
    navigate('/companies')
  }

  const subtitle =
    mode === 'live' && !usingFallback
      ? `${plural(list.length, 'company', 'companies')} · live CT data`
      : `${plural(list.length, 'company', 'companies')} · sample data`

  return (
    <div className="map-page">
      <Header title="Registered Locations" subtitle={subtitle}>
        <DataSourceControl />
      </Header>
      <div className="map-wrap">
        <div className="map-overlay-top">
          <Filters
            counts={counts}
            showTown={false}
            placeholder="Search the map…"
          />
        </div>

        <MapView
          items={list}
          focusId={focusId}
          onFocusConsumed={() => setFocusId(null)}
          onDetails={onDetails}
        />

        <div className="map-legend" aria-hidden>
          {LEGEND.map((l) => (
            <div className="row" key={l.label}>
              <span className="dot" style={{ background: l.c }} />
              {l.label}
            </div>
          ))}
        </div>
        <div className="map-count">{plural(list.length, 'pin')}</div>
      </div>
    </div>
  )
}
