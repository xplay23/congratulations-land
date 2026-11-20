import type { ReactNode, CSSProperties } from 'react'
import { C } from './tokens'

interface CardProps {
  children: ReactNode
  style?: CSSProperties
  accent?: string
}

export function Card({ children, style, accent }: CardProps) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${accent ? accent + '30' : C.cardBorder}`,
      borderRadius: '0.75rem',
      padding: '1.25rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      ...(accent ? { boxShadow: `0 0 0 1px ${accent}18 inset` } : {}),
      ...style,
    }}>
      {accent && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
          borderRadius: '0.75rem 0.75rem 0 0',
        }} />
      )}
      {children}
    </div>
  )
}
