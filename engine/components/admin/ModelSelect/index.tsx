"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFormFields, useField } from "@payloadcms/ui";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";

type Provider = "openai" | "anthropic" | "google" | "elevenlabs";

type ApiError = { message: string; providerStatus?: number };

const PROVIDER_LINKS: Record<Provider, { dashboard: string; label: string }> = {
  openai: {
    dashboard: "https://platform.openai.com/api-keys",
    label: "OpenAI Dashboard",
  },
  anthropic: {
    dashboard: "https://console.anthropic.com/settings/keys",
    label: "Anthropic Console",
  },
  google: {
    dashboard: "https://aistudio.google.com/apikey",
    label: "Google AI Studio",
  },
  elevenlabs: {
    dashboard: "https://elevenlabs.io/app/settings/api-keys",
    label: "ElevenLabs API Keys",
  },
};

const IMAGE_MODEL_DOCS: Record<"openai" | "google", { link: string; label: string }> = {
  openai: {
    link: "https://platform.openai.com/docs/models",
    label: "OpenAI Image Models",
  },
  google: {
    link: "https://ai.google.dev/gemini-api/docs/models",
    label: "Google Gemini Image Models",
  },
};

function ErrorBanner({ err, provider }: { err: ApiError; provider?: Provider }) {
  const lang = useAdminLang();
  const link = provider ? PROVIDER_LINKS[provider] : undefined;

  const hintsRu: Record<number, string> = {
    401: "Неверный или отозванный API-ключ. Проверьте ключ в кабинете провайдера.",
    403: "У ключа нет прав на получение списка моделей. Проверьте разрешения ключа.",
    429: "Превышен лимит запросов или квота. Проверьте биллинг.",
    500: "Сбой на стороне провайдера. Попробуйте позже.",
    502: "Не удалось связаться с провайдером.",
    503: "Сервис провайдера временно недоступен.",
  };
  const hintsUk: Record<number, string> = {
    401: "Невірний або відкликаний API-ключ. Перевірте ключ у кабінеті провайдера.",
    403: "Ключ не має прав на отримання списку моделей. Перевірте дозволи ключа.",
    429: "Перевищено ліміт запитів або квоту. Перевірте білінг.",
    500: "Збій на стороні провайдера. Спробуйте пізніше.",
    502: "Не вдалося зв'язатися з провайдером.",
    503: "Сервіс провайдера тимчасово недоступний.",
  };

  const hint = err.providerStatus
    ? (lang === "uk" ? hintsUk : hintsRu)[err.providerStatus]
    : undefined;

  return (
    <div
      style={{
        background: "color-mix(in srgb, var(--adm-color-red, #ef4444) 10%, transparent)",
        border: "1px solid color-mix(in srgb, var(--adm-color-red, #ef4444) 35%, transparent)",
        borderRadius: "var(--adm-radius-sm, 6px)",
        padding: "10px 14px",
        marginTop: "10px",
        fontSize: "var(--adm-fs-caption, 13px)",
        lineHeight: 1.5,
        color: "var(--theme-text)",
      }}
    >
      <strong
        style={{
          fontSize: "var(--adm-fs-caption, 13px)",
          color: "var(--adm-color-red, #ef4444)",
          display: "block",
          marginBottom: "4px",
        }}
      >
        {tAdmin(lang, "Не удалось загрузить модели", "Не вдалося завантажити моделі")}
        {err.providerStatus ? (
          <span style={{ fontWeight: 400, marginLeft: "8px", opacity: 0.85 }}>
            · HTTP {err.providerStatus}
          </span>
        ) : null}
      </strong>
      <div style={{ opacity: 0.9, fontStyle: "italic" }}>&ldquo;{err.message}&rdquo;</div>
      {hint && <div style={{ marginTop: "6px" }}>{hint}</div>}
      {link && (
        <div style={{ marginTop: "6px" }}>
          <a
            href={link.dashboard}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--adm-color-blue, #3b82f6)" }}
          >
            → {link.label}
          </a>
        </div>
      )}
    </div>
  );
}

