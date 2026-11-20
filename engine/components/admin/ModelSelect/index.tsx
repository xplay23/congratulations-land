'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useFormFields, useField } from '@payloadcms/ui'

type Provider = 'openai' | 'anthropic' | 'google'

type ApiError = { message: string; providerStatus?: number }

const ERROR_HINTS: Record<number, string> = {
  401: 'Invalid or revoked API key. Double-check the key on your provider dashboard.',
  403: "Your API key doesn't have permission to list models. Check your key's scopes.",
  429: 'Rate limit or quota exceeded. Check your billing and usage limits.',
  500: 'The provider is experiencing an outage. Try again later.',
  502: 'Could not reach the provider. Check your internet connection.',
  503: 'The provider service is temporarily unavailable. Try again later.',
}

const PROVIDER_LINKS: Record<Provider, { dashboard: string; label: string }> = {
  openai: { dashboard: 'https://platform.openai.com/api-keys', label: 'OpenAI dashboard' },
  anthropic: { dashboard: 'https://console.anthropic.com/settings/keys', label: 'Anthropic console' },
  google: { dashboard: 'https://aistudio.google.com/apikey', label: 'Google AI Studio' },
}

const IMAGE_MODEL_DOCS: Record<'openai' | 'google', { link: string; label: string }> = {
  openai: {
    link: 'https://developers.openai.com/api/docs/models',
    label: 'OpenAI image generation models',
  },
  google: {
    link: 'https://ai.google.dev/gemini-api/docs/models',
    label: 'Google Gemini image generation models',
  },
}

function ErrorBanner({ err, provider }: { err: ApiError; provider?: Provider }) {
  const hint = err.providerStatus ? ERROR_HINTS[err.providerStatus] : undefined
  const link = provider ? PROVIDER_LINKS[provider] : undefined
  return (
    <div style={{ background: '#2d1515', border: '1px solid #7f1d1d', borderRadius: '6px', padding: '10px 14px', marginTop: '10px', fontSize: '12px', lineHeight: '1.6', color: '#fca5a5' }}>
      <strong style={{ fontSize: '13px', color: '#f87171', display: 'block', marginBottom: '4px' }}>
        Failed to load models
        {err.providerStatus ? <span style={{ fontWeight: 400, marginLeft: '8px', color: '#fca5a5' }}>· HTTP {err.providerStatus}</span> : null}
      </strong>
      <div style={{ color: '#fde8e8', fontStyle: 'italic' }}>&ldquo;{err.message}&rdquo;</div>
      {hint && <div style={{ marginTop: '6px', color: '#fde8e8' }}>💡 {hint}</div>}
      {link && (
        <div style={{ marginTop: '6px' }}>
          <a href={link.dashboard} target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd' }}>
            → Go to {link.label}
          </a>
        </div>
      )}
    </div>
  )
}

function ImageModelWarning({ provider }: { provider?: Provider }) {
  const docs = provider === 'openai' || provider === 'google' ? IMAGE_MODEL_DOCS[provider] : null
  return (
    <div style={{ background: '#2d1515', border: '1px solid #b91c1c', borderRadius: '6px', padding: '10px 14px', marginTop: '10px', fontSize: '12px', lineHeight: '1.6', color: '#fca5a5' }}>
      <strong style={{ fontSize: '13px', color: '#f87171', display: 'block', marginBottom: '4px' }}>
        ⚠ You must select a model that supports image generation
      </strong>
      <div style={{ color: '#fde8e8' }}>
        Not all models can generate images. Pick one that explicitly supports text-to-image output,
        otherwise image generation will fail.
      </div>
      {docs && (
        <div style={{ marginTop: '6px' }}>
          <a href={docs.link} target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd' }}>
            → {docs.label}
          </a>
        </div>
      )}
    </div>
  )
}

interface Props {
  /** Path of the model field this component controls */
  modelFieldPath: string
  /** Path of the provider select field to read */
  providerFieldPath: string
  /** Path of the api key field to read */
  apiKeyFieldPath: string
  /** When true shows the image-model warning banner */
  imageMode?: boolean
}

export default function ModelSelect({
  modelFieldPath,
  providerFieldPath,
  apiKeyFieldPath,
  imageMode = false,
}: Props) {
  const [models, setModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const fields = useFormFields(([f]) => f)
  const { setValue: setModel, value: currentModel } = useField<string>({ path: modelFieldPath })

  const provider = fields[providerFieldPath]?.value as Provider | undefined
  const apiKey = fields[apiKeyFieldPath]?.value as string | undefined

  // Track the last provider+key pair we fetched for, to avoid duplicate fetches
  const fetchedFor = useRef<string>('')

  useEffect(() => {
    if (!provider || !apiKey) return
    const key = `${provider}:${apiKey}`
    if (fetchedFor.current === key) return
    fetchedFor.current = key

    setLoading(true)
    setError(null)
    setModels([])

    const params = new URLSearchParams({ provider, apiKey })
    fetch(`/api/ai/models?${params.toString()}`)
      .then(async (res) => {
        const data: unknown = await res.json()
        if (!res.ok) {
          const d = data as Record<string, unknown>
          setError({
            message: typeof d.error === 'string' ? d.error : `HTTP ${res.status}`,
            providerStatus: typeof d.providerStatus === 'number' ? d.providerStatus : res.status,
          })
          return
        }
        const list =
          typeof data === 'object' && data !== null && 'models' in data
            ? (data as { models: string[] }).models
            : []
        setModels(list)
      })
      .catch(() => {
        setError({ message: 'Network error — could not reach the server.', providerStatus: 0 })
      })
      .finally(() => setLoading(false))
  }, [provider, apiKey])

  if (!provider || !apiKey) return null

  return (
    <div style={{ marginTop: '8px' }}>
      {loading && (
        <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>Loading models…</p>
      )}

      {error && <ErrorBanner err={error} provider={provider} />}

      {models.length > 0 && (
        <div style={{ marginTop: '4px', marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#aaa' }}>
            Select model:
          </label>
          <select
            value={currentModel ?? ''}
            onChange={(e) => setModel(e.target.value)}
            style={{
              width: '100%',
              minHeight: '38px',
              padding: '6px 8px',
              fontSize: '15px',
              borderRadius: '4px',
              border: '1px solid var(--theme-border-color)',
              background: 'var(--theme-input-bg)',
              color: 'var(--theme-text)',
            }}
          >
            <option value="">— pick a model —</option>
            {currentModel && !models.includes(currentModel) && (
              <option value={currentModel} style={{ color: '#f87171' }} disabled>
                {currentModel} (not available)
              </option>
            )}
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      )}

      {imageMode && models.length > 0 && <ImageModelWarning provider={provider} />}
    </div>
  )
}
