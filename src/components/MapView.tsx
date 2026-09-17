import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Contractor } from '../types'
import { useUserState } from '../store/userState'
import { useFilters } from '../state/filters'
import { CT_CENTER } from '../data/ctTowns'
import { formatMiles, type NamedPlace } from '../lib/geo'

export interface PinStatus {
  color: string
  key: string
}

function statusOf(rec: {
  favorite?: boolean
  viewedAt?: number
  application: { stage: string }
}): PinStatus {
  const applied = rec.application.stage !== 'none'
  if (applied) return { color: '#37c46b', key: 'applied' }
  if (rec.favorite) return { color: '#ffca45', key: 'favorite' }
  if (!rec.viewedAt) return { color: '#38bdf8', key: 'new' }
  return { color: '#8b97a7', key: 'viewed' }
}

const iconCache = new Map<string, L.DivIcon>()
function pinIcon(color: string): L.DivIcon {
  const cached = iconCache.get(color)
  if (cached) return cached
  const html = `<div class="pin"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C7.9 2 4.5 5.4 4.5 9.5c0 5 7.5 12 7.5 12s7.5-7 7.5-12C19.5 5.4 16.1 2 12 2z"
      fill="${color}" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>
    <circle cx="12" cy="9.5" r="3" fill="#0e1116"/></svg></div>`
  const icon = L.divIcon({
    className: 'pin-wrap',
    html,
    iconSize: [28, 28],
    iconAnchor: [14, 27],
    popupAnchor: [0, -24],
  })
  iconCache.set(color, icon)
  return icon
}

const centerIcon = L.divIcon({
  className: 'center-pin',
  html: '<div class="center-dot"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function FlyController({
  items,
  focusId,
  markers,
  onConsumed,
}: {
  items: Contractor[]
  focusId: string | null
  markers: MutableRefObject<Map<string, L.Marker>>
  onConsumed: () => void
}) {
  const map = useMap()
  useEffect(() => {
    if (!focusId) return
    const c = items.find((i) => i.id === focusId)
    if (c) {
      map.flyTo([c.lat, c.lng], Math.max(map.getZoom(), 13), { duration: 0.7 })
      const m = markers.current.get(focusId)
      if (m) window.setTimeout(() => m.openPopup(), 450)
    }
    onConsumed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])
  return null
}

function CenterController({
  center,
  radiusMi,
}: {
  center: NamedPlace | null
  radiusMi: number | null
}) {
  const map = useMap()
  useEffect(() => {
    if (!center) return
    if (radiusMi != null) {
      const bounds = L.latLng(center.lat, center.lng).toBounds(
        radiusMi * 1609.34 * 2,
      )
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 })
    } else {
      map.flyTo([center.lat, center.lng], 10, { duration: 0.6 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng, radiusMi])
  return null
}

interface Props {
  items: Contractor[]
  focusId: string | null
  onFocusConsumed: () => void
  onDetails: (c: Contractor) => void
}

export default function MapView({
  items,
  focusId,
  onFocusConsumed,
  onDetails,
}: Props) {
  const { state, get, toggleFavorite } = useUserState()
  const { center, radiusMi } = useFilters()
  const markers = useRef<Map<string, L.Marker>>(new Map())

  const decorated = useMemo(
    () => items.map((c) => ({ c, status: statusOf(get(c.id)) })),
    [items, state, get],
  )

  return (
    <MapContainer
      center={CT_CENTER}
      zoom={9}
      minZoom={7}
      maxZoom={18}
      zoomControl={false}
      className="leaflet-container"
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <FlyController
        items={items}
        focusId={focusId}
        markers={markers}
        onConsumed={onFocusConsumed}
      />
      <CenterController center={center} radiusMi={radiusMi} />

      {center && radiusMi != null && (
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusMi * 1609.34}
          pathOptions={{
            color: '#38bdf8',
            weight: 1.5,
            fillColor: '#38bdf8',
            fillOpacity: 0.08,
          }}
        />
      )}
      {center && <Marker position={[center.lat, center.lng]} icon={centerIcon} />}

      {decorated.map(({ c, status }) => {
        const rec = get(c.id)
        const fav = !!rec.favorite
        return (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            icon={pinIcon(status.color)}
            ref={(m) => {
              if (m) markers.current.set(c.id, m as unknown as L.Marker)
              else markers.current.delete(c.id)
            }}
          >
            <Popup>
              <div className="popup-card">
                <div className="pc-name">{c.businessName}</div>
                <div className="pc-meta">
                  <span className="pc-lic">{c.licenseType}</span> ·{' '}
                  {c.town}, {c.state}
                  {c.approxLocation ? ' · approx.' : ''}
                </div>
                {c.distanceMi != null && (
                  <div className="pc-meta">
                    📍 {formatMiles(c.distanceMi)}
                    {center ? ` from ${center.label}` : ''}
                  </div>
                )}
                <div className="pc-meta">{c.status} license</div>
                <div className="pc-actions">
                  <button
                    className={fav ? 'on' : ''}
                    onClick={() => toggleFavorite(c.id)}
                  >
                    {fav ? '♥ Favorited' : '♡ Favorite'}
                  </button>
                  <button className="primary" onClick={() => onDetails(c)}>
                    Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
