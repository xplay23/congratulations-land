'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'
import type { NumberFieldClientProps } from 'payload'

// ── OpacitySliderField ────────────────────────────────────────────────────────
// Native range input (0–100) with a live percentage readout.

export function OpacitySliderField({ field, path }: NumberFieldClientProps) {
  const fieldPath = path ?? (field as { name: string }).name
  const { value, setValue } = useField<number>({ path: fieldPath })

  const pct = typeof value === 'number' ? value : 0
  const label = (field as { label?: string }).label ?? 'Opacity'

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--theme-text)' }}>{label}</div>
        <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--theme-elevation-500)' }}>{pct}%</div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ width: '100%', cursor: 'pointer' }}
      />
    </div>
  )
}

export default OpacitySliderField
