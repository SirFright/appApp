import { NavLink } from 'react-router-dom'
import { MapIcon, ListIcon } from './Icons'

export default function BottomNav() {
  return (
    <nav className="nav" aria-label="Primary">
      <NavLink
        to="/companies"
        className={({ isActive }) => `nav__item${isActive ? ' active' : ''}`}
      >
        <ListIcon />
        <span>Companies</span>
      </NavLink>
      <NavLink
        to="/map"
        className={({ isActive }) => `nav__item${isActive ? ' active' : ''}`}
      >
        <MapIcon />
        <span>Map</span>
      </NavLink>
    </nav>
  )
}
