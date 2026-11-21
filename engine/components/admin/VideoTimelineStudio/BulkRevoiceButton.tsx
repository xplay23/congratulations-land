"use client";

import React, { useState } from "react";
import { useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { Loader2, RefreshCw } from "lucide-react";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";
import type { Lang } from "@/lib/types";

export function BulkRevoiceButton() {
  const adminLang = useAdminLang();
  const { id: docId } = useDocumentInfo();
  const voiceSettings = useFormFields(([fields]) => ({
    voiceId: (fields.elevenLabsVoiceId?.value as string) || undefined,
    modelId: (fields.elevenLabsModelId?.value as string) || undefined,
    stability:
      typeof fields.stability?.value === "number" ? fields.stability.value : undefined,
    similarityBoost:
      typeof fields.similarityBoost?.value === "number"
        ? fields.similarityBoost.value
        : undefined,
  }));

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(bulkLangs: Lang[]) {
    if (!docId) {
      setErr(
        tAdmin(
          adminLang,
          "Сначала сохраните шаблон.",
          "Спочатку збережіть шаблон."
        )
      );
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/video-templates/tts-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mode: "bulk",
          templateId: docId,
          bulkLangs,
          ...voiceSettings,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        count?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setMsg(
        tAdmin(
          adminLang,
          `Переозвучено ${data.count} статичных реплик и сохранено в шаблон. Обновите страницу, чтобы увидеть новые MP3 в студии.`,
          `Переозвучено ${data.count} статичних реплік і збережено в шаблон. Оновіть сторінку, щоб побачити нові MP3 у студії.`
        )
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Bulk revoice failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        margin: "8px 0 4px",
        padding: "12px 14px",
        borderRadius: 8,
        border: "1px solid var(--theme-elevation-150)",
        background: "var(--theme-elevation-50)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {tAdmin(
              adminLang,
              "Массовая переозвучка статичных реплик",
              "Масова переозвучка статичних реплік"
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--theme-elevation-500)" }}>
            {tAdmin(
              adminLang,
              "Синтезирует заново все static-реплики шаблона выбранным голосом ElevenLabs и сохраняет в PipelineAssets.",
              "Синтезує заново всі static-репліки шаблону обраним голосом ElevenLabs і зберігає у PipelineAssets."
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={busy || !docId}
            onClick={() => void run(["uk"])}
            style={{
              padding: "7px 11px",
              borderRadius: 6,
              border: "1px solid var(--theme-elevation-200)",
              background: "var(--theme-bg)",
              color: "var(--theme-text)",
              fontSize: 12,
              fontWeight: 600,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            🇺🇦 UA
          </button>
          <button
            type="button"
            disabled={busy || !docId}
            onClick={() => void run(["ru"])}
            style={{
              padding: "7px 11px",
              borderRadius: 6,
              border: "1px solid var(--theme-elevation-200)",
              background: "var(--theme-bg)",
              color: "var(--theme-text)",
              fontSize: 12,
              fontWeight: 600,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            🇷🇺 RU
          </button>
          <button
            type="button"
            disabled={busy || !docId}
            onClick={() => void run(["uk", "ru"])}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 6,
              border: "1px solid var(--theme-text)",
              background: "var(--theme-text)",
              color: "var(--theme-bg)",
              fontSize: 12,
              fontWeight: 600,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {tAdmin(adminLang, "Переозвучить UA + RU", "Переозвучити UA + RU")}
          </button>
        </div>
      </div>

      {err && <div style={{ fontSize: 12, color: "var(--theme-error-500, #dc2626)" }}>{err}</div>}
      {msg && (
        <div style={{ fontSize: 12, color: "var(--theme-success-500, #16a34a)" }}>
          {msg}{" "}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginLeft: 6,
              textDecoration: "underline",
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {tAdmin(adminLang, "Обновить", "Оновити")}
          </button>
        </div>
      )}
    </div>
  );
}

export default BulkRevoiceButton;
