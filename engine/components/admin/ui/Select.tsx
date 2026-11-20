import type { ChangeEvent } from 'react'
import { C } from './tokens'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function Select({ options, value, onChange, placeholder, disabled, className }: SelectProps) {
  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value)
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={`aui-select${className ? ` ${className}` : ''}`}
    >
      {placeholder && (
        <option value="" disabled>{placeholder}</option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
