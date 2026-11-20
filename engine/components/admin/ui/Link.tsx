import type { ReactNode } from 'react'
import './admin-ui.css'

type LinkVariant = 'nav' | 'default'

interface LinkProps {
  href: string
  children: ReactNode
  variant?: LinkVariant
  target?: '_blank'
  rel?: string
  className?: string
}

export function Link({
  href,
  children,
  variant = 'default',
  target,
  rel,
  className,
}: LinkProps) {
  const cls = variant === 'nav' ? 'aui-nav-link' : 'aui-link'
  return (
    <a
      href={href}
      target={target}
      rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
      className={`${cls}${className ? ` ${className}` : ''}`}
    >
      {children}
    </a>
  )
}
