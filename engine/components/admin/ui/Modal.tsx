'use client'
import type { ReactNode } from 'react'
import { C } from './tokens'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger' | 'success'
  onConfirm: () => void
  onCancel: () => void
}

export function Modal({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ModalProps) {
  if (!open) return null

  return (
    <>
      <div
        onClick={onCancel}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, backdropFilter: 'blur(2px)' }}
      />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 51,
        width: '100%',
        maxWidth: '420px',
        background: C.card,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 'var(--adm-radius-lg)',
        padding: '24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <h2 style={{ fontSize: 'var(--adm-fs-body)', fontWeight: 700, margin: '0 0 14px', color: C.text }}>{title}</h2>
        <div style={{ fontSize: 'var(--adm-fs-body)', color: C.muted, opacity: 0.8, lineHeight: 1.6, marginBottom: '20px' }}>
          {children}
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </>
  )
}
