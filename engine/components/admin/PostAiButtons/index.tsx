"use client";

import React, { useState } from "react";
import { useForm, useFormFields, useLocale } from "@payloadcms/ui";
import { Sparkles } from "lucide-react";
import { useAIEnabled } from "../DomainGenerateButtons/useAIEnabled";
import { htmlToLexical } from "./htmlToLexical";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";

type FieldDispatch = (action: {
  type: "UPDATE" | "ADD_ROW" | "REMOVE_ROW";
  path: string;
  value?: unknown;
  initialValue?: unknown;
  rowIndex?: number;
  subFieldState?: Record<
    string,
    { value: unknown; initialValue: unknown; valid: boolean }
  >;
}) => void;

type GenAction =
  | "post-title"
  | "post-excerpt"
  | "post-content"
  | "post-categorization"
  | "post-seo"
  | "all";

export function PostAiButtons() {
  const aiEnabled = useAIEnabled();
  const locale = useLocale();
  const adminLang = useAdminLang();
  const dispatch = useFormFields(([, d]) => d) as FieldDispatch;
  const { getDataByPath, setModified } = useForm();

  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState<GenAction | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  if (aiEnabled === false) return null;

  const contentLocale = locale?.code === "ru" ? "ru" : "uk";

  async function callGenerate(
    type: string,
    context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        context: {
          locale: contentLocale,
          brief: brief.trim(),
          ...context,
        },
      }),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(String(data.error || `HTTP ${res.status}`));
    }
    return data;
  }

  function setField(path: string, value: unknown) {
    dispatch({
      type: "UPDATE",
      path,
      value,
      initialValue: value,
    });
    setModified(true);
  }

  async function runSingle(action: Exclude<GenAction, "all">): Promise<void> {
    const title = String(getDataByPath("title") || "").trim();
    const excerpt = String(getDataByPath("excerpt") || "").trim();
    const lead = String(getDataByPath("lead") || "").trim();

    if (action === "post-title") {
      const data = await callGenerate("post-title", { title, excerpt });
      const text = String(data.text || "").trim().replace(/^["«]|["»]$/g, "");
      if (text) setField("title", text);
      return;
    }

    if (action === "post-excerpt") {
      const data = await callGenerate("post-excerpt", { title, excerpt, lead });
      const text = String(data.text || "").trim();
      if (text) {
        setField("excerpt", text);
        if (!lead) setField("lead", text);
      }
      return;
    }

    if (action === "post-content") {
      const data = await callGenerate("post-content", {
        title,
        excerpt,
        additionalContext: lead,
      });
      const html = String(data.text || "").trim();
      if (html) {
        const lexical = htmlToLexical(html);
        setField("content", lexical);
      }
      return;
    }

    if (action === "post-categorization") {
      let categoriesText = "";
      let categoryDocs: Array<{ id: number | string; slug?: string; label?: string }> = [];
      try {
        const catRes = await fetch(
          `/api/post-categories?limit=50&locale=${contentLocale}`,
          { cache: "no-store" }
        );
        if (catRes.ok) {
          const catJson = (await catRes.json()) as {
            docs?: Array<{ id: number | string; slug?: string; label?: string }>;
          };
          categoryDocs = catJson.docs ?? [];
          categoriesText = categoryDocs
            .map((c) => `${c.slug} (${c.label || c.slug})`)
            .join(", ");
        }
      } catch {
        // ignore category fetch failure
      }

      const data = await callGenerate("post-categorization", {
        title,
        excerpt,
        allPostCategories: categoriesText,
      });
      const obj = (data.object ?? data) as {
        category?: string;
        tags?: string[];
      };

      if (obj.category && categoryDocs.length > 0) {
        const needle = obj.category.toLowerCase();
        const found = categoryDocs.find(
          (c) =>
            (c.slug && needle.includes(c.slug.toLowerCase())) ||
            (c.label && needle.includes(c.label.toLowerCase()))
        );
        if (found) setField("category", found.id);
      }

      if (Array.isArray(obj.tags) && obj.tags.length > 0) {
        const cleaned = obj.tags
          .map((t) => String(t).trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 6);
        const existing = getDataByPath<Array<{ tag?: string }>>("tags") ?? [];
        for (let i = existing.length - 1; i >= 0; i--) {
          dispatch({ type: "REMOVE_ROW", path: "tags", rowIndex: i });
        }
        cleaned.forEach((tag, idx) => {
          dispatch({
            type: "ADD_ROW",
            path: "tags",
            rowIndex: idx,
            subFieldState: {
              tag: { value: tag, initialValue: tag, valid: true },
            },
          });
        });
        setModified(true);
      }
      return;
    }

    if (action === "post-seo") {
      const data = await callGenerate("post-seo", { title, excerpt });
      const obj = (data.object ?? data) as {
        metaTitle?: string;
        metaDescription?: string;
      };
      if (obj.metaTitle) setField("meta.title", obj.metaTitle);
      if (obj.metaDescription) setField("meta.description", obj.metaDescription);
    }
  }

  async function handleAction(action: GenAction) {
    setBusy(action);
    setNotice(null);
    try {
      if (action === "all") {
        if (!String(getDataByPath("title") || "").trim()) {
          await runSingle("post-title");
        }
        await runSingle("post-excerpt");
        await runSingle("post-content");
        await runSingle("post-categorization");
        await runSingle("post-seo");
      } else {
        await runSingle(action);
      }
      setNotice({
        ok: true,
        text: tAdmin(
          adminLang,
          `Готово (${contentLocale.toUpperCase()}). Проверьте поля и сохраните статью.`,
          `Готово (${contentLocale.toUpperCase()}). Перевірте поля та збережіть статтю.`
        ),
      });
    } catch (err) {
      setNotice({
        ok: false,
        text: err instanceof Error ? err.message : "AI generation failed",
      });
    } finally {
      setBusy(null);
    }
  }

  const btnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 11px",
    borderRadius: "6px",
    border: "1px solid var(--theme-elevation-200)",
    background: "var(--theme-elevation-50)",
    color: "var(--theme-text)",
    fontSize: "12.5px",
    fontWeight: 500,
    cursor: busy ? "wait" : "pointer",
    opacity: busy ? 0.65 : 1,
  };

  const primaryBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: "var(--theme-text)",
    color: "var(--theme-bg)",
    borderColor: "var(--theme-text)",
  };

  return (
    <div
      style={{
        marginBottom: "18px",
        padding: "14px 16px",
        borderRadius: "8px",
        border: "1px solid var(--theme-elevation-150)",
        background: "var(--theme-elevation-50)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--theme-text)",
          }}
        >
          <Sparkles size={15} />
          {tAdmin(
            adminLang,
            `ИИ-генератор статьи (${contentLocale.toUpperCase()})`,
            `ШІ-генератор статті (${contentLocale.toUpperCase()})`
          )}
        </span>
        <span style={{ fontSize: "12px", color: "var(--theme-elevation-500)" }}>
          {tAdmin(
            adminLang,
            "Задайте тему (бриф) и нажмите нужную кнопку",
            "Задайте тему (бриф) і натисніть потрібну кнопку"
          )}
        </span>
      </div>

      <input
        type="text"
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder={tAdmin(
          adminLang,
          "Тема / бриф статьи (например: как выбрать подарок ребёнку 5 лет на День Святого Николая)...",
          "Тема / бриф статті (наприклад: як обрати подарунок дитині 5 років на День Святого Миколая)..."
        )}
        style={{
          width: "100%",
          padding: "8px 11px",
          borderRadius: "6px",
          border: "1px solid var(--theme-elevation-200)",
          background: "var(--theme-input-bg, var(--theme-bg))",
          color: "var(--theme-text)",
          fontSize: "13px",
        }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button
          type="button"
          disabled={Boolean(busy)}
          style={primaryBtnStyle}
          onClick={() => void handleAction("all")}
        >
          <Sparkles size={13} />
          {busy === "all"
            ? tAdmin(adminLang, "Генерация...", "Генерація...")
            : tAdmin(adminLang, "Сгенерировать всё", "Згенерувати все")}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          style={btnStyle}
          onClick={() => void handleAction("post-title")}
        >
          {busy === "post-title"
            ? "..."
            : tAdmin(adminLang, "Заголовок", "Заголовок")}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          style={btnStyle}
          onClick={() => void handleAction("post-excerpt")}
        >
          {busy === "post-excerpt"
            ? "..."
            : tAdmin(adminLang, "Анонс", "Анонс")}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          style={btnStyle}
          onClick={() => void handleAction("post-content")}
        >
          {busy === "post-content"
            ? "..."
            : tAdmin(adminLang, "Текст статьи", "Текст статті")}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          style={btnStyle}
          onClick={() => void handleAction("post-categorization")}
        >
          {busy === "post-categorization"
            ? "..."
            : tAdmin(adminLang, "Рубрика и теги", "Рубрика і теги")}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          style={btnStyle}
          onClick={() => void handleAction("post-seo")}
        >
          {busy === "post-seo" ? "..." : "SEO"}
        </button>
      </div>

      {notice && (
        <div
          style={{
            fontSize: "12.5px",
            color: notice.ok
              ? "var(--theme-success-500, #16a34a)"
              : "var(--theme-error-500, #dc2626)",
          }}
        >
          {notice.text}
        </div>
      )}
    </div>
  );
}

export default PostAiButtons;
