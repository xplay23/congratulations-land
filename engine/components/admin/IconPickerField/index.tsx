'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
import * as LucideIcons from 'lucide-react'

// ── Icon list ─────────────────────────────────────────────────────────────────
// Curated set of ~100 icons most relevant for business/feature/step content.
// Full Lucide name (PascalCase) — rendered dynamically via LucideIcons[name].

const ICON_GROUPS: Record<string, string[]> = {
  'Storybook & Magic': [
    'Sparkles', 'Wand2', 'Moon', 'Sun', 'Smile', 'Rocket', 'Waves',
    'Footprints', 'PawPrint', 'Snowflake', 'Crown', 'Castle', 'TreePine',
    'Gift', 'Music', 'Flower2', 'Flame', 'Anchor', 'Feather', 'BookHeart',
  ],
  'Actions & UI': [
    'Search', 'Filter', 'Star', 'Heart', 'Bookmark', 'Bell',
    'Settings', 'Sliders', 'LayoutGrid', 'List', 'ArrowRight', 'Check',
    'Plus', 'Minus', 'RefreshCw', 'ChevronRight',
  ],
  'Business & Commerce': [
    'ShoppingCart', 'CreditCard', 'Wallet', 'DollarSign', 'TrendingUp',
    'BarChart2', 'PieChart', 'Receipt', 'Package', 'Tag', 'BadgeCheck', 'Award',
    'Percent', 'Handshake', 'LineChart', 'Target',
  ],
  'Communication': [
    'Mail', 'MessageCircle', 'Phone', 'Send', 'Inbox', 'AtSign',
    'Globe', 'Share2', 'Link', 'ExternalLink',
    'MessageSquare', 'Bell', 'Rss', 'Megaphone',
  ],
  'Security & Trust': [
    'Shield', 'ShieldCheck', 'Lock', 'Unlock', 'Key', 'Eye',
    'Fingerprint', 'AlertCircle', 'CheckCircle', 'XCircle',
    'ShieldAlert', 'BadgeX', 'EyeOff',
  ],
  'People & Teams': [
    'User', 'Users', 'UserCheck', 'Building', 'Briefcase',
    'UserPlus', 'UserCog', 'Contact', 'HeartHandshake',
  ],
  'Tech & Data': [
    'Zap', 'Code', 'Database', 'Server', 'Cloud', 'Cpu',
    'Wifi', 'Monitor', 'Smartphone', 'Bot',
    'Code2', 'Terminal', 'GitBranch', 'Layers',
  ],
  'Files & Content': [
    'FileText', 'File', 'Folder', 'Image', 'Video', 'Mic',
    'Download', 'Upload', 'Clipboard', 'Edit',
    'BookOpen', 'Newspaper', 'FileSearch', 'PenLine',
  ],
  'Navigation & Location': [
    'Map', 'MapPin', 'Navigation', 'Compass', 'Home', 'Building2',
    'Globe2', 'Waypoints', 'Route',
  ],
}

const ALL_ICONS = Object.values(ICON_GROUPS).flat()

// ── IconPreview ───────────────────────────────────────────────────────────────

function IconPreview({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = (LucideIcons as Record<string, unknown>)[name] as React.ComponentType<{ size: number; strokeWidth: number }> | undefined
  if (!Icon) return null
  return <Icon size={size} strokeWidth={1.8} />
}

// ── IconPickerField ───────────────────────────────────────────────────────────

export function IconPickerField({ field, path }: TextFieldClientProps) {
  const fieldPath = path ?? (field as { name: string }).name
  const { value, setValue } = useField<string>({ path: fieldPath })

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Close on outside click — exclude the trigger button to avoid open→close→open flicker
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  // Focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null // show groups
    return ALL_ICONS.filter((n) => n.toLowerCase().includes(q))
  }, [query])

  const select = useCallback((name: string) => {
    setValue(name)
    setOpen(false)
    setQuery('')
  }, [setValue])

  const clear = useCallback(() => {
    setValue('')
  }, [setValue])

  const label = (field as { label?: string }).label ?? 'Icon'
  const hasValue = Boolean(value)

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Label */}
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--theme-text)', marginBottom: '8px' }}>
        {label}
      </div>

      {/* Trigger row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '44px',
            padding: '0 14px',
            flex: 1,
            background: 'var(--theme-elevation-50)',
            border: open
              ? '1px solid var(--theme-elevation-500)'
              : '1px solid var(--theme-elevation-200)',
            borderRadius: '6px',
            color: hasValue ? 'var(--theme-text)' : 'var(--theme-elevation-400)',
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'border-color 0.15s',
          }}
        >
          {hasValue ? (
            <>
              <span style={{ color: 'var(--theme-elevation-700)', display: 'flex' }}>
                <IconPreview name={value} size={16} />
              </span>
              <span>{value}</span>
            </>
          ) : (
            <span>Select an icon…</span>
          )}
        </button>

        {hasValue && (
          <button
            type="button"
            onClick={clear}
            title="Clear icon"
            style={{
              width: '44px',
              height: '44px',
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
      </div>

      {/* Helper text */}
      <div style={{ fontSize: '11px', color: 'var(--theme-elevation-400)', marginTop: '5px' }}>
        Used as fallback when no image is uploaded above.
      </div>

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          style={{
            marginTop: '6px',
            background: 'var(--theme-elevation-0)',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.20)',
            overflow: 'hidden',
          }}
        >
          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--theme-elevation-100)' }}>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search icons…"
              style={{
                width: '100%',
                height: '36px',
                padding: '0 10px',
                fontSize: '13px',
                background: 'var(--theme-elevation-50)',
                border: '1px solid var(--theme-elevation-200)',
                borderRadius: '6px',
                color: 'var(--theme-text)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Grid */}
          <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px 12px 12px' }}>
            {filtered ? (
              filtered.length === 0 ? (
                <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--theme-elevation-400)', fontSize: '13px' }}>
                  No icons found
                </div>
              ) : (
                <IconGrid icons={filtered} selected={value} onSelect={select} />
              )
            ) : (
              Object.entries(ICON_GROUPS).map(([group, icons]) => (
                <div key={group} style={{ marginBottom: '12px' }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: 'var(--theme-elevation-400)',
                    marginBottom: '6px',
                    marginTop: '4px',
                  }}>
                    {group}
                  </div>
                  <IconGrid icons={icons} selected={value} onSelect={select} />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── IconGrid ──────────────────────────────────────────────────────────────────

function IconGrid({ icons, selected, onSelect }: {
  icons: string[]
  selected: string
  onSelect: (name: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {icons.map((name) => {
        const isSelected = selected === name
        return (
          <button
            key={name}
            type="button"
            title={name}
            onClick={() => onSelect(name)}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              border: isSelected
                ? '2px solid var(--theme-elevation-700)'
                : '1px solid transparent',
              background: isSelected
                ? 'var(--theme-elevation-150)'
                : 'transparent',
              color: 'var(--theme-elevation-700)',
              cursor: 'pointer',
              padding: 0,
              transition: 'background 0.1s, border-color 0.1s',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = 'var(--theme-elevation-100)'
                e.currentTarget.style.borderColor = 'var(--theme-elevation-200)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
              }
            }}
          >
            <IconPreview name={name} size={18} />
          </button>
        )
      })}
    </div>
  )
}

export default IconPickerField
