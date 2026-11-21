"use client";

import React, { useState } from "react";
import { useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { Loader2, Play } from "lucide-react";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";
import type { VideoTimelineConfig } from "@/lib/video/template-schema";
import type { Lang } from "@/lib/types";

interface RenderResult {
  videoUrl: string;
  durationSec: number;
  sizeBytes: number;
  buildSec: number;
  warnings: string[];
  resolvedScriptLines: Record<string, string>;
}

export function VideoTemplateTestRender() {
  const adminLang = useAdminLang();
  const { id: docId } = useDocumentInfo();
  const timeline = useFormFields(([fields]) => fields.timelineConfig?.value as VideoTimelineConfig | undefined);

  const [lang, setLang] = useState<Lang>("uk");
  const [synthesizeDynamic, setSynthesizeDynamic] = useState(false);
  const [childName, setChildName] = useState("Андрійко");
  const [childNameVocative, setChildNameVocative] = useState("Андрійку");
  const [gender, setGender] = useState<"boy" | "girl">("boy");
  const [age, setAge] = useState("6 років");
  const [achievement, setAchievement] = useState("пішов до школи та навчився читати книжки");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RenderResult | null>(null);

  function switchLang(next: Lang) {
    setLang(next);
    if (next === "ru") {
      setChildName("Андрей");
      setChildNameVocative("Андрюша");
      setAge("6 лет");
      setAchievement("пошёл в школу и научился читать книжки");
    } else {
      setChildName("Андрійко");
      setChildNameVocative("Андрійку");
      setAge("6 років");
      setAchievement("пішов до школи та навчився читати книжки");
    }
  }

  async function runRender() {
    if (!docId) {
      setError(tAdmin(adminLang, "Сначала сохраните шаблон.", "Спочатку збережіть шаблон."));
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/video-templates/render-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          templateId: docId,
          lang,
          mode: "full",
          timelineConfig: timeline,
          synthesizeDynamic,
          sampleFields: {
            gender,
            childName,
            childNameVocative,
            age,
            achievement,
          },
        }),
      });
      const data = (await res.json()) as RenderResult & { ok?: boolean; error?: string };
      if (!res.ok || !data.videoUrl) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Render failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 880 }}>
      <div
        style={{
          padding: 16,
          borderRadius: 9,
          border: "1px solid var(--theme-elevation-150)",
          background: "var(--theme-elevation-50)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {tAdmin(adminLang, "Сборка тестового ролика (FFmpeg + Pillow)", "Збірка тестового ролика (FFmpeg + Pillow)")}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["uk", "ru"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => switchLang(l)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--theme-elevation-200)",
                  background: lang === l ? "var(--theme-text)" : "var(--theme-bg)",
                  color: lang === l ? "var(--theme-bg)" : "var(--theme-text)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {l === "uk" ? "🇺🇦 UA" : "🇷🇺 RU"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span>{tAdmin(adminLang, "Имя", "Ім'я")}</span>
            <input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--theme-elevation-200)", background: "var(--theme-bg)", color: "var(--theme-text)" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span>{tAdmin(adminLang, "Звательный / обращение", "Кличний / звернення")}</span>
            <input
              value={childNameVocative}
              onChange={(e) => setChildNameVocative(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--theme-elevation-200)", background: "var(--theme-bg)", color: "var(--theme-text)" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span>{tAdmin(adminLang, "Возраст", "Вік")}</span>
            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--theme-elevation-200)", background: "var(--theme-bg)", color: "var(--theme-text)" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span>{tAdmin(adminLang, "Пол", "Стать")}</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value === "girl" ? "girl" : "boy")}
              style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--theme-elevation-200)", background: "var(--theme-bg)", color: "var(--theme-text)" }}
            >
              <option value="boy">{tAdmin(adminLang, "Мальчик", "Хлопчик")}</option>
              <option value="girl">{tAdmin(adminLang, "Девочка", "Дівчинка")}</option>
            </select>
          </label>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
          <span>{tAdmin(adminLang, "Достижение / похвала", "Досягнення / похвала")}</span>
          <input
            value={achievement}
            onChange={(e) => setAchievement(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--theme-elevation-200)", background: "var(--theme-bg)", color: "var(--theme-text)" }}
          />
        </label>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={synthesizeDynamic}
              onChange={(e) => setSynthesizeDynamic(e.target.checked)}
            />
            {tAdmin(
              adminLang,
              "Озвучить динамические реплики вживую через ElevenLabs (иначе — кэшированное демо-аудио)",
              "Озвучити динамічні репліки наживо через ElevenLabs (інакше — кешоване демо-аудіо)"
            )}
          </label>

          <button
            type="button"
            disabled={busy || !docId}
            onClick={() => void runRender()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 7,
              border: "1px solid var(--theme-text)",
              background: "var(--theme-text)",
              color: "var(--theme-bg)",
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {busy
              ? tAdmin(adminLang, "Собираем MP4 (~15–20с)…", "Збираємо MP4 (~15–20с)…")
              : tAdmin(adminLang, "Собрать тестовый MP4", "Зібрати тестовий MP4")}
          </button>
        </div>

        {error && <div style={{ color: "var(--theme-error-500, #dc2626)", fontSize: 12.5 }}>{error}</div>}
      </div>

      {result && (
        <div
          style={{
            padding: 16,
            borderRadius: 9,
            border: "1px solid var(--theme-elevation-150)",
            background: "var(--theme-bg)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>
            ✓ {result.durationSec.toFixed(2)}s • {(result.sizeBytes / 1024 / 1024).toFixed(1)} MB •{" "}
            {tAdmin(adminLang, "время сборки", "час збірки")}: {result.buildSec.toFixed(1)}s
          </div>
          <video
            key={result.videoUrl}
            src={result.videoUrl}
            controls
            playsInline
            style={{ width: "100%", borderRadius: 8, background: "#000" }}
          />
          {result.warnings.length > 0 && (
            <div style={{ fontSize: 12, color: "#b45309" }}>
              {result.warnings.map((w, i) => (
                <div key={i}>⚠ {w}</div>
              ))}
            </div>
          )}
          {Object.keys(result.resolvedScriptLines || {}).length > 0 && (
            <div style={{ fontSize: 12, color: "var(--theme-elevation-600)", display: "grid", gap: 4 }}>
              <strong>{tAdmin(adminLang, "Озвученные тексты:", "Озвучені тексти:")}</strong>
              {Object.entries(result.resolvedScriptLines).map(([k, v]) => (
                <div key={k}>
                  <code>{k}</code>: {v}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoTemplateTestRender;
