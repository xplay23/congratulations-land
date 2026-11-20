"use client";

import { useRowLabel } from "@payloadcms/ui";

const PREFERRED_KEYS = [
  "title",
  "label",
  "heading",
  "question",
  "text",
  "name",
  "modelId",
  "step",
  "key",
  "href",
  "url",
];

function extractReadableLabel(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;

  for (const key of PREFERRED_KEYS) {
    const val = data[key];
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
  }

  for (const [key, val] of Object.entries(data)) {
    if (key === "id" || key === "blockType" || key === "blockName") continue;
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
  }

  return null;
}

/**
 * Universal RowLabel that shows the readable title/label of a collapsed array row.
 * Exported as both named and default so Payload importMap resolves either form.
 */
export function FirstFieldRowLabel() {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>();
  const label = extractReadableLabel(data);
  const idx = typeof rowNumber === "number" ? rowNumber + 1 : 1;

  return <span>{label ?? `Пункт ${String(idx).padStart(2, "0")}`}</span>;
}

export default FirstFieldRowLabel;
