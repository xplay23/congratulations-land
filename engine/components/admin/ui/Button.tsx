import type { ReactNode, MouseEvent } from 'react'
import './admin-ui.css'

type Variant = 'primary' | 'ghost' | 'success' | 'danger'

interface ButtonProps {
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  variant?: Variant
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  type = 'button',
  className,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`aui-btn aui-btn--${variant}${className ? ` ${className}` : ''}`}
    >
      {children}
    </button>
  )
}
