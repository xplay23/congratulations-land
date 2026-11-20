import { C } from './tokens'
import { fmt } from './utils'

interface StatCardProps {
  label: string
  value: number
  color?: string
  icon?: string
}

const SAFE_HEX = /^#[0-9a-fA-F]{3,8}$/

function tint(color: string, alphaHex: string): string {
  return SAFE_HEX.test(color) ? color + alphaHex : 'rgba(255,255,255,0.06)'
}

export function StatCard({ label, value, color = C.text, icon }: StatCardProps) {
  return (
    <div style={{
      padding: '16px 20px',
      background: tint(color, '0c'),
      border: `1px solid ${tint(color, '25')}`,
      borderRadius: 'var(--adm-radius)',
      textAlign: 'center',
    }}>
      {icon && (
        <div style={{ fontSize: '20px', marginBottom: '6px', opacity: 0.8 }}>{icon}</div>
      )}
      <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color, lineHeight: 1.1 }}>
        {fmt(value)}
      </div>
      <div style={{ fontSize: 'var(--adm-fs-label)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color, opacity: 0.6, marginTop: '4px' }}>
        {label}
      </div>
    </div>
  )
}
