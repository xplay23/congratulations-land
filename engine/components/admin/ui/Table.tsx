'use client'
import { useState, type ReactNode } from 'react'
import { C } from './tokens'

// ── Hoverable table row ───────────────────────────────────────────────────────

export function TrHover({ children, last }: { children: ReactNode; last: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: last ? 'none' : `1px solid ${C.cardBorder}`,
        background: hovered ? 'var(--theme-elevation-100)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {children}
    </tr>
  )
}

// ── Sortable table header cell ────────────────────────────────────────────────

interface ThSortProps<T extends string> {
  col: T
  label: string
  sortCol: T
  sortDir: 'asc' | 'desc'
  onSort: (col: T) => void
}

export function ThSort<T extends string>({ col, label, sortCol, sortDir, onSort }: ThSortProps<T>) {
  const [hovered, setHovered] = useState(false)
  const active = sortCol === col
  return (
    <th
      onClick={() => onSort(col)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '0.75rem 1rem',
        fontSize: '0.625rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: active ? C.blue : C.muted,
        opacity: active ? 1 : hovered ? 0.7 : 0.4,
        textAlign: 'left',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        transition: 'opacity 0.15s, color 0.15s',
      }}
    >
      {label}{active ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
    </th>
  )
}

// ── Sortable header cell for CSS Grid-based tables (not a real <table>) ────────

interface GridThSortProps<T extends string> {
  col: T
  label: string
  sortCol: T | null
  sortDir: 'asc' | 'desc'
  onSort: (col: T) => void
}

export function GridThSort<T extends string>({ col, label, sortCol, sortDir, onSort }: GridThSortProps<T>) {
  const [hovered, setHovered] = useState(false)
  const active = sortCol === col
  return (
    <span
      onClick={() => onSort(col)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="adm-label"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        color: active ? C.blue : C.muted,
        opacity: active ? 1 : hovered ? 0.7 : 0.4,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'opacity 0.15s, color 0.15s',
      }}
    >
      {label}
      {active && <span aria-hidden="true">{sortDir === 'desc' ? '↓' : '↑'}</span>}
    </span>
  )
}