function ImageModelWarning({ provider }: { provider?: Provider }) {
  const lang = useAdminLang();
  const docs =
    provider === "openai" || provider === "google"
      ? IMAGE_MODEL_DOCS[provider]
      : null;
  return (
    <div
      style={{
        background: "color-mix(in srgb, var(--adm-color-amber, #f59e0b) 10%, transparent)",
        border: "1px solid color-mix(in srgb, var(--adm-color-amber, #f59e0b) 35%, transparent)",
        borderRadius: "var(--adm-radius-sm, 6px)",
        padding: "10px 14px",
        marginTop: "8px",
        marginBottom: "18px",
        fontSize: "var(--adm-fs-caption, 13px)",
        lineHeight: 1.5,
        color: "var(--theme-text)",
      }}
    >
      <strong
        style={{
          color: "var(--adm-color-amber, #f59e0b)",
          display: "block",
          marginBottom: "3px",
        }}
      >
        {tAdmin(
          lang,
          "Выберите модель с поддержкой генерации изображений",
          "Оберіть модель із підтримкою генерації зображень"
        )}
      </strong>
      <div style={{ opacity: 0.85 }}>
        {tAdmin(
          lang,
          "Не все модели провайдера умеют рисовать (например, для OpenAI выбирайте gpt-image-*).",
          "Не всі моделі провайдера вміють малювати (наприклад, для OpenAI обирайте gpt-image-*)."
        )}
      </div>
      {docs && (
        <div style={{ marginTop: "4px" }}>
          <a
            href={docs.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--adm-color-blue, #3b82f6)" }}
          >
            → {docs.label}
          </a>
        </div>
      )}
    </div>
  );
}

interface Props {
  /** Path of the model field this component controls */
  modelFieldPath: string;
  /** Path of the provider select field to read (omit when fixedProvider is set) */
  providerFieldPath?: string;
  /** Fixed provider (e.g. "elevenlabs") */
  fixedProvider?: Provider;
  /** Path of the api key field to read */
  apiKeyFieldPath: string;
  /** Server-side fallback scope if the form apiKey field is empty */
  fallbackScope?: "ai-text" | "ai-image" | "elevenlabs";
  /** Optional custom field label */
  label?: string;
  /** When true shows the image-model warning banner */
  imageMode?: boolean;
}

export default function ModelSelect({
  modelFieldPath,
  providerFieldPath,
  fixedProvider,
  apiKeyFieldPath,
  fallbackScope,
  label,
  imageMode = false,
}: Props) {
  const lang = useAdminLang();
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [infoNote, setInfoNote] = useState<string | null>(null);

  const fields = useFormFields(([f]) => f);
  const { setValue: setModel, value: currentModel } = useField<string>({
    path: modelFieldPath,
  });

  const provider = (
    fixedProvider ??
    (providerFieldPath ? (fields[providerFieldPath]?.value as Provider | undefined) : undefined)
  );
  const apiKey = (fields[apiKeyFieldPath]?.value as string | undefined) || "";

  const fetchedFor = useRef<string>("");

  useEffect(() => {
    if (!provider) return;
    if (!apiKey && !fallbackScope) return;

    const key = `${provider}:${apiKey || "__fallback__"}:${fallbackScope || ""}`;
    if (fetchedFor.current === key) return;
    fetchedFor.current = key;

    setLoading(true);
    setError(null);
    setInfoNote(null);
    setModels([]);

    const params = new URLSearchParams({ provider });
    if (apiKey) params.set("apiKey", apiKey);
    if (fallbackScope) params.set("fallbackScope", fallbackScope);

    fetch(`/api/ai/models?${params.toString()}`)
      .then(async (res) => {
        const data: unknown = await res.json();
        if (!res.ok) {
          const d = data as Record<string, unknown>;
          setError({
            message: typeof d.error === "string" ? d.error : `HTTP ${res.status}`,
            providerStatus:
              typeof d.providerStatus === "number" ? d.providerStatus : res.status,
          });
          return;
        }
        const obj = data as {
          models?: string[];
          source?: string;
          note?: string;
        };
        setModels(obj.models ?? []);
        if (obj.note) setInfoNote(obj.note);
      })
      .catch(() => {
        setError({
          message: tAdmin(
            lang,
            "Сетевая ошибка — не удалось связаться с сервером.",
            "Мережева помилка — не вдалося зв'язатися з сервером."
          ),
          providerStatus: 0,
        });
      })
      .finally(() => setLoading(false));
  }, [provider, apiKey, fallbackScope, lang]);

  if (!provider || (!apiKey && !fallbackScope)) return null;

  const fieldLabel =
    label || tAdmin(lang, "Модель", "Модель");

  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        className="field-label"
        style={{
          display: "block",
          marginBottom: "6px",
          color: "var(--theme-text)",
        }}
      >
        {fieldLabel}
      </label>

      {loading && (
        <p
          style={{
            fontSize: "var(--adm-fs-caption, 13px)",
            color: "var(--adm-color-muted)",
            margin: "0 0 8px",
          }}
        >
          {tAdmin(lang, "Загрузка списка моделей…", "Завантаження списку моделей…")}
        </p>
      )}

      {error && <ErrorBanner err={error} provider={provider} />}

      {models.length > 0 ? (
        <select
          value={currentModel ?? ""}
          onChange={(e) => setModel(e.target.value)}
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
            {tAdmin(lang, "— выберите модель —", "— оберіть модель —")}
          </option>
          {currentModel && !models.includes(currentModel) && (
            <option value={currentModel}>
              {currentModel} ({tAdmin(lang, "текущая", "поточна")})
            </option>
          )}
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      ) : (
        !loading && (
          <input
            type="text"
            value={currentModel ?? ""}
            onChange={(e) => setModel(e.target.value)}
            placeholder="model-id"
            className="field-type__input"
            style={{
              width: "100%",
              minHeight: "40px",
              padding: "8px 10px",
              fontSize: "var(--adm-fs-body, 14px)",
              fontFamily: "monospace",
            }}
          />
        )
      )}

      {infoNote && (
        <div
          style={{
            marginTop: "6px",
            fontSize: "var(--adm-fs-badge, 12px)",
            color: "var(--adm-color-muted)",
            lineHeight: 1.4,
          }}
        >
          {infoNote}
        </div>
      )}

      {imageMode && models.length > 0 && <ImageModelWarning provider={provider} />}
    </div>
  );
}
