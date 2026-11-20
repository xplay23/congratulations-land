import { C } from './tokens'
import { fmt } from './utils'

export type ProgressStatus = 'idle' | 'running' | 'paused' | 'done' | 'error'

interface ProgressBarProps {
  value: number
  total: number
  status: ProgressStatus
  label?: string
}

const STATUS_COLOR: Record<ProgressStatus, string> = {
  idle:    'var(--theme-elevation-300)',
  running: C.blue,
  paused:  C.amber,
  done:    C.green,
  error:   C.red,
}

export function ProgressBar({ value, total, status, label }: ProgressBarProps) {
  const pct   = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
  const color = STATUS_COLOR[status]

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', gap: '8px' }}>
        {label && (
          <span style={{ fontSize: 'var(--adm-fs-caption)', color: C.muted, opacity: 0.7 }}>{label}</span>
        )}
        <span style={{ fontSize: 'var(--adm-fs-caption)', fontWeight: 700, color, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
          {fmt(value)} / {fmt(total)}
          <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: '6px' }}>{pct}%</span>
        </span>
      </div>

      <div style={{ height: '6px', borderRadius: '3px', background: 'var(--theme-elevation-150)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: '3px',
          background: color,
          transition: 'width 0.3s ease, background 0.3s',
        }} />
      </div>
    </div>
  )
}
