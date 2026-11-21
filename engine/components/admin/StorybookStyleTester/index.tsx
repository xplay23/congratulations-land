"use client";

import React, { useState } from "react";
import { useForm, useFormFields } from "@payloadcms/ui";
import { Check, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";
import {
  STORYBOOK_STYLE_TEST_SCENES,
  type StorybookMediumPreset,
} from "@/lib/storybook/config-shared";

interface TestResult {
  imageDataUrl: string;
  imageBase64: string;
  finalPrompt: string;
  model: string;
  quality: string;
  size: string;
  elapsedSec: number;
}

export function StorybookStyleTester() {
  const adminLang = useAdminLang();
  const { setModified } = useForm();
  const dispatch = useFormFields(([, d]) => d);

  const stylePrompt = useFormFields(
    ([fields]) => (fields.stylePrompt?.value as string) || ""
  );
  const mediumPreset = useFormFields(
    ([fields]) =>
      ((fields.mediumPreset?.value as StorybookMediumPreset) || "2d_illustration")
  );
  const mediumRuleOverride = useFormFields(
    ([fields]) => (fields.mediumRuleOverride?.value as string) || ""
  );
  const negativeRulesOverride = useFormFields(
    ([fields]) => (fields.negativeRulesOverride?.value as string) || ""
  );
  const slug = useFormFields(
    ([fields]) => (fields.slug?.value as string) || "custom-style"
  );
  const title = useFormFields(
    ([fields]) => (fields.title?.value as string) || ""
  );

  const [presetId, setPresetId] = useState(STORYBOOK_STYLE_TEST_SCENES[0].id);
  const [scenePrompt, setScenePrompt] = useState(STORYBOOK_STYLE_TEST_SCENES[0].prompt);
  const [size, setSize] = useState<"1024x1024" | "1536x1024" | "1024x1536">("1536x1024");
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  const [busy, setBusy] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promotedMsg, setPromotedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);

  function handlePresetChange(nextId: string) {
    setPresetId(nextId);
    const found = STORYBOOK_STYLE_TEST_SCENES.find((s) => s.id === nextId);
    if (found) setScenePrompt(found.prompt);
  }

  async function runGenerate() {
    if (!stylePrompt.trim()) {
      setError(
        tAdmin(
          adminLang,
          "Сначала заполните «Основной промпт стиля (EN)» на вкладке «Промпт и рендер».",
          "Спочатку заповніть «Основний промпт стилю (EN)» на вкладці «Промпт і рендер»."
        )
      );
      return;
    }
    setBusy(true);
    setError(null);
    setPromotedMsg(null);
    try {
      const res = await fetch("/api/admin/storybook-styles/test-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          stylePrompt,
          mediumPreset,
          mediumRuleOverride,
          negativeRulesOverride,
          scenePrompt,
          size,
        }),
      });
      const data = (await res.json()) as TestResult & { error?: string };
      if (!res.ok || !data.imageDataUrl) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function handlePromoteToPreview() {
    if (!result?.imageBase64) return;
    setPromoting(true);
    setError(null);
    setPromotedMsg(null);
    try {
      const res = await fetch("/api/admin/storybook-styles/promote-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          imageBase64: result.imageBase64,
          slug: slug || "style",
          alt: title || slug || "Storybook style preview",
        }),
      });
      const data = (await res.json()) as {
        mediaId?: number | string;
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.mediaId) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      dispatch({
        type: "UPDATE",
        path: "previewImage",
        value: data.mediaId,
      });
      setModified(true);
      setPromotedMsg(
        tAdmin(
          adminLang,
          "Превью загружено в Медиа и подставлено в карточку стиля. Нажмите «Сохранить» вверху справа.",
          "Прев'ю завантажено в Медіа і підставлено в картку стилю. Натисніть «Зберегти» вгорі праворуч."
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Promote failed");
    } finally {
      setPromoting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {tAdmin(
                adminLang,
                "Песочница стиля (быстрый тест на контрольной сцене)",
                "Пісочниця стилю (швидкий тест на контрольній сцені)"
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--theme-elevation-600)", marginTop: 2 }}>
              {tAdmin(
                adminLang,
                "Берёт текущий несохранённый промпт стиля, медиум и anti-ripple из соседней вкладки. Тратит 1 вызов image-модели.",
                "Бере поточний незбережений промпт стилю, медіум та anti-ripple із сусідньої вкладки. Витрачає 1 виклик image-моделі."
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(240px, 2fr) minmax(180px, 1fr)",
            gap: 12,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>
              {tAdmin(adminLang, "Контрольная сцена", "Контрольна сцена")}
            </span>
            <select
              value={presetId}
              onChange={(e) => handlePresetChange(e.target.value)}
              style={{
                padding: "7px 10px",
                borderRadius: 6,
                border: "1px solid var(--theme-elevation-200)",
                background: "var(--theme-bg)",
                color: "var(--theme-text)",
                fontSize: 13,
              }}
            >
              {STORYBOOK_STYLE_TEST_SCENES.map((s) => (
                <option key={s.id} value={s.id}>
                  {adminLang === "uk" ? s.labelUk : s.labelRu}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>
              {tAdmin(adminLang, "Формат кадра", "Формат кадру")}
            </span>
            <select
              value={size}
              onChange={(e) =>
                setSize(e.target.value as "1024x1024" | "1536x1024" | "1024x1536")
              }
              style={{
                padding: "7px 10px",
                borderRadius: 6,
                border: "1px solid var(--theme-elevation-200)",
                background: "var(--theme-bg)",
                color: "var(--theme-text)",
                fontSize: 13,
              }}
            >
              <option value="1536x1024">
                {tAdmin(adminLang, "1536×1024 (Карточка 16:10 / Панорама)", "1536×1024 (Картка 16:10 / Панорама)")}
              </option>
              <option value="1024x1024">
                {tAdmin(adminLang, "1024×1024 (Классическая страница)", "1024×1024 (Класична сторінка)")}
              </option>
              <option value="1024x1536">
                {tAdmin(adminLang, "1024×1536 (Обложка книги)", "1024×1536 (Обкладинка книги)")}
              </option>
            </select>
          </label>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
          <span style={{ fontWeight: 600 }}>
            {tAdmin(adminLang, "Описание тестовой сцены (можно редактировать)", "Опис тестової сцени (можна редагувати)")}
          </span>
          <textarea
            rows={3}
            value={scenePrompt}
            onChange={(e) => setScenePrompt(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid var(--theme-elevation-200)",
              background: "var(--theme-bg)",
              color: "var(--theme-text)",
              fontSize: 13,
              lineHeight: 1.45,
              resize: "vertical",
            }}
          />
        </label>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => void runGenerate()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 7,
              border: "1px solid var(--theme-elevation-250)",
              background: "var(--theme-text)",
              color: "var(--theme-bg)",
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? "wait" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {busy
              ? tAdmin(adminLang, "Генерация кадра...", "Генерація кадру...")
              : tAdmin(adminLang, "Сгенерировать тестовый кадр", "Згенерувати тестовий кадр")}
          </button>

          {result && (
            <button
              type="button"
              disabled={promoting}
              onClick={() => void handlePromoteToPreview()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 7,
                border: "1px solid var(--theme-success-500, #22c55e)",
                background: "transparent",
                color: "var(--theme-text)",
                fontSize: 13,
                fontWeight: 600,
                cursor: promoting ? "wait" : "pointer",
              }}
            >
              {promoting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ImageIcon size={15} />
              )}
              {tAdmin(
                adminLang,
                "Установить как превью стиля",
                "Встановити як прев'ю стилю"
              )}
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 7,
              border: "1px solid rgba(239,68,68,0.45)",
              background: "rgba(239,68,68,0.1)",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {promotedMsg && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 7,
              border: "1px solid rgba(34,197,94,0.45)",
              background: "rgba(34,197,94,0.1)",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Check size={16} />
            <span>{promotedMsg}</span>
          </div>
        )}
      </div>

      {result && (
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
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              fontSize: 12,
              color: "var(--theme-elevation-650)",
            }}
          >
            <span>
              <strong>{result.model}</strong> · {result.quality} · {result.size} ·{" "}
              {result.elapsedSec.toFixed(1)}s
            </span>
            <button
              type="button"
              onClick={() => setShowFullPrompt((v) => !v)}
              style={{
                background: "none",
                border: "none",
                color: "var(--theme-text)",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {showFullPrompt
                ? tAdmin(adminLang, "Скрыть итоговый промпт", "Сховати підсумковий промпт")
                : tAdmin(adminLang, "Показать итоговый промпт", "Показати підсумковий промпт")}
            </button>
          </div>

          {showFullPrompt && (
            <pre
              style={{
                margin: 0,
                padding: 12,
                borderRadius: 6,
                background: "var(--theme-bg)",
                border: "1px solid var(--theme-elevation-150)",
                fontSize: 12,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.45,
              }}
            >
              {result.finalPrompt}
            </pre>
          )}

          <div
            style={{
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid var(--theme-elevation-150)",
              background: "#0d111a",
            }}
          >
            <img
              src={result.imageDataUrl}
              alt="Style test preview"
              style={{ width: "100%", maxHeight: 540, objectFit: "contain", display: "block" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default StorybookStyleTester;
