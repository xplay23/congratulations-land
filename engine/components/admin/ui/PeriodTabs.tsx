import { C } from './tokens'

export type Period = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom'

const ALL_TABS: { id: Period; label: string; short: string }[] = [
  { id: 'today',     label: 'Today',     short: 'Today' },
  { id: 'yesterday', label: 'Yesterday', short: 'Yest.' },
  { id: '7d',        label: '7 days',    short: '7d' },
  { id: '30d',       label: '30 days',   short: '30d' },
  { id: '90d',       label: '90 days',   short: '90d' },
  { id: 'custom',    label: 'Custom',    short: 'Custom' },
]

interface PeriodTabsProps {
  period: Period
  onChange: (p: Period) => void
  showCustom?: boolean
}

export function PeriodTabs({ period, onChange, showCustom = false }: PeriodTabsProps) {
  const tabs = showCustom ? ALL_TABS : ALL_TABS.filter((t) => t.id !== 'custom')

  return (
    <div className="aui-scroll-x" style={{
      display: 'flex',
      gap: '0.125rem',
      background: 'var(--theme-elevation-100)',
      borderRadius: '0.5rem',
      padding: '0.25rem',
      border: `1px solid ${C.cardBorder}`,
    }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`aui-period-tab${period === t.id ? ' aui-period-tab--active' : ''}`}
          style={{ flexShrink: 0 }}
        >
          <span className="aui-period-tab__full">{t.label}</span>
          <span className="aui-period-tab__short">{t.short}</span>
        </button>
      ))}
    </div>
  )
}
