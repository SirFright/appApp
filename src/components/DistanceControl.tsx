import { useState } from 'react'
import { useFilters } from '../state/filters'
import { CT_TOWN_PLACES, RADIUS_OPTIONS, type NamedPlace } from '../lib/geo'
import { Target, Locate, Close } from './Icons'

export default function DistanceControl() {
  const { center, setCenter, radiusMi, setRadiusMi } = useFilters()
  const [open, setOpen] = useState(false)
  const [geo, setGeo] = useState<'idle' | 'locating' | 'error'>('idle')
  const [geoMsg, setGeoMsg] = useState('')

  const active = center != null

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setGeo('error')
      setGeoMsg('Location isn’t available on this device.')
      return
    }
    setGeo('locating')
    setGeoMsg('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo('idle')
        setCenter({
          label: 'My location',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        if (radiusMi == null) setRadiusMi(25)
      },
      (err) => {
        setGeo('error')
        setGeoMsg(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Pick a town instead.'
            : 'Couldn’t get your location. Pick a town instead.',
        )
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }

  function pickTown(label: string) {
    const place = CT_TOWN_PLACES.find((p) => p.label === label)
    if (place) {
      setCenter(place as NamedPlace)
      if (radiusMi == null) setRadiusMi(25)
    }
  }

  function clear() {
    setCenter(null)
    setGeo('idle')
    setGeoMsg('')
    setOpen(false)
  }

  return (
    <div className="distance">
      {active ? (
        <div className="distance__active">
          <Target />
          <span className="distance__summary">
            {radiusMi == null ? 'Nearest to' : `Within ${radiusMi} mi of`}{' '}
            <b>{center!.label}</b>
          </span>
          <button
            className="distance__edit"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Close' : 'Change'}
          </button>
          <button className="distance__clear" onClick={clear} aria-label="Clear distance filter">
            <Close />
          </button>
        </div>
      ) : (
        <button className="distance__trigger" onClick={() => setOpen((o) => !o)}>
          <Target />
          Search by distance
        </button>
      )}

      {open && (
        <div className="distance__panel">
          <div className="distance__row">
            <button
              className="btn btn--sm"
              onClick={useMyLocation}
              disabled={geo === 'locating'}
            >
              {geo === 'locating' ? (
                <span className="spinner" style={{ width: 15, height: 15 }} />
              ) : (
                <Locate />
              )}
              Use my location
            </button>
            <span className="distance__or">or</span>
            <select
              className="distance__select"
              value={
                center && CT_TOWN_PLACES.some((p) => p.label === center.label)
                  ? center.label
                  : ''
              }
              onChange={(e) => pickTown(e.target.value)}
              aria-label="Choose a town"
            >
              <option value="">Choose a town…</option>
              {CT_TOWN_PLACES.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {geo === 'error' && <div className="distance__err">{geoMsg}</div>}

          <div className="distance__radii">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={String(r)}
                className={`distance__radius${radiusMi === r ? ' active' : ''}`}
                onClick={() => setRadiusMi(r)}
              >
                {r == null ? 'Any' : `${r} mi`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
