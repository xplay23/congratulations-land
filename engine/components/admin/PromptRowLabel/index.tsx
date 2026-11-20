'use client'

import React from 'react'
import { useRowLabel } from '@payloadcms/ui'

export default function PromptRowLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string; type?: string }>()

  const text = data?.label || data?.type || `Prompt ${String(rowNumber).padStart(2, '0')}`

  return <span>{text}</span>
}
