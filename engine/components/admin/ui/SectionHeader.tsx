import type { ReactNode } from 'react'
import { C } from './tokens'

interface SectionHeaderProps {
  title: string
  linkHref?: string
  linkLabel?: string
}

export function SectionHeader({ title, linkHref, linkLabel }: SectionHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '14px',
    }}>
      <span style={{
        fontSize: 'var(--adm-fs-label)',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
        color: C.muted,
        opacity: 0.55,
      }}>
        {title}
      </span>
      {linkHref && (
        <a href={linkHref} className="aui-nav-link">
          {linkLabel ?? 'View all →'}
        </a>
      )}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontSize: 'var(--adm-fs-label)',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
      color: C.muted,
      opacity: 0.55,
      marginBottom: '14px',
    }}>
      {children}
    </div>
  )
}
