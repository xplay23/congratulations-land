'use client'
import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { C } from './tokens'
import './admin-ui.css'

interface DropzoneProps {
  onFile: (file: File) => void
  accept?: string   // e.g. ".csv,.xlsx,.txt"
  label?: string
  hint?: string
}

export function Dropzone({ onFile, accept, label = 'Drop file here or click to browse', hint }: DropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      className={`aui-dropzone${dragging ? ' aui-dropzone--active' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>↑</div>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: dragging ? C.blue : C.text, transition: 'color 0.15s' }}>
        {label}
      </div>
      {hint && (
        <div style={{ fontSize: '0.75rem', color: C.muted, opacity: 0.5, marginTop: '0.25rem' }}>{hint}</div>
      )}
    </div>
  )
}
