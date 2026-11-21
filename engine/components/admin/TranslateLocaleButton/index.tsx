"use client";

import React, { useState } from "react";
import {
  useDocumentInfo,
  useForm,
  useFormFields,
  useLocale,
} from "@payloadcms/ui";
import { useAIEnabled } from "../DomainGenerateButtons/useAIEnabled";
import { htmlToLexical } from "../PostAiButtons/htmlToLexical";

type LangCode = "uk" | "ru";

type FieldDispatch = (action: {
  type: "UPDATE";
  path: string;
  value: unknown;
  initialValue: unknown;
}) => void;

const DEFAULT_TRANSLATABLE_FIELDS = [
  "siteName",
  "tagline",
  "address",
  "footerText",
  "copyrightText",
  "title",
  "subheading",
  "h1",
  "heroFootnote",
  "short",
  "shortDescription",
  "description",
  "lead",
  "excerpt",
  "alt",
  "content",
  "meta.title",
  "meta.description",
];

function isLexicalValue(val: unknown): val is { root: { children: unknown[] } } {
  return (
    typeof val === "object" &&
    val !== null &&
    "root" in val &&
    typeof (val as { root?: unknown }).root === "object" &&
    (val as { root?: { children?: unknown } }).root !== null &&
    Array.isArray((val as { root: { children?: unknown } }).root.children)
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderLexicalNode(node: Record<string, unknown>): string {
  const type = String(node.type || "");
  if (type === "text") {
    let out = escapeHtml(String(node.text || ""));
    const fmt = typeof node.format === "number" ? node.format : 0;
    if (fmt & 1) out = `<strong>${out}</strong>`;
    if (fmt & 2) out = `<em>${out}</em>`;
    if (fmt & 8) out = `<u>${out}</u>`;
    if (fmt & 16) out = `<code>${out}</code>`;
    return out;
  }
  if (type === "linebreak") return "<br />";

  const children = Array.isArray(node.children)
    ? (node.children as Record<string, unknown>[]).map(renderLexicalNode).join("")
    : "";

  if (type === "paragraph") return children ? `<p>${children}</p>` : "";
  if (type === "heading") {
    const tag = String(node.tag || "h2");
    return `<${tag}>${children}</${tag}>`;
  }
  if (type === "quote") return `<blockquote>${children}</blockquote>`;
  if (type === "list") {
    const tag = node.listType === "number" ? "ol" : "ul";
    return `<${tag}>${children}</${tag}>`;
  }
  if (type === "listitem") return `<li>${children}</li>`;
  if (type === "link" || type === "autolink") return children;
  return children;
}

function lexicalToHtml(val: unknown): string {
  if (!isLexicalValue(val)) return "";
  return (val.root.children as Record<string, unknown>[])
    .map(renderLexicalNode)
    .filter(Boolean)
    .join("\n");
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cur[p] !== "object" || cur[p] === null) {
      cur[p] = {};
    }
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

interface ArrayFieldMeta {
  arrayPath: string;
  children: Array<{ path: string; isRichText: boolean }>;
}

function collectLocalizedMetaFromConfig(
  fields: unknown[] | undefined,
  prefix = ""
): {
  scalar: Array<{ path: string; isRichText: boolean }>;
  arrays: ArrayFieldMeta[];
} {
  const scalar: Array<{ path: string; isRichText: boolean }> = [];
  const arrays: ArrayFieldMeta[] = [];
  if (!Array.isArray(fields)) return { scalar, arrays };

  for (const raw of fields) {
    if (typeof raw !== "object" || raw === null) continue;
    const f = raw as Record<string, unknown>;
    const type = String(f.type || "");
    const name = typeof f.name === "string" ? f.name : "";
    const nextPath = name ? (prefix ? `${prefix}.${name}` : name) : prefix;

    if (
      (type === "text" || type === "textarea" || type === "richText") &&
      name &&
      f.localized === true
    ) {
      scalar.push({ path: nextPath, isRichText: type === "richText" });
    } else if (type === "array" && name && Array.isArray(f.fields)) {
      const sub = collectLocalizedMetaFromConfig(f.fields, "");
      if (sub.scalar.length > 0) {
        arrays.push({ arrayPath: nextPath, children: sub.scalar });
      }
    } else if (type === "group" && Array.isArray(f.fields)) {
      const sub = collectLocalizedMetaFromConfig(f.fields, nextPath);
      scalar.push(...sub.scalar);
      arrays.push(...sub.arrays);
    } else if ((type === "row" || type === "collapsible") && Array.isArray(f.fields)) {
      const sub = collectLocalizedMetaFromConfig(f.fields, prefix);
      scalar.push(...sub.scalar);
      arrays.push(...sub.arrays);
    } else if (type === "tabs" && Array.isArray(f.tabs)) {
      for (const tab of f.tabs as Array<Record<string, unknown>>) {
        const tabPrefix =
          typeof tab.name === "string"
            ? prefix
              ? `${prefix}.${tab.name}`
              : tab.name
            : prefix;
        const sub = collectLocalizedMetaFromConfig(
          tab.fields as unknown[] | undefined,
          tabPrefix
        );
        scalar.push(...sub.scalar);
        arrays.push(...sub.arrays);
      }
    }
  }

  return { scalar, arrays };
}

export function TranslateLocaleButton() {
  const aiEnabled = useAIEnabled();
  const locale = useLocale();
  const docInfo = useDocumentInfo();
  const dispatch = useFormFields(([, d]) => d) as FieldDispatch;
  const { getDataByPath, setModified } = useForm();

  const [busyDir, setBusyDir] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  if (aiEnabled === false) return null;

  const currentLocale: LangCode = locale?.code === "ru" ? "ru" : "uk";
  const docConfig = docInfo?.docConfig as
    | { fields?: unknown[] }
    | undefined;

  const discovered = collectLocalizedMetaFromConfig(docConfig?.fields);
  const fieldMetaMap = new Map<string, boolean>();
  for (const item of discovered.scalar) {
    fieldMetaMap.set(item.path, item.isRichText);
  }
  const arrayFieldsMeta = discovered.arrays;
  if (fieldMetaMap.size === 0 && arrayFieldsMeta.length === 0) {
    for (const p of DEFAULT_TRANSLATABLE_FIELDS) {
      fieldMetaMap.set(p, p === "content");
    }
  }

  const getApiEndpoint = (): string | null => {
    if (docInfo?.globalSlug) return `/api/globals/${docInfo.globalSlug}`;
    if (docInfo?.collectionSlug && docInfo?.id != null) {
      return `/api/${docInfo.collectionSlug}/${docInfo.id}`;
    }
    return null;
  };

  function extractTextVal(
    val: unknown,
    isRichText: boolean
  ): { text: string; isRich: boolean } | null {
    if (isRichText || isLexicalValue(val)) {
      const html = lexicalToHtml(val);
      return html.trim() ? { text: html, isRich: true } : null;
    }
    if (typeof val === "string" && val.trim()) {
      return { text: val, isRich: false };
    }
    return null;
  }

  async function extractFromCurrentForm(): Promise<{
    plainFields: Record<string, string>;
    richTextPaths: Set<string>;
  }> {
    const plainFields: Record<string, string> = {};
    const richTextPaths = new Set<string>();

    for (const [path, isRichText] of fieldMetaMap.entries()) {
      const extracted = extractTextVal(getDataByPath<unknown>(path), isRichText);
      if (extracted) {
        plainFields[path] = extracted.text;
        if (extracted.isRich) richTextPaths.add(path);
      }
    }

    for (const arrMeta of arrayFieldsMeta) {
      const rows = getDataByPath<unknown>(arrMeta.arrayPath);
      if (!Array.isArray(rows)) continue;
      rows.forEach((row, idx) => {
        if (!row || typeof row !== "object") return;
        for (const child of arrMeta.children) {
          const fullPath = `${arrMeta.arrayPath}.${idx}.${child.path}`;
          const val = getNestedValue(row as Record<string, unknown>, child.path);
          const extracted = extractTextVal(val, child.isRichText);
          if (extracted) {
            plainFields[fullPath] = extracted.text;
            if (extracted.isRich) richTextPaths.add(fullPath);
          }
        }
      });
    }

    return { plainFields, richTextPaths };
  }

  async function extractFromSavedLocale(sourceLang: LangCode): Promise<{
    plainFields: Record<string, string>;
    richTextPaths: Set<string>;
  }> {
    const endpoint = getApiEndpoint();
    if (!endpoint) return { plainFields: {}, richTextPaths: new Set() };

    const res = await fetch(
      `${endpoint}?locale=${sourceLang}&fallback-locale=none&depth=0`,
      { cache: "no-store" }
    );
    if (!res.ok) return { plainFields: {}, richTextPaths: new Set() };

    const data = (await res.json()) as Record<string, unknown>;
    const plainFields: Record<string, string> = {};
    const richTextPaths = new Set<string>();

    for (const [path, isRichText] of fieldMetaMap.entries()) {
      const extracted = extractTextVal(getNestedValue(data, path), isRichText);
      if (extracted) {
        plainFields[path] = extracted.text;
        if (extracted.isRich) richTextPaths.add(path);
      }
    }

    for (const arrMeta of arrayFieldsMeta) {
      const rows = getNestedValue(data, arrMeta.arrayPath);
      if (!Array.isArray(rows)) continue;
      rows.forEach((row, idx) => {
        if (!row || typeof row !== "object") return;
        for (const child of arrMeta.children) {
          const fullPath = `${arrMeta.arrayPath}.${idx}.${child.path}`;
          const val = getNestedValue(row as Record<string, unknown>, child.path);
          const extracted = extractTextVal(val, child.isRichText);
          if (extracted) {
            plainFields[fullPath] = extracted.text;
            if (extracted.isRich) richTextPaths.add(fullPath);
          }
        }
      });
    }

    return { plainFields, richTextPaths };
  }

  async function handleTranslate(sourceLang: LangCode, targetLang: LangCode) {
    const dirKey = `${sourceLang}->${targetLang}`;
    setBusyDir(dirKey);
    setNotice(null);

    try {
      let sourceExtracted: {
        plainFields: Record<string, string>;
        richTextPaths: Set<string>;
      };

      if (currentLocale === targetLang) {
        sourceExtracted = await extractFromSavedLocale(sourceLang);
        if (Object.keys(sourceExtracted.plainFields).length === 0) {
          sourceExtracted = await extractFromCurrentForm();
        }
      } else {
        sourceExtracted = await extractFromCurrentForm();
      }

      if (Object.keys(sourceExtracted.plainFields).length === 0) {
        setNotice({
          ok: false,
          text:
            currentLocale === targetLang
              ? `Не найдено заполненных полей в локали ${sourceLang.toUpperCase()} (или в текущей форме) для перевода.`
              : `Заполните хотя бы одно поле в текущей локали (${sourceLang.toUpperCase()}) перед переводом.`,
        });
        return;
      }

      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLang,
          targetLang,
          fields: sourceExtracted.plainFields,
        }),
      });

      const json = (await res.json()) as {
        translated?: Record<string, string>;
        error?: string;
      };

      if (!res.ok || !json.translated) {
        throw new Error(json.error || "Ошибка ИИ-перевода");
      }

      const translated = json.translated;

      if (currentLocale === targetLang) {
        for (const [path, translatedText] of Object.entries(translated)) {
          const isRich = sourceExtracted.richTextPaths.has(path);
          const nextValue = isRich
            ? htmlToLexical(translatedText)
            : translatedText;
          dispatch({
            type: "UPDATE",
            path,
            value: nextValue,
            initialValue: nextValue,
          });
        }
        setModified(true);
        setNotice({
          ok: true,
          text: `Переведено с ${sourceLang.toUpperCase()} на ${targetLang.toUpperCase()} и подставлено в форму. Проверьте и нажмите Save.`,
        });
      } else {
        const endpoint = getApiEndpoint();
        if (!endpoint) {
          setNotice({
            ok: false,
            text: `Сначала сохраните новый документ в ${sourceLang.toUpperCase()} (или переключитесь на вкладку ${targetLang.toUpperCase()}) перед переводом.`,
          });
          return;
        }

        const patchBody: Record<string, unknown> = {};
        const arrayPathSet = new Set(arrayFieldsMeta.map((a) => a.arrayPath));
        const touchedArrays = new Map<
          string,
          Array<{ idx: number; subPath: string; value: unknown }>
        >();

        for (const [path, translatedText] of Object.entries(translated)) {
          const isRich = sourceExtracted.richTextPaths.has(path);
          const nextValue = isRich
            ? htmlToLexical(translatedText)
            : translatedText;

          let matchedArray: string | null = null;
          for (const arrPath of arrayPathSet) {
            if (path.startsWith(`${arrPath}.`)) {
              matchedArray = arrPath;
              break;
            }
          }

          if (matchedArray) {
            const rest = path.slice(matchedArray.length + 1);
            const dot = rest.indexOf(".");
            const idx = Number(dot === -1 ? rest : rest.slice(0, dot));
            const subPath = dot === -1 ? "" : rest.slice(dot + 1);
            if (Number.isInteger(idx) && idx >= 0 && subPath) {
              const list = touchedArrays.get(matchedArray) ?? [];
              list.push({ idx, subPath, value: nextValue });
              touchedArrays.set(matchedArray, list);
            }
          } else {
            setNestedValue(patchBody, path, nextValue);
          }
        }

        if (touchedArrays.size > 0) {
          const existingRes = await fetch(
            `${endpoint}?locale=${targetLang}&depth=0`,
            { cache: "no-store" }
          );
          const existingDoc = existingRes.ok
            ? ((await existingRes.json()) as Record<string, unknown>)
            : {};

          for (const [arrPath, updates] of touchedArrays.entries()) {
            const baseArr = getNestedValue(existingDoc, arrPath);
            const cloned = Array.isArray(baseArr)
              ? baseArr.map((row) =>
                  row && typeof row === "object"
                    ? { ...(row as Record<string, unknown>) }
                    : {}
                )
              : [];
            for (const u of updates) {
              while (cloned.length <= u.idx) cloned.push({});
              setNestedValue(cloned[u.idx], u.subPath, u.value);
            }
            setNestedValue(patchBody, arrPath, cloned);
          }
        }

        const patchRes = await fetch(`${endpoint}?locale=${targetLang}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchBody),
        });

        if (!patchRes.ok) {
          const errData = (await patchRes.json().catch(() => ({}))) as {
            errors?: Array<{ message?: string }>;
          };
          throw new Error(
            errData.errors?.[0]?.message ||
              `Не удалось сохранить перевод в локаль ${targetLang.toUpperCase()}`
          );
        }

        setNotice({
          ok: true,
          text: `Перевод ${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()} сохранён в локаль ${targetLang.toUpperCase()}. Переключите язык вверху, чтобы просмотреть.`,
        });
      }
    } catch (err) {
      setNotice({
        ok: false,
        text: err instanceof Error ? err.message : "Translation failed",
      });
    } finally {
      setBusyDir(null);
    }
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: "9px 14px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: busyDir ? "not-allowed" : "pointer",
    opacity: busyDir && !active ? 0.55 : 1,
    borderRadius: "6px",
    border: "1px solid var(--theme-elevation-200)",
    background: "var(--theme-elevation-50)",
    color: "var(--theme-text)",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    lineHeight: 1.2,
  });

  return (
    <div
      style={{
        margin: "0 0 20px",
        padding: "14px 16px",
        borderRadius: "8px",
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
          gap: "10px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--theme-text)",
            }}
          >
            ИИ-переводчик локалей (UA ↔ RU) · Активная вкладка:{" "}
            <span style={{ textTransform: "uppercase" }}>{currentLocale}</span>
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--theme-elevation-500)",
              marginTop: "2px",
            }}
          >
            Пишите на русском и переводите в украинский (или наоборот) в один клик.
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button
            type="button"
            disabled={busyDir !== null}
            onClick={() => void handleTranslate("ru", "uk")}
            style={btnStyle(busyDir === "ru->uk")}
          >
            {busyDir === "ru->uk"
              ? "⏳ Переводим RU → UA…"
              : "🇷🇺 → 🇺🇦 Перевести с RU на UA"}
          </button>
          <button
            type="button"
            disabled={busyDir !== null}
            onClick={() => void handleTranslate("uk", "ru")}
            style={btnStyle(busyDir === "uk->ru")}
          >
            {busyDir === "uk->ru"
              ? "⏳ Переводим UA → RU…"
              : "🇺🇦 → 🇷🇺 Перевести с UA на RU"}
          </button>
        </div>
      </div>

      {notice && (
        <div
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            border: notice.ok
              ? "1px solid rgba(16, 185, 129, 0.45)"
              : "1px solid rgba(239, 68, 68, 0.45)",
            background: notice.ok
              ? "rgba(16, 185, 129, 0.1)"
              : "rgba(239, 68, 68, 0.1)",
            color: notice.ok ? "#10b981" : "#ef4444",
          }}
        >
          {notice.text}
        </div>
      )}
    </div>
  );
}

export default TranslateLocaleButton;
