'use client'
import { useEffect, useRef } from 'react'
import { C } from './tokens'

export type LogEntryStatus = 'ok' | 'error' | 'skip' | 'warn' | 'pending'

export interface LogEntry {
  id: string | number
  status: LogEntryStatus
  label: string
  message: string
  warning?: string
}

interface LiveLogProps {
  entries: LogEntry[]
  maxHeight?: string
  autoScroll?: boolean
}

const STATUS_ICON: Record<LogEntryStatus, string> = {
  ok:      '✓',
  error:   '✕',
  skip:    '—',
  warn:    '⚠',
  pending: '⟳',
}

const STATUS_COLOR: Record<LogEntryStatus, string> = {
  ok:      C.green,
  error:   C.red,
  skip:    'rgba(255,255,255,0.3)',
  warn:    C.amber,
  pending: C.blue,
}

export function LiveLog({ entries, maxHeight = '320px', autoScroll = true }: LiveLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ block: 'nearest' })
    }
  }, [entries, autoScroll])

  if (!entries.length) {
    return (
      <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontSize: 'var(--adm-fs-caption)', fontFamily: 'monospace' }}>
        Waiting…
      </div>
    )
  }

  return (
    <div style={{ maxHeight, overflowY: 'auto', fontFamily: 'monospace', fontSize: 'var(--adm-fs-caption)' }}>
      {entries.map((entry) => {
        const color = STATUS_COLOR[entry.status]
        return (
          <div
            key={entry.id}
            style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '2px 0', borderBottom: `1px solid ${C.cardBorder}` }}
          >
            <span style={{ color, flexShrink: 0, width: '12px', textAlign: 'center', fontSize: 'var(--adm-fs-badge)' }}>
              {STATUS_ICON[entry.status]}
            </span>
            <span style={{ color: C.text, fontWeight: 500, flexShrink: 0, minWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.label}
            </span>
            <span style={{ color: C.muted, opacity: 0.65, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.message}
            </span>
            {entry.warning && (
              <span style={{ color: C.amber, flexShrink: 0, fontSize: 'var(--adm-fs-badge)' }} title={entry.warning}>⚠</span>
            )}
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
