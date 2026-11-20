'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

// ── Color Presets ─────────────────────────────────────────────────────────────

const PRESETS = [
  '#ef4444', '#dc2626', '#b91c1c',
  '#f97316', '#ea580c', '#fb923c',
  '#eab308', '#f59e0b', '#fbbf24',
  '#22c55e', '#16a34a', '#4ade80',
  '#14b8a6', '#0891b2', '#22d3ee',
  '#3b82f6', '#2563eb', '#1d4ed8',
  '#6366f1', '#7c3aed', '#a78bfa',
  '#ec4899', '#db2777', '#f43f5e',
  '#ffffff', '#d1d5db', '#6b7280', '#374151', '#111827',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const HEX_6 = /^#[0-9a-fA-F]{6}$/

function isValidHex(v: string): boolean {
  return HEX_6.test(v.trim())
}

function normalizeHex(v: string): string {
  const s = v.trim()
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`
  }
  return s
}

function isDark(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
}

// ── SiteColorPickerField ──────────────────────────────────────────────────────
// Color picker for site settings — same UI as CategoryColorField, no AI button.

export function SiteColorPickerField({ field, path }: TextFieldClientProps) {
  const fieldPath = path ?? (field as { name: string }).name
  const { value, setValue } = useField<string>({ path: fieldPath })

  const raw = (value ?? '').trim()
  const normalized = normalizeHex(raw)
  const valid = isValidHex(normalized)
  const displayColor = valid ? normalized : '#888888'

  const [inputVal, setInputVal] = useState(raw)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const pickerRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputVal((value ?? '').trim())
  }, [value])

  useEffect(() => {
    if (!paletteOpen) return
    function handleOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPaletteOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [paletteOpen])

  const applyColor = useCallback((hex: string) => {
    setValue(hex)
    setInputVal(hex)
  }, [setValue])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setInputVal(v)
    const n = normalizeHex(v)
    if (isValidHex(n)) setValue(n)
  }

  function handleInputBlur() {
    const n = normalizeHex(inputVal)
    if (isValidHex(n)) {
      setInputVal(n)
      setValue(n)
    } else {
      setInputVal(raw)
    }
  }

  const label = (field as { label?: string }).label ?? fieldPath
  // Field's own configured default — '' for fields with no defaultValue
  // (e.g. badgeColor, where empty means "fall back to the category color"),
  // a real hex for fields that always need one (buyNowColor etc). Resetting
  // to THIS instead of always to '' means the button is safe on every field
  // that uses this component, not just ones designed around an empty state.
  const defaultHex = ((field as { defaultValue?: string }).defaultValue ?? '').trim()
  const canReset = raw !== defaultHex

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Label */}
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--theme-text)', marginBottom: '8px' }}>
        {label}
        {(field as { required?: boolean }).required && (
          <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
        )}
      </div>

      {/* Main control row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Big swatch — opens palette */}
        <button
          type="button"
          title="Open color palette"
          onClick={() => setPaletteOpen((o) => !o)}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            border: valid ? '2px solid var(--theme-elevation-300)' : '2px dashed var(--theme-elevation-300)',
            background: displayColor,
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
            boxShadow: valid ? `0 0 0 3px ${displayColor}44` : 'none',
            transition: 'box-shadow 0.15s',
          }}
        />

        {/* Hex text input */}
        <input
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="#e8c84a"
          maxLength={7}
          spellCheck={false}
          style={{
            flex: 1,
            height: '44px',
            padding: '0 12px',
            fontSize: '14px',
            fontFamily: 'monospace',
            background: 'var(--theme-elevation-50)',
            border: valid || !inputVal ? '1px solid var(--theme-elevation-300)' : '1px solid #ef4444',
            borderRadius: '6px',
            color: valid ? displayColor : 'var(--theme-elevation-500)',
            outline: 'none',
            letterSpacing: '0.05em',
          }}
        />

        {/* Native color wheel */}
        <button
          type="button"
          title="Open color wheel"
          onClick={() => pickerRef.current?.click()}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '6px',
            border: '1px solid var(--theme-elevation-200)',
            background: 'var(--theme-elevation-50)',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = 'var(--theme-elevation-200)'; b.style.borderColor = 'var(--theme-elevation-400)' }}
          onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = 'var(--theme-elevation-50)'; b.style.borderColor = 'var(--theme-elevation-200)' }}
        >
          🎨
        </button>

        {/* Hidden native color input */}
        <input
          ref={pickerRef}
          type="color"
          value={valid ? displayColor : '#888888'}
          onChange={(e) => applyColor(e.target.value)}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          tabIndex={-1}
        />

        {/* Reset to field default (empty for fields with no defaultValue —
            i.e. "use the fallback color", the whole point of this button) */}
        {canReset && (
          <button
            type="button"
            title={defaultHex ? `Reset to default (${defaultHex})` : 'Reset to default (use fallback color)'}
            onClick={() => applyColor(defaultHex)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '6px',
              border: '1px solid var(--theme-elevation-200)',
              background: 'var(--theme-elevation-50)',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: 'var(--theme-elevation-500)',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = 'var(--theme-elevation-200)'; b.style.borderColor = 'var(--theme-elevation-400)' }}
            onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = 'var(--theme-elevation-50)'; b.style.borderColor = 'var(--theme-elevation-200)' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Color palette popover */}
      {paletteOpen && (
        <div
          ref={popoverRef}
          style={{
            marginTop: '10px',
            padding: '14px',
            background: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
            maxWidth: '320px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--theme-elevation-400)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Preset Colors
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PRESETS.map((preset) => {
              const selected = normalized === preset
              return (
                <button
                  key={preset}
                  type="button"
                  title={preset}
                  onClick={() => { applyColor(preset); setPaletteOpen(false) }}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    background: preset,
                    border: selected ? '2px solid var(--theme-elevation-800)' : '1px solid rgba(128,128,128,0.25)',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                    position: 'relative',
                    transform: selected ? 'scale(1.18)' : 'scale(1)',
                    transition: 'transform 0.1s',
                    boxShadow: selected ? `0 0 0 2px ${preset}99` : 'none',
                  }}
                >
                  {selected && (
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      color: isDark(preset) ? '#fff' : '#000',
                      lineHeight: 1,
                    }}>
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Preview gradient bar */}
      {valid && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            height: '3px',
            flex: 1,
            borderRadius: '2px',
            background: `linear-gradient(to right, ${displayColor}22, ${displayColor})`,
          }} />
          <span style={{ fontSize: '11px', color: 'var(--theme-elevation-400)', fontFamily: 'monospace' }}>
            {displayColor}
          </span>
        </div>
      )}
    </div>
  )
}

export default SiteColorPickerField
