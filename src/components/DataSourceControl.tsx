import { useData } from '../data/dataSource'
import { Refresh } from './Icons'

export default function DataSourceControl() {
  const { mode, setMode, status, refresh } = useData()
  const live = mode === 'live'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {live &&
        (status === 'loading' ? (
          <span className="spinner" aria-label="Loading live data" />
        ) : (
          <button
            className="iconbtn"
            onClick={refresh}
            aria-label="Refresh live data"
            title="Refresh live data"
          >
            <Refresh />
          </button>
        ))}
      <label className="toggle" title="Toggle live Connecticut data">
        <span>Live</span>
        <input
          type="checkbox"
          checked={live}
          onChange={(e) => setMode(e.target.checked ? 'live' : 'sample')}
          aria-label="Use live Connecticut data"
        />
      </label>
    </div>
  )
}
