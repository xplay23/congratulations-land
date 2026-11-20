"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { useField, useForm, useFormFields } from "@payloadcms/ui";

const CYRILLIC_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  є: "ye",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "yi",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ь: "",
  ъ: "",
  ы: "y",
  э: "e",
  ю: "yu",
  я: "ya",
  ё: "yo",
  "'": "",
  "’": "",
  "`": "",
};

export function toSlug(value: string): string {
  const lower = value.toLowerCase();
  let transliterated = "";
  for (const ch of lower) {
    transliterated += ch in CYRILLIC_MAP ? CYRILLIC_MAP[ch] : ch;
  }
  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function PublicLink({
  prefix,
  statusField,
  publishedValues,
}: {
  prefix: string;
  statusField?: string;
  publishedValues?: string[];
}) {
  const savedSegment = useFormFields(([f]) => f["slug"]?.initialValue) as
    | string
    | undefined;
  const currentSegment = useFormFields(([f]) => f["slug"]?.value) as
    | string
    | undefined;
  const savedStatus = useFormFields(([f]) =>
    statusField ? f[statusField]?.initialValue : undefined
  ) as string | undefined;

  if (!savedSegment) return null;
  if (
    statusField &&
    (!savedStatus || !(publishedValues ?? []).includes(savedStatus))
  ) {
    return null;
  }

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const href = `${siteUrl}${prefix}${savedSegment}`;
  const isDirty = currentSegment !== savedSegment;

  return (
    <div
      style={{
        marginTop: "6px",
        display: "flex",
        flexDirection: "column",
        gap: "3px",
      }}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "12px",
          color: "#3b82f6",
          textDecoration: "none",
          fontFamily: "monospace",
        }}
      >
        {href}
      </a>
      {isDirty && (
        <span style={{ fontSize: "11px", color: "#f59e0b" }}>
          ⚠ URL will change after saving
        </span>
      )}
    </div>
  );
}

export function SlugField({
  path = "slug",
  sourceField = "title",
  publicLinkPrefix,
  publicLinkStatusField,
  publicLinkPublishedValues,
}: {
  path?: string;
  sourceField?: string;
  publicLinkPrefix?: string;
  publicLinkStatusField?: string;
  publicLinkPublishedValues?: string[];
}) {
  const { value, setValue } = useField<string>({ path });
  const source = useFormFields(([f]) => f[sourceField]?.value) as
    | string
    | undefined;
  const { setModified } = useForm();
  const [, startSlugTransition] = useTransition();

  const [locked, setLocked] = useState(
    () => Boolean(value) && toSlug(source ?? "") !== value
  );
  const prevSourceRef = useRef<string | undefined>(source);

  useEffect(() => {
    if (locked) return;
    if (!source) return;
    if (source === prevSourceRef.current) return;
    prevSourceRef.current = source;
    const newSlug = toSlug(source);
    if (newSlug !== value) {
      startSlugTransition(() => {
        setValue(newSlug);
        setModified(true);
      });
    }
  }, [source, locked, value, setValue, setModified]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocked(true);
    setValue(e.target.value);
    setModified(true);
  }

  function handleSync() {
    if (!source) return;
    const newSlug = toSlug(source);
    setValue(newSlug);
    setModified(true);
    setLocked(false);
  }

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          marginBottom: "6px",
          color: "var(--theme-text)",
        }}
      >
        Slug
      </div>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <input
          type="text"
          value={value ?? ""}
          onChange={handleChange}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: "4px",
            border: "1px solid var(--theme-border-color)",
            background: "var(--theme-input-bg)",
            color: "var(--theme-text)",
            fontSize: "13px",
            fontFamily: "monospace",
          }}
        />
        <button
          type="button"
          onClick={handleSync}
          title="Re-sync slug from title"
          style={{
            padding: "8px 10px",
            borderRadius: "4px",
            border: "1px solid #555",
            background: locked ? "#1e3a5f" : "#1a2e1a",
            color: locked ? "#93c5fd" : "#86efac",
            fontSize: "12px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {locked ? "↺ Re-sync" : "✓ Auto"}
        </button>
      </div>
      <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
        {locked
          ? "Manually edited — click ↺ Re-sync to transliterate from title"
          : "Auto-syncing from title (UA / RU transliteration)"}
      </div>
      {publicLinkPrefix && (
        <PublicLink
          prefix={publicLinkPrefix}
          statusField={publicLinkStatusField}
          publishedValues={publicLinkPublishedValues}
        />
      )}
    </div>
  );
}

export function SlugFieldPost() {
  return (
    <SlugField
      path="slug"
      sourceField="title"
      publicLinkPrefix="/blog/"
      publicLinkStatusField="status"
      publicLinkPublishedValues={["published"]}
    />
  );
}

export function SlugFieldPage() {
  return (
    <SlugField
      path="slug"
      sourceField="title"
      publicLinkPrefix="/"
      publicLinkStatusField="status"
      publicLinkPublishedValues={["published"]}
    />
  );
}

export default SlugField;
