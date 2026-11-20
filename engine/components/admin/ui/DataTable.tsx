'use client'
import { Fragment, type ReactNode } from 'react'
import { C } from './tokens'
import { Checkbox } from './Checkbox'

export interface DataColumn<T> {
  key: string
  header: string
  width?: string
  render: (row: T, index: number) => ReactNode
}

interface BulkToolbarProps {
  selectedCount: number
  total: number
  children: ReactNode
}

export function BulkToolbar({ selectedCount, total, children }: BulkToolbarProps) {
  if (selectedCount === 0) return null
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      background: C.blue + '12',
      border: `1px solid ${C.blue}25`,
      borderRadius: 'var(--adm-radius)',
      marginBottom: '12px',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 'var(--adm-fs-caption)', fontWeight: 600, color: C.blue, flexShrink: 0 }}>
        {selectedCount} of {total} selected
      </span>
      <div style={{ flex: 1, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  )
}

interface DataTableProps<T> {
  rows: T[]
  columns: DataColumn<T>[]
  getKey: (row: T, index: number) => string | number
  selectedKeys?: Set<string | number>
  onSelectAll?: (selected: boolean) => void
  onSelectRow?: (key: string | number, selected: boolean) => void
  getRowKey?: (row: T, index: number) => string | number
  expandedKey?: string | number | null
  renderExpanded?: (row: T, index: number) => ReactNode
  maxHeight?: string
  emptyLabel?: string
}

export function DataTable<T>({
  rows,
  columns,
  getKey,
  selectedKeys,
  onSelectAll,
  onSelectRow,
  getRowKey,
  expandedKey,
  renderExpanded,
  maxHeight,
  emptyLabel = 'No data',
}: DataTableProps<T>) {
  const selectable   = selectedKeys !== undefined && onSelectRow !== undefined
  const allSelected  = selectable && rows.length > 0 && rows.every((r, i) => selectedKeys.has((getRowKey ?? getKey)(r, i)))
  const someSelected = selectable && rows.some((r, i) => selectedKeys.has((getRowKey ?? getKey)(r, i)))

  // Mirrors Payload's own native list-view table (engine's DataTable is only
  // consumed by the Parking page, so this can match it directly rather than
  // needing an opt-in variant): no outer card/border, zebra-striped rows
  // instead of row dividers, plain-weight lowercase header.
  return (
    <div className="table" style={{ overflowX: 'auto', ...(maxHeight ? { maxHeight, overflowY: 'auto' } : {}) }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead style={{ color: 'var(--theme-elevation-400)' }}>
          <tr style={maxHeight ? { position: 'sticky', top: 0, background: 'var(--theme-bg)', zIndex: 1 } : undefined}>
            {selectable && (
              <th style={{ padding: '12px 8px', paddingInlineStart: '16px', width: '16px', minWidth: 0, verticalAlign: 'middle' }}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={!allSelected && someSelected}
                  onChange={(checked) => onSelectAll?.(checked)}
                />
              </th>
            )}
            {columns.map((col, colIdx) => (
              <th key={col.key} style={{
                padding: '12px',
                paddingInlineStart: !selectable && colIdx === 0 ? '16px' : undefined,
                paddingInlineEnd: colIdx === columns.length - 1 ? '16px' : undefined,
                fontSize: '14px',
                fontWeight: 400,
                textAlign: 'left',
                verticalAlign: 'middle',
                whiteSpace: 'nowrap',
                width: col.width,
                minWidth: col.width ?? 0,
              }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                style={{ padding: '32px', textAlign: 'center', fontSize: 'var(--adm-fs-body)', color: C.muted, opacity: 0.35 }}
              >
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const key     = getKey(row, i)
              const selKey  = (getRowKey ?? getKey)(row, i)
              const checked = selectable && selectedKeys.has(selKey)
              const expanded = expandedKey !== undefined && expandedKey === key
              const striped = i % 2 === 0

              return (
                <Fragment key={key}>
                  <tr
                    style={{
                      background: checked ? C.blue + '10' : striped ? 'var(--theme-elevation-50)' : 'transparent',
                      borderRadius: '4px',
                      transition: 'background 0.1s',
                    }}
                  >
                    {selectable && (
                      <td style={{ padding: '10px 8px', paddingInlineStart: '16px', minWidth: 0, verticalAlign: 'middle' }}>
                        <Checkbox checked={checked} onChange={(v) => onSelectRow?.(selKey, v)} />
                      </td>
                    )}
                    {columns.map((col, colIdx) => (
                      <td key={col.key} style={{
                        padding: '10px 12px',
                        paddingInlineStart: !selectable && colIdx === 0 ? '16px' : undefined,
                        paddingInlineEnd: colIdx === columns.length - 1 ? '16px' : undefined,
                        fontSize: 'var(--adm-fs-body)',
                        verticalAlign: 'middle',
                        minWidth: col.width ?? 0,
                      }}>
                        {col.render(row, i)}
                      </td>
                    ))}
                  </tr>
                  {expanded && renderExpanded && (
                    <tr>
                      <td
                        colSpan={columns.length + (selectable ? 1 : 0)}
                        style={{ padding: '12px 16px', background: 'var(--theme-elevation-50)' }}
                      >
                        {renderExpanded(row, i)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
