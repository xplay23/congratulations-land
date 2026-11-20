import type { ReactNode } from 'react'
import './admin-ui.css'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  disabled?: boolean
  indeterminate?: boolean  // for "select all" partial state
}

export function Checkbox({ checked, onChange, label, disabled, indeterminate }: CheckboxProps) {
  return (
    <label className={`aui-checkbox${disabled ? ' aui-checkbox--disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        ref={(el) => { if (el) el.indeterminate = indeterminate ?? false }}
        onChange={(e) => onChange(e.target.checked)}
        style={{ display: 'none' }}
      />
      <span className={`aui-checkbox__box${checked || indeterminate ? ' aui-checkbox__box--checked' : ''}`}>
        {indeterminate ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M1.5 5h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : checked ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M1.5 5.2l2.4 2.4 4.6-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      {label && <span className="aui-checkbox__label">{label}</span>}
    </label>
  )
}
