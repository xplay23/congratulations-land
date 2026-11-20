"use client";

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";

interface Report {
  ok: boolean;
  error?: string;
  usdToUah: { value: number | null; source: string; date?: string };
  textModels: Array<{
    modelId: string;
    role: string;
    status: "updated" | "not_found";
    inputPer1M?: number;
    outputPer1M?: number;
  }>;
  imageModel: { modelId: string; status: "updated" | "not_found"; presets: number };
  notes: string[];
}

export function AiRatesRefreshButton() {
  const lang = useAdminLang();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setFatal(null);
    setReport(null);
    try {
      const res = await fetch("/api/ai/economics/refresh", { method: "POST" });
      const data = (await res.json()) as Report & { error?: string };
      if (!res.ok && !data.textModels) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setReport(data);
    } catch (err) {
      setFatal(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        margin: "0 0 20px",
        padding: "14px 16px",
        borderRadius: 8,
        border: "1px solid var(--theme-elevation-150)",
        background: "var(--theme-elevation-50)",
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
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--theme-text)" }}>
            {tAdmin(
              lang,
              "Автообновление цен моделей и курса USD → UAH",
              "Автооновлення цін моделей та курсу USD → UAH"
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--theme-elevation-500)",
              marginTop: 2,
              maxWidth: 560,
            }}
          >
            {tAdmin(
              lang,
              "Берёт модели, выбранные в настройках ИИ, и подтягивает их цены из открытого реестра LiteLLM + курс НБУ. Сохраняется сразу.",
              "Бере моделі, обрані в налаштуваннях ШІ, і підтягує їхні ціни з відкритого реєстру LiteLLM + курс НБУ. Зберігається одразу."
            )}
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 6,
            border: "1px solid var(--theme-text)",
            background: "var(--theme-text)",
            color: "var(--theme-bg)",
            cursor: busy ? "wait" : "pointer",
            opacity: busy ? 0.65 : 1,
          }}
        >
          <RefreshCw size={14} className={busy ? "animate-spin" : undefined} />
          {busy
            ? tAdmin(lang, "Обновляем…", "Оновлюємо…")
            : tAdmin(lang, "Обновить цены и курс", "Оновити ціни та курс")}
        </button>
      </div>

      {fatal && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--theme-error-500, #dc2626)" }}>
          {fatal}
        </div>
      )}

      {report && (
        <div style={{ marginTop: 12, fontSize: 12.5, display: "grid", gap: 6 }}>
          {report.error && (
            <div style={{ color: "var(--theme-error-500, #dc2626)" }}>{report.error}</div>
          )}
          <div>
            <strong>USD → UAH:</strong>{" "}
            {report.usdToUah.value
              ? `${report.usdToUah.value} ₴ (${report.usdToUah.source}${
                  report.usdToUah.date ? `, ${report.usdToUah.date}` : ""
                })`
              : tAdmin(lang, "не обновлён", "не оновлено")}
          </div>
          {report.textModels.map((m) => (
            <div
              key={m.modelId}
              style={{
                color:
                  m.status === "updated"
                    ? "var(--theme-success-500, #16a34a)"
                    : "var(--theme-warning-500, #d97706)",
              }}
            >
              {m.status === "updated" ? "✓" : "⚠"} <strong>{m.modelId}</strong> — {m.role}
              {m.status === "updated"
                ? `: $${m.inputPer1M} / $${m.outputPer1M} за 1M`
                : tAdmin(
                    lang,
                    ": нет в реестре — оставлена текущая цена",
                    ": немає в реєстрі — залишено поточну ціну"
                  )}
            </div>
          ))}
          <div
            style={{
              color:
                report.imageModel.status === "updated"
                  ? "var(--theme-success-500, #16a34a)"
                  : "var(--theme-warning-500, #d97706)",
            }}
          >
            {report.imageModel.status === "updated" ? "✓" : "⚠"}{" "}
            <strong>{report.imageModel.modelId || "image"}</strong>
            {report.imageModel.status === "updated"
              ? tAdmin(
                  lang,
                  ` — обновлено ${report.imageModel.presets} пресетов цен изображений`,
                  ` — оновлено ${report.imageModel.presets} пресетів цін зображень`
                )
              : tAdmin(lang, " — нет в реестре, цены изображений не менялись", " — немає в реєстрі, ціни зображень не змінювались")}
          </div>
          {report.notes.map((n) => (
            <div key={n} style={{ color: "var(--theme-elevation-500)" }}>
              ℹ {n}
            </div>
          ))}
          {report.ok && (
            <div>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  marginTop: 4,
                  padding: "6px 12px",
                  fontSize: 12.5,
                  borderRadius: 6,
                  border: "1px solid var(--theme-elevation-200)",
                  background: "var(--theme-elevation-100)",
                  color: "var(--theme-text)",
                  cursor: "pointer",
                }}
              >
                {tAdmin(lang, "Перезагрузить форму", "Перезавантажити форму")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AiRatesRefreshButton;
