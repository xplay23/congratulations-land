'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'

export function AiDisabledWarning() {
  const enabled = useFormFields(([f]) => f['enabled']?.value) as boolean | undefined

  if (enabled) return null

  return (
    <div style={{
      marginBottom: '8px',
      padding: '10px 14px',
      backgroundColor: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.35)',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      fontSize: '12px',
      lineHeight: 1.55,
      color: '#ef4444',
    }}>
      <span style={{ flexShrink: 0, fontWeight: 700 }}>✕</span>
      <span>
        <strong>AI generation is disabled.</strong> All Generate buttons are hidden on the site.
        Enable the Master switch above and configure a provider to use AI features.
      </span>
    </div>
  )
}
