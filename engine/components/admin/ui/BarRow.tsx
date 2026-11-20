import type { ReactNode } from 'react'
import { C } from './tokens'
import { fmt } from './utils'

interface BarRowProps {
  label: ReactNode
  pct: number
  color: string
  count?: number
}

export function BarRow({ label, pct, color, count }: BarRowProps) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '6px',
        gap: '8px',
      }}>
        <span style={{
          fontSize: 'var(--adm-fs-caption)',
          color: C.text,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {label}
        </span>
        <span style={{
          fontSize: 'var(--adm-fs-badge)',
          color: C.muted,
          opacity: 0.5,
          flexShrink: 0,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {count !== undefined ? `${fmt(count)} · ` : ''}{pct}%
        </span>
      </div>
      <div style={{ height: '5px', borderRadius: '3px', background: 'var(--theme-elevation-150)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: '3px',
          background: color,
          opacity: 0.75,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}
