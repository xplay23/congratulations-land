"use client";

import { useRef, useState } from "react";
import {
  FieldDescription,
  FieldLabel,
  TextInput,
  useField,
} from "@payloadcms/ui";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 6)}••••••••`;
}

function btnStyle(isHovered = false): React.CSSProperties {
  return {
    padding: "8px 16px",
    fontSize: "var(--adm-fs-caption, 13px)",
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: "var(--adm-radius-sm, 6px)",
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
  const lang = useAdminLang();
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

  function clearValue() {
    setValue("");
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
            {tAdmin(lang, "Изменить", "Змінити")}
          </button>
          <button
            type="button"
            style={{
              ...btnStyle(hovered === "clear"),
              color: "var(--adm-color-muted)",
            }}
            onMouseEnter={() => setHovered("clear")}
            onMouseLeave={() => setHovered(null)}
            onClick={clearValue}
            title={tAdmin(lang, "Очистить ключ", "Очистити ключ")}
          >
            {tAdmin(lang, "Очистить", "Очистити")}
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
            placeholder={tAdmin(lang, "Вставьте новый API-ключ…", "Вставте новий API-ключ…")}
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
            ✓ {tAdmin(lang, "Применить", "Застосувати")}
          </button>
          <button
            type="button"
            style={btnStyle(hovered === "cancel")}
            onMouseEnter={() => setHovered("cancel")}
            onMouseLeave={() => setHovered(null)}
            onClick={cancelEditing}
          >
            {tAdmin(lang, "Отмена", "Скасувати")}
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
      placeholder={tAdmin(lang, "Вставьте API-ключ…", "Вставте API-ключ…")}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        setDraft(e.target.value);
        setValue(e.target.value);
      }}
    />
  );
}

export function ApiKeyField() {
  const lang = useAdminLang();
  return (
    <SecretKeyField
      path="apiKey"
      label="API Key"
      description={tAdmin(
        lang,
        "Хранится в БД. Если пусто — берётся OPENAI_API_KEY из .env.local.",
        "Зберігається в БД. Якщо порожньо — береться OPENAI_API_KEY із .env.local."
      )}
    />
  );
}

export function ImageApiKeyField() {
  const lang = useAdminLang();
  return (
    <SecretKeyField
      path="imageApiKey"
      label={tAdmin(lang, "API-ключ для изображений", "API-ключ для зображень")}
      description={tAdmin(
        lang,
        "Хранится в БД. Если пусто — используется основной текстовый API Key или .env.local.",
        "Зберігається в БД. Якщо порожньо — використовується основний текстовий API Key або .env.local."
      )}
    />
  );
}

export function StorybookWriterApiKeyField() {
  const lang = useAdminLang();
  return (
    <SecretKeyField
      path="writerApiKey"
      label={tAdmin(lang, "API-ключ (Текст сказки)", "API-ключ (Текст казки)")}
      description={tAdmin(
        lang,
        "Отдельный ключ для писателя и корректора сказок. Если пусто — берётся ключ из общих настроек ИИ или .env.local.",
        "Окремий ключ для письменника та коректора казок. Якщо порожньо — береться ключ із загальних налаштувань ШІ або .env.local."
      )}
    />
  );
}

export function StorybookDirectorApiKeyField() {
  const lang = useAdminLang();
  return (
    <SecretKeyField
      path="directorApiKey"
      label={tAdmin(lang, "API-ключ (Режиссёр и Vision QA)", "API-ключ (Режисер та Vision QA)")}
      description={tAdmin(
        lang,
        "Отдельный ключ для Vision-паспорта, визуальной режиссуры и QA. Если пусто — наследуется ключ текста сказки или общих настроек ИИ.",
        "Окремий ключ для Vision-паспорта, візуальної режисури та QA. Якщо порожньо — успадковується ключ тексту казки або загальних налаштувань ШІ."
      )}
    />
  );
}

export function StorybookImageApiKeyField() {
  const lang = useAdminLang();
  return (
    <SecretKeyField
      path="imageApiKey"
      label={tAdmin(lang, "API-ключ (Иллюстрации сказок)", "API-ключ (Ілюстрації казок)")}
      description={tAdmin(
        lang,
        "Отдельный ключ для генерации якорей и страниц книги. Если пусто — наследуется ключ изображений из общих настроек ИИ или .env.local.",
        "Окремий ключ для генерації якорів та сторінок книги. Якщо порожньо — успадковується ключ зображень із загальних налаштувань ШІ або .env.local."
      )}
    />
  );
}

export function ElevenLabsApiKeyField() {
  const lang = useAdminLang();
  return (
    <SecretKeyField
      path="apiKey"
      label="ElevenLabs API Key"
      description={tAdmin(
        lang,
        "Хранится в БД. Если пусто — используется ELEVENLABS_API_KEY из .env.local.",
        "Зберігається в БД. Якщо порожньо — використовується ELEVENLABS_API_KEY із .env.local."
      )}
    />
  );
}
