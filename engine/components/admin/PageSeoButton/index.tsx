"use client";

import React, { useState } from "react";
import { useForm, useFormFields, useLocale } from "@payloadcms/ui";
import { Sparkles } from "lucide-react";
import { useAIEnabled } from "../DomainGenerateButtons/useAIEnabled";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";

type FieldDispatch = (action: {
  type: "UPDATE";
  path: string;
  value: unknown;
  initialValue: unknown;
}) => void;

export function PageSeoButton() {
  const aiEnabled = useAIEnabled();
  const locale = useLocale();
  const adminLang = useAdminLang();
  const dispatch = useFormFields(([, d]) => d) as FieldDispatch;
  const { getDataByPath, setModified } = useForm();

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  if (aiEnabled === false) return null;

  const contentLocale = locale?.code === "ru" ? "ru" : "uk";

  async function handleGenerateSeo() {
    setBusy(true);
    setNotice(null);
    try {
      const pageTitle = String(
        getDataByPath("h1") || getDataByPath("title") || ""
      ).trim();
      const shortDesc = String(
        getDataByPath("shortDescription") ||
          getDataByPath("excerpt") ||
          getDataByPath("description") ||
          ""
      ).trim();
      const intro = String(
        getDataByPath("intro") || getDataByPath("lead") || ""
      ).trim();

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "page-seo",
          context: {
            locale: contentLocale,
            pageTitle: pageTitle || "VideoVitannya",
            pageContext: [shortDesc, intro].filter(Boolean).join("\n"),
          },
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        object?: { metaTitle?: string; metaDescription?: string };
      };
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const obj = data.object;
      if (obj?.metaTitle) {
        dispatch({
          type: "UPDATE",
          path: "meta.title",
          value: obj.metaTitle,
          initialValue: obj.metaTitle,
        });
      }
      if (obj?.metaDescription) {
        dispatch({
          type: "UPDATE",
          path: "meta.description",
          value: obj.metaDescription,
          initialValue: obj.metaDescription,
        });
      }
      setModified(true);
      setNotice({
        ok: true,
        text: tAdmin(
          adminLang,
          `SEO-метаданные сгенерированы (${contentLocale.toUpperCase()}).`,
          `SEO-метадані згенеровано (${contentLocale.toUpperCase()}).`
        ),
      });
    } catch (err) {
      setNotice({
        ok: false,
        text: err instanceof Error ? err.message : "Failed to generate SEO",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        marginBottom: "14px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleGenerateSeo()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "7px 12px",
          borderRadius: "6px",
          border: "1px solid var(--theme-elevation-200)",
          background: "var(--theme-elevation-50)",
          color: "var(--theme-text)",
          fontSize: "12.5px",
          fontWeight: 500,
          cursor: busy ? "wait" : "pointer",
          opacity: busy ? 0.65 : 1,
        }}
      >
        <Sparkles size={14} />
        {busy
          ? tAdmin(adminLang, "Генерация SEO...", "Генерація SEO...")
          : tAdmin(
              adminLang,
              `Сгенерировать SEO через ИИ (${contentLocale.toUpperCase()})`,
              `Згенерувати SEO через ШІ (${contentLocale.toUpperCase()})`
            )}
      </button>
      {notice && (
        <span
          style={{
            fontSize: "12.5px",
            color: notice.ok
              ? "var(--theme-success-500, #16a34a)"
              : "var(--theme-error-500, #dc2626)",
          }}
        >
          {notice.text}
        </span>
      )}
    </div>
  );
}

export default PageSeoButton;
