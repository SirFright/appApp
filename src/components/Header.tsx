import type { ReactNode } from 'react'
import { Zap } from './Icons'

interface Props {
  title: string
  subtitle?: string
  children?: ReactNode
}

export default function Header({ title, subtitle, children }: Props) {
  return (
    <header className="header">
      <div className="header__spark">
        <Zap filled style={{ width: 20, height: 20, color: '#052e29' }} />
      </div>
      <div className="header__title">
        <h1>{title}</h1>
        {subtitle && <span className="sub">{subtitle}</span>}
      </div>
      {children && <div className="header__actions">{children}</div>}
    </header>
  )
}
