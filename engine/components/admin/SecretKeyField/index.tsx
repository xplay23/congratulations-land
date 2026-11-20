"use client";

import { useRef, useState } from "react";
import {
  FieldDescription,
  FieldLabel,
  TextInput,
  useField,
} from "@payloadcms/ui";

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 6)}••••••••`;
}

function btnStyle(isHovered = false): React.CSSProperties {
  return {
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: "6px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: isHovered
      ? "var(--theme-elevation-300)"
      : "var(--theme-elevation-200)",
    background: isHovered
      ? "var(--theme-elevation-100)"
      : "var(--theme-elevation-50)",
    color: "var(--theme-text)",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "background 120ms ease, border-color 120ms ease",
  };
}

interface SecretKeyFieldProps {
  path: string;
  label?: string;
  description?: string;
  required?: boolean;
}

export function SecretKeyField({
  path,
  label,
  description,
  required,
}: SecretKeyFieldProps) {
  const { value, setValue } = useField<string>({ path });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasValue = Boolean(value);

  function startEditing() {
    setDraft("");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function cancelEditing() {
    setDraft("");
    setEditing(false);
  }

  function commitDraft() {
    if (draft.trim()) setValue(draft.trim());
    setEditing(false);
    setDraft("");
  }

  if (!editing && hasValue) {
    return (
      <div className="field-type text">
        <FieldLabel label={label} path={path} required={required} />
        <div
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
          className="field-type__wrap"
        >
          <input
            readOnly
            value={maskKey(value)}
            style={{
              flex: 1,
              fontFamily: "monospace",
              letterSpacing: "0.04em",
            }}
            className="field-type__input"
          />
          <button
            type="button"
            style={btnStyle(hovered === "change")}
            onMouseEnter={() => setHovered("change")}
            onMouseLeave={() => setHovered(null)}
            onClick={startEditing}
          >
            Change
          </button>
        </div>
        {description && <FieldDescription description={description} path={path} />}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="field-type text">
        <FieldLabel label={label} path={path} required={required} />
        <div
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
          className="field-type__wrap"
        >
          <input
            ref={inputRef}
            autoFocus
            value={draft}
            placeholder="Paste new key…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitDraft();
              }
              if (e.key === "Escape") cancelEditing();
            }}
            style={{ flex: 1, fontFamily: "monospace" }}
            className="field-type__input"
          />
          <button
            type="button"
            style={{ ...btnStyle(hovered === "save"), color: "var(--theme-success-500)" }}
            onMouseEnter={() => setHovered("save")}
            onMouseLeave={() => setHovered(null)}
            onClick={commitDraft}
          >
            ✓ Save
          </button>
          <button
            type="button"
            style={btnStyle(hovered === "cancel")}
            onMouseEnter={() => setHovered("cancel")}
            onMouseLeave={() => setHovered(null)}
            onClick={cancelEditing}
          >
            Cancel
          </button>
        </div>
        {description && <FieldDescription description={description} path={path} />}
      </div>
    );
  }

  return (
    <TextInput
      path={path}
      label={label}
      required={required}
      description={description}
      value={draft}
      placeholder="Paste API key…"
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        setDraft(e.target.value);
        setValue(e.target.value);
      }}
    />
  );
}

export function ApiKeyField() {
  return (
    <SecretKeyField
      path="apiKey"
      label="API Key"
      description="Stored in DB (falls back to OPENAI_API_KEY env if empty)."
    />
  );
}

export function ImageApiKeyField() {
  return (
    <SecretKeyField
      path="imageApiKey"
      label="Image API Key"
      description="Stored in DB (falls back to Text API Key or OPENAI_API_KEY env if empty)."
    />
  );
}

export function ElevenLabsApiKeyField() {
  return (
    <SecretKeyField
      path="elevenLabsApiKey"
      label="ElevenLabs API Key"
      description="Stored in DB (falls back to ELEVENLABS_API_KEY env if empty)."
    />
  );
}
