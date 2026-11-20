'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * Universal RowLabel that shows the first non-empty string value from the row data.
 * Attach to any array field so collapsed rows show meaningful content instead of "Item 01".
 *
 * Usage in collection/global field:
 *   admin: {
 *     components: { RowLabel: 'engine/components/admin/FirstFieldRowLabel#FirstFieldRowLabel' }
 *   }
 */
export function FirstFieldRowLabel() {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>()

  const label = data
    ? Object.entries(data).find(
        ([k, v]) => k !== 'id' && typeof v === 'string' && v.trim().length > 0
      )?.[1] as string | undefined
    : undefined

  return <span>{label ?? `Item ${String(rowNumber).padStart(2, '0')}`}</span>
}
