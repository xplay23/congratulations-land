"use client";

import React, { useEffect, useRef, useState } from "react";
import { FieldDescription, FieldLabel, useField, useFormFields } from "@payloadcms/ui";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";

interface ElevenLabsVoiceItem {
  voiceId: string;
  name: string;
  category?: string;
}

export function ElevenLabsVoiceField({
  path = "voiceId",
  field,
}: {
  path?: string;
  field?: {
    label?: string | Record<string, string>;
    required?: boolean;
    admin?: { description?: string | Record<string, string>; width?: string };
  };
}) {
  const lang = useAdminLang();
  const { value, setValue } = useField<string>({ path });
  const fields = useFormFields(([f]) => f);
  const apiKey = (fields["apiKey"]?.value as string | undefined) || "";

  const [voices, setVoices] = useState<ElevenLabsVoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const fetchedKeyRef = useRef<string>("__init__");

  useEffect(() => {
    const cacheKey = apiKey || "__server_fallback__";
    if (fetchedKeyRef.current === cacheKey) return;
    fetchedKeyRef.current = cacheKey;

    setLoading(true);
    setHint(null);
    const qs = new URLSearchParams();
    if (apiKey) qs.set("apiKey", apiKey);

    fetch(`/api/ai/elevenlabs-voices?${qs.toString()}`)
      .then(async (res) => {
        const data = (await res.json()) as {
          voices?: ElevenLabsVoiceItem[];
          error?: string;
        };
        if (!res.ok) {
          setHint(
            data.error ||
              tAdmin(
                lang,
                "Список голосов недоступен — можно ввести Voice ID вручную.",
                "Список голосів недоступний — можна ввести Voice ID вручну."
              )
          );
          setVoices([]);
          return;
        }
        setVoices(data.voices ?? []);
      })
      .catch(() => {
        setVoices([]);
      })
      .finally(() => setLoading(false));
  }, [apiKey, lang]);

  const currentVal = value ?? "";
  const inList = voices.some((v) => v.voiceId === currentVal);

  const width = field?.admin?.width;

  return (
    <div
      className="field-type text"
      style={{
        marginBottom: "16px",
        flex: width ? `1 1 ${width}` : undefined,
        width,
        minWidth: width ? "220px" : undefined,
      }}
    >
      <FieldLabel
        label={
          field?.label ??
          tAdmin(lang, "Голос по умолчанию (Voice ID)", "Голос за замовчуванням (Voice ID)")
        }
        path={path}
        required={Boolean(field?.required)}
      />

      {voices.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <select
            value={inList ? currentVal : ""}
            onChange={(e) => {
              if (e.target.value) setValue(e.target.value);
            }}
            style={{
              width: "100%",
              minHeight: "40px",
              padding: "8px 10px",
              fontSize: "var(--adm-fs-body, 14px)",
              borderRadius: "var(--adm-radius-sm, 6px)",
              border: "1px solid var(--theme-border-color)",
              background: "var(--theme-input-bg)",
              color: "var(--theme-text)",
            }}
          >
            <option value="">
              {inList
                ? tAdmin(lang, "— выберите голос —", "— оберіть голос —")
                : tAdmin(
                    lang,
                    "— выбран кастомный Voice ID (или выберите из списка) —",
                    "— обрано кастомний Voice ID (або оберіть зі списку) —"
                  )}
            </option>
            {voices.map((v) => (
              <option key={v.voiceId} value={v.voiceId}>
                {v.name}
                {v.category ? ` (${v.category})` : ""} — {v.voiceId}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field-type__wrap">
        <input
          type="text"
          value={currentVal}
          onChange={(e) => setValue(e.target.value)}
          placeholder="NOpBlnGInO9m6vDvFkFC"
          className="field-type__input"
          style={{
            width: "100%",
            fontFamily: "monospace",
            fontSize: "var(--adm-fs-body, 14px)",
          }}
        />
      </div>

      {loading && (
        <div
          style={{
            marginTop: "6px",
            fontSize: "var(--adm-fs-badge, 12px)",
            color: "var(--adm-color-muted)",
          }}
        >
          {tAdmin(lang, "Загрузка голосов ElevenLabs…", "Завантаження голосів ElevenLabs…")}
        </div>
      )}

      {hint && !loading && (
        <div
          style={{
            marginTop: "6px",
            fontSize: "var(--adm-fs-badge, 12px)",
            color: "var(--adm-color-muted)",
          }}
        >
          {hint}
        </div>
      )}

      {field?.admin?.description && (
        <FieldDescription description={field.admin.description} path={path} />
      )}
    </div>
  );
}

export default ElevenLabsVoiceField;
