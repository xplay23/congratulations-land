import type { ChangeEvent, KeyboardEvent } from 'react'

interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'search'
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  className?: string
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

export function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  min,
  max,
  step,
  className,
  onKeyDown,
}: InputProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
  }

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      onKeyDown={onKeyDown}
      className={`aui-input${className ? ` ${className}` : ''}`}
    />
  )
}
