import { C, EVENT_META } from './tokens'

// ── Status badge (domain status: available, sold, pending…) ──────────────────

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  available:   { bg: '#10b98118', color: '#10b981' },
  sold:        { bg: '#ef444418', color: '#ef4444' },
  pending:     { bg: '#f59e0b18', color: '#f59e0b' },
  transferred: { bg: '#8b5cf618', color: '#8b5cf6' },
  accepted:    { bg: '#10b98118', color: '#10b981' },
  rejected:    { bg: '#ef444418', color: '#ef4444' },
  countered:   { bg: '#8b5cf618', color: '#8b5cf6' },
}

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span style={{ opacity: 0.3 }}>—</span>
  const s = STATUS_STYLES[status] ?? { bg: 'var(--theme-elevation-150)', color: C.muted }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 'var(--adm-radius-pill)',
      fontSize: 'var(--adm-fs-badge)',
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      textTransform: 'capitalize',
      letterSpacing: '0.02em',
    }}>
      {status}
    </span>
  )
}

// ── Event badge (domain_view, offer_submit, inquiry_submit…) ─────────────────

export function EventBadge({ type }: { type: string }) {
  const meta = EVENT_META[type] ?? { label: type, color: '#6b7280' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 'var(--adm-radius-sm)',
      fontSize: 'var(--adm-fs-badge)',
      fontWeight: 700,
      background: meta.color + '18',
      color: meta.color,
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
    }}>
      {meta.label}
    </span>
  )
}
