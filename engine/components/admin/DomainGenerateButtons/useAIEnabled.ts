'use client'

import { useEffect, useState } from 'react'

type AIStatus = { enabled: boolean; imageEnabled: boolean }

// Module-level cache — shared across all button instances on the same page
let cache: AIStatus | null = null
let fetchPromise: Promise<AIStatus> | null = null

async function fetchAIStatus(): Promise<AIStatus> {
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/ai/status')
    .then((r) => r.json())
    .then((d: unknown) => {
      const obj = typeof d === 'object' && d !== null ? (d as Record<string, unknown>) : {}
      const status: AIStatus = {
        enabled: Boolean(obj.enabled),
        imageEnabled: Boolean(obj.imageEnabled),
      }
      cache = status
      return status
    })
    .catch(() => {
      cache = { enabled: false, imageEnabled: false }
      return cache
    })
  return fetchPromise
}

export function useAIEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(cache?.enabled ?? null)

  useEffect(() => {
    if (cache !== null) {
      setEnabled(cache.enabled)
      return
    }
    fetchAIStatus().then((s) => setEnabled(s.enabled))
  }, [])

  return enabled
}

export function useImageEnabled(): boolean | null {
  const [imageEnabled, setImageEnabled] = useState<boolean | null>(cache?.imageEnabled ?? null)

  useEffect(() => {
    if (cache !== null) {
      setImageEnabled(cache.imageEnabled)
      return
    }
    fetchAIStatus().then((s) => setImageEnabled(s.imageEnabled))
  }, [])

  return imageEnabled
}
