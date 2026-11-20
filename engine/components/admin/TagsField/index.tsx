'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, useFormFields } from '@payloadcms/ui'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── Types ─────────────────────────────────────────────────────────────────────

type TagItem = { tag: string }

type FieldAction =
  | { type: 'ADD_ROW'; path: string; rowIndex?: number; subFieldState: Record<string, { value: unknown; initialValue: unknown; valid: boolean }> }
  | { type: 'REMOVE_ROW'; path: string; rowIndex: number }
  | { type: 'MOVE_ROW'; path: string; moveFromIndex: number; moveToIndex: number }

type FieldDispatch = (action: FieldAction) => void

// ── Sortable Pill ─────────────────────────────────────────────────────────────

function SortablePill({ id, label, onRemove }: { id: string; label: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px 3px 10px',
    borderRadius: '999px',
    background: '#1e3a5f',
    border: '1px solid #2d5a9e',
    color: '#93c5fd',
    fontSize: '12px',
    fontWeight: 500,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    touchAction: 'none',
  }

  return (
    <span ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {label}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        style={{
          background: 'none',
          border: 'none',
          padding: '0 0 0 2px',
          cursor: 'pointer',
          color: '#60a5fa',
          fontSize: '14px',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
        }}
        title="Remove tag"
      >
        ×
      </button>
    </span>
  )
}

// ── TagsField ─────────────────────────────────────────────────────────────────

export default function TagsField({ path = 'tags' }: { path?: string }) {
  const dispatch = useFormFields(([, d]) => d) as FieldDispatch
  const { setModified } = useForm()

  // Collect tags as a stable JSON string — re-runs when any tag key changes or rows added/removed
  const formTagsJson = useFormFields(([f]) => {
    void Object.keys(f).length // subscribe to structural changes
    const result: TagItem[] = []
    let i = 0
    while (`${path}.${i}.tag` in f) {
      const val = f[`${path}.${i}.tag`]?.value
      if (typeof val === 'string') result.push({ tag: val })
      i++
    }
    return JSON.stringify(result)
  })

  // Local state drives rendering
  const [tags, setTags] = useState<TagItem[]>([])
  const prevFormTagsRef = useRef<string>('')

  // Sync from form state whenever it changes externally (e.g. AI generation, form load)
  useEffect(() => {
    if (formTagsJson === prevFormTagsRef.current) return
    prevFormTagsRef.current = formTagsJson
    setTags(JSON.parse(formTagsJson) as TagItem[])
  }, [formTagsJson])

  const [inputValue, setInputValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const addTag = useCallback(
    (raw: string) => {
      const trimmed = raw.trim().toLowerCase().replace(/,+$/, '').trim()
      if (!trimmed) return
      if (tags.some((t) => t.tag === trimmed)) return
      const next = [...tags, { tag: trimmed }]
      prevFormTagsRef.current = JSON.stringify(next)
      setTags(next)
      dispatch({
        type: 'ADD_ROW',
        path,
        subFieldState: {
          tag: { value: trimmed, initialValue: trimmed, valid: true },
        },
      })
      setModified(true)
    },
    [tags, dispatch, path, setModified],
  )

  const removeTag = useCallback(
    (index: number) => {
      const next = tags.filter((_, i) => i !== index)
      prevFormTagsRef.current = JSON.stringify(next)
      setTags(next)
      dispatch({ type: 'REMOVE_ROW', path, rowIndex: index })
      setModified(true)
    },
    [tags, dispatch, path, setModified],
  )

  function parsePaste(text: string) {
    const parts = text.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    const existing = new Set(tags.map((t) => t.tag))
    const newOnes = parts.filter((p) => !existing.has(p))
    if (!newOnes.length) return
    const next = [...tags, ...newOnes.map((p) => ({ tag: p }))]
    prevFormTagsRef.current = JSON.stringify(next)
    setTags(next)
    newOnes.forEach((p) => {
      dispatch({
        type: 'ADD_ROW',
        path,
        subFieldState: {
          tag: { value: p, initialValue: p, valid: true },
        },
      })
    })
    setModified(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
      setInputValue('')
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  function handleBlur() {
    setFocused(false)
    if (inputValue.trim()) {
      addTag(inputValue)
      setInputValue('')
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text')
    if (text.includes(',')) {
      e.preventDefault()
      parsePaste(text)
      setInputValue('')
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = Number(active.id)
    const newIndex = Number(over.id)
    if (isNaN(oldIndex) || isNaN(newIndex)) return
    const next = arrayMove(tags, oldIndex, newIndex)
    prevFormTagsRef.current = JSON.stringify(next)
    setTags(next)
    dispatch({ type: 'MOVE_ROW', path, moveFromIndex: oldIndex, moveToIndex: newIndex })
    setModified(true)
  }

  const ids = tags.map((_, i) => String(i))

  return (
    <div style={{ marginBottom: '21px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--theme-text)' }}>
        Tags
      </div>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 10px',
          minHeight: '42px',
          borderRadius: '4px',
          border: focused ? '1px solid #3b82f6' : '1px solid var(--theme-border-color)',
          background: 'var(--theme-input-bg)',
          cursor: 'text',
          transition: 'border-color 0.15s',
        }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
            {tags.map((t, i) => (
              <SortablePill
                key={String(i)}
                id={String(i)}
                label={t.tag}
                onRemove={() => removeTag(i)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => setFocused(true)}
          onPaste={handlePaste}
          placeholder={tags.length === 0 ? 'Type a tag and press Enter or comma…' : ''}
          style={{
            flex: '1 1 120px',
            minWidth: '120px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--theme-text)',
            fontSize: '13px',
            padding: '2px 0',
          }}
        />
      </div>
      <div style={{ fontSize: '11px', color: 'var(--theme-text-secondary, #888)', marginTop: '5px' }}>
        Press <kbd style={{ padding: '1px 4px', borderRadius: '3px', border: '1px solid #444', fontSize: '11px' }}>Enter</kbd> or <kbd style={{ padding: '1px 4px', borderRadius: '3px', border: '1px solid #444', fontSize: '11px' }}>,</kbd> to add · Drag to reorder · Backspace to remove last
      </div>
    </div>
  )
}
