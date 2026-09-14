import { useEffect, useState } from 'react'
import type { Contractor } from '../types'
import { useUserState } from '../store/userState'
import {
  APPLY_STAGES,
  STAGE_LABEL,
  STAGE_SHORT,
  addressLines,
  describe,
  eLicenseUrl,
  formatDate,
  mapsUrl,
  normalizeWebsite,
  relativeTime,
  telHref,
  webSearchUrl,
} from '../lib/format'
import {
  Badge,
  Building,
  Calendar,
  Chevron,
  Globe,
  Heart,
  Mail,
  Phone,
  Pin,
  Search as SearchIcon,
} from './Icons'

interface Props {
  c: Contractor
  expanded: boolean
  onToggle: () => void
  onShowOnMap: (c: Contractor) => void
}

function dotColor(opts: {
  isNew: boolean
  fav: boolean
  applied: boolean
}): string {
  if (opts.applied) return 'var(--applied)'
  if (opts.isNew) return 'var(--new)'
  if (opts.fav) return 'var(--favorite)'
  return 'var(--text-faint)'
}

export default function CompanyCard({
  c,
  expanded,
  onToggle,
  onShowOnMap,
}: Props) {
  const { get, toggleFavorite, markViewed, setStage, setNote } = useUserState()
  const rec = get(c.id)
  const isNew = !rec.viewedAt
  const fav = !!rec.favorite
  const stage = rec.application.stage
  const applied = stage !== 'none'
  const [note, setLocalNote] = useState(rec.application.note ?? '')

  // Expanding a card counts as viewing it.
  useEffect(() => {
    if (expanded) markViewed(c.id)
  }, [expanded, c.id, markViewed])

  useEffect(() => {
    setLocalNote(rec.application.note ?? '')
  }, [rec.application.note])

  const addr = addressLines(c)
  const website = normalizeWebsite(c.website)
  const tel = telHref(c.phone)

  return (
    <div
      className={`card${expanded ? ' expanded' : ''}${fav ? ' is-fav' : ''}`}
    >
      <div
        className="card__head"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
      >
        <div className="card__main">
          <div className="card__name">
            <span
              className="dot"
              style={{ background: dotColor({ isNew, fav, applied }) }}
            />
            <span className="clamp2">{c.businessName}</span>
          </div>
          <div className="card__meta">
            <span className="lic">{c.licenseType}</span>
            <span>·</span>
            <span>{c.town}, {c.state}</span>
            {isNew && <span className="pill pill--new">NEW</span>}
          </div>
        </div>

        <div className="card__cols">
          <div className="col">
            <span className="col__label">Viewed</span>
            <span className={`col__value${isNew ? ' dim' : ''}`}>
              {isNew ? 'New' : relativeTime(rec.viewedAt)}
            </span>
          </div>
          <div className="col">
            <span className="col__label">Status</span>
            <span className={`col__value${applied ? '' : ' dim'}`}>
              {applied ? STAGE_SHORT[stage] : '—'}
            </span>
          </div>
        </div>

        <button
          className={`heart${fav ? ' on' : ''}`}
          aria-pressed={fav}
          aria-label={fav ? 'Remove favorite' : 'Add favorite'}
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(c.id)
          }}
        >
          <Heart filled={fav} />
        </button>

        <Chevron className={`chevron${expanded ? ' open' : ''}`} />
      </div>

      {expanded && (
        <div className="card__body">
          {/* Location */}
          <div className="location">
            <Pin />
            <div className="addr">
              <b>{c.businessName}</b>
              {addr.line1}
              <br />
              {addr.line2}
              {c.approxLocation && (
                <div style={{ marginTop: 4 }}>
                  <span className="pill pill--approx">Approx. location</span>
                </div>
              )}
            </div>
          </div>

          {/* License details */}
          <div>
            <div className="section__label">License</div>
            <dl className="kv">
              <dt>Type</dt>
              <dd>{c.licenseTypeLabel}</dd>
              {c.credentialNumber && (
                <>
                  <dt>Credential</dt>
                  <dd>{c.credentialNumber}</dd>
                </>
              )}
              <dt>Status</dt>
              <dd>{c.status}</dd>
              {c.licenseHolder && (
                <>
                  <dt>Holder</dt>
                  <dd>{c.licenseHolder}</dd>
                </>
              )}
              {c.issueDate && (
                <>
                  <dt>Issued</dt>
                  <dd>{formatDate(c.issueDate)}</dd>
                </>
              )}
              {c.expirationDate && (
                <>
                  <dt>Expires</dt>
                  <dd>{formatDate(c.expirationDate)}</dd>
                </>
              )}
            </dl>
          </div>

          {/* Description */}
          <div>
            <div className="section__label">About</div>
            <div className="desc">
              {describe(c)}
              <span className="src-tag">
                {c.source === 'sample'
                  ? '★ Sample record — for demonstration only.'
                  : '↳ Summary generated from the CT license record.'}
              </span>
            </div>
          </div>

          {/* Contact */}
          {(c.phone || website || c.email) && (
            <div>
              <div className="section__label">Contact</div>
              <div className="lookup-links">
                {tel && (
                  <a href={tel}>
                    <Phone /> {c.phone}
                  </a>
                )}
                {website && (
                  <a href={website} target="_blank" rel="noreferrer">
                    <Globe /> Website
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`}>
                    <Mail /> Email
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Research / verify links */}
          <div>
            <div className="section__label">Find out more</div>
            <div className="lookup-links">
              <a href={webSearchUrl(c)} target="_blank" rel="noreferrer">
                <SearchIcon /> Search the web
              </a>
              <a href={mapsUrl(c)} target="_blank" rel="noreferrer">
                <Building /> Open in Maps
              </a>
              <a href={eLicenseUrl()} target="_blank" rel="noreferrer">
                <Badge /> Verify license
              </a>
            </div>
          </div>

          {/* Application tracker */}
          <div>
            <div className="section__label">Your application</div>
            <div className="stage-picker">
              {APPLY_STAGES.map((s) => (
                <button
                  key={s}
                  data-stage={s}
                  className={stage === s ? 'active' : ''}
                  onClick={() => setStage(c.id, stage === s ? 'none' : s)}
                >
                  {STAGE_LABEL[s]}
                </button>
              ))}
            </div>
            {applied && rec.application.appliedAt && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Calendar style={{ width: 14, height: 14 }} />
                {STAGE_LABEL[stage]} · updated {(() => {
                  const rel = relativeTime(rec.application.updatedAt)
                  return rel === 'now' ? 'just now' : `${rel} ago`
                })()}
              </div>
            )}
            <textarea
              className="note-input"
              style={{ marginTop: 10 }}
              placeholder="Private notes — who you spoke with, next steps…"
              value={note}
              onChange={(e) => setLocalNote(e.target.value)}
              onBlur={() => setNote(c.id, note)}
            />
          </div>

          {/* Actions */}
          <div className="actions-row">
            <button className="btn btn--primary" onClick={() => onShowOnMap(c)}>
              <Pin /> Show on map
            </button>
            <button
              className={`btn${fav ? '' : ' btn--ghost'}`}
              onClick={() => toggleFavorite(c.id)}
            >
              <Heart filled={fav} /> {fav ? 'Favorited' : 'Favorite'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
