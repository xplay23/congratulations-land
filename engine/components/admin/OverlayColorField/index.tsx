'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
import { GRAYSCALE_PRESETS } from '@engine/lib/admin/color-presets'

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

// ── OverlayColorField ─────────────────────────────────────────────────────────
// Grayscale-preset palette + hex input + native color wheel, for a background
// image darkening overlay. Custom (non-gray) colors remain fully allowed via
// the hex input / native picker — only the preset swatches are restricted.

export function OverlayColorField({ field, path }: TextFieldClientProps) {
  const fieldPath = path ?? (field as { name: string }).name
  const { value, setValue } = useField<string>({ path: fieldPath })

  const raw = (value ?? '').trim()
  const normalized = normalizeHex(raw)
  const valid = isValidHex(normalized)
  const displayColor = valid ? normalized : '#000000'

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
    setPaletteOpen(false)
  }, [setValue])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setInputVal(v)
    const n = normalizeHex(v)
    if (isValidHex(n)) setValue(n)
  }

  function handleInputBlur() {
    const trimmed = inputVal.trim()
    if (trimmed === '') {
      setValue('')
      return
    }
    const n = normalizeHex(trimmed)
    if (isValidHex(n)) {
      setInputVal(n)
      setValue(n)
    } else {
      setInputVal(raw)
    }
  }

  function clear() {
    setValue('')
    setInputVal('')
  }

  const label = (field as { label?: string }).label ?? 'Overlay Color'

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--theme-text)', marginBottom: '8px' }}>
        {label}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Swatch — opens palette */}
        <button
          type="button"
          title="Open color palette"
          onClick={() => setPaletteOpen((o) => !o)}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            border: valid ? '2px solid var(--theme-elevation-300)' : '2px dashed var(--theme-elevation-300)',
            background: displayColor,
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
          }}
        />

        {/* Hex text input */}
        <input
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="#000000"
          maxLength={7}
          spellCheck={false}
          style={{
            flex: 1,
            height: '38px',
            padding: '0 12px',
            fontSize: '13px',
            fontFamily: 'monospace',
            background: 'var(--theme-elevation-50)',
            border: valid || !inputVal ? '1px solid var(--theme-elevation-300)' : '1px solid #ef4444',
            borderRadius: '6px',
            color: valid ? displayColor : 'var(--theme-elevation-500)',
            outline: 'none',
            letterSpacing: '0.05em',
          }}
        />

        {/* Native color wheel — full color range, not limited to the gray presets */}
        <button
          type="button"
          title="Open color wheel"
          onClick={() => pickerRef.current?.click()}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '6px',
            border: '1px solid var(--theme-elevation-200)',
            background: 'var(--theme-elevation-50)',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
          }}
        >
          🎨
        </button>

        {/* Clear — reset to default (black) */}
        {raw && (
          <button
            type="button"
            onClick={clear}
            title="Reset to default color"
            style={{
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              border: '1px solid var(--theme-elevation-200)',
              background: 'var(--theme-elevation-50)',
              color: 'var(--theme-elevation-500)',
              cursor: 'pointer',
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        )}

        {/* Hidden native color input — unrestricted, any color */}
        <input
          ref={pickerRef}
          type="color"
          value={displayColor}
          onChange={(e) => applyColor(e.target.value)}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          tabIndex={-1}
        />
      </div>

      {/* Grayscale preset popover */}
      {paletteOpen && (
        <div
          ref={popoverRef}
          style={{
            marginTop: '10px',
            padding: '14px',
            background: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            maxWidth: '320px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--theme-elevation-400)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Preset Colors
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {GRAYSCALE_PRESETS.map((preset) => {
              const selected = normalized === preset
              return (
                <button
                  key={preset}
                  type="button"
                  title={preset}
                  onClick={() => applyColor(preset)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: preset,
                    border: selected ? '2px solid var(--theme-elevation-800)' : '1px solid rgba(128,128,128,0.25)',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                    position: 'relative',
                    transform: selected ? 'scale(1.18)' : 'scale(1)',
                    transition: 'transform 0.1s',
                  }}
                >
                  {selected && (
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: isDark(preset) ? '#fff' : '#000',
                        lineHeight: 1,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default OverlayColorField
