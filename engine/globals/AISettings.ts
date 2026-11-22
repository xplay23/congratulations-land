import type { GlobalConfig } from "payload";
import { invalidateModelsCache } from "@/lib/ai-model-cache";
import { invalidateCmsAiConfigCache } from "@/lib/cms-ai-config";

const REASONING_EFFORT_OPTIONS = [
  {
    label: {
      ru: "По умолчанию модели (auto)",
      uk: "За замовчуванням моделі (auto)",
      en: "Model default (auto)",
    },
    value: "auto",
  },
  {
    label: {
      ru: "Без размышлений (none)",
      uk: "Без міркувань (none)",
      en: "None",
    },
    value: "none",
  },
  {
    label: {
      ru: "Минимальный (minimal)",
      uk: "Мінімальний (minimal)",
      en: "Minimal",
    },
    value: "minimal",
  },
  {
    label: {
      ru: "Низкий — быстро (low)",
      uk: "Низький — швидко (low)",
      en: "Low (fast)",
    },
    value: "low",
  },
  {
    label: {
      ru: "Средний — баланс (medium)",
      uk: "Середній — баланс (medium)",
      en: "Medium (balanced)",
    },
    value: "medium",
  },
  {
    label: {
      ru: "Высокий — глубокий анализ (high)",
      uk: "Високий — глибокий аналіз (high)",
      en: "High (deep reasoning)",
    },
    value: "high",
  },
];

export const AISettings: GlobalConfig = {
  slug: "ai-settings",
  label: { ru: "ИИ (Контент)", uk: "ШІ (Контент)", en: "AI (Content)" },
  admin: {
    group: { ru: "Настройки", uk: "Налаштування", en: "Settings" },
  },
  hooks: {
    afterChange: [
      () => {
        invalidateModelsCache();
        invalidateCmsAiConfigCache();
      },
    ],
  },
  fields: [
    {
      name: "enabled",
      type: "checkbox",
      label: { ru: "ИИ включён", uk: "ШІ увімкнено", en: "AI Enabled" },
      defaultValue: true,
      admin: {
        description: {
          ru: "Главный переключатель ИИ-генерации контента и перевода в админке.",
          uk: "Головний перемикач ШІ-генерації контенту та перекладу в адмінці.",
          en: "Master toggle for AI content generation and translation in admin.",
        },
      },
    },
    {
      type: "ui",
      name: "aiDisabledWarning",
      admin: {
        components: {
          Field:
            "engine/components/admin/AiDisabledWarning#AiDisabledWarning",
        },
      },
    },
    // ── Text Generation (Admin Blog / SEO / Translation / Assistant) ──────────
    {
      type: "ui",
      name: "textGenerationDivider",
      admin: {
        components: {
          Field:
            "engine/components/admin/SectionDivider#AiTextGenerationDivider",
        },
      },
    },
    {
      name: "provider",
      type: "select",
      label: { ru: "Провайдер", uk: "Провайдер", en: "Provider" },
      defaultValue: "openai",
      options: [
        { label: "OpenAI", value: "openai" },
        { label: "Anthropic", value: "anthropic" },
        { label: "Google", value: "google" },
      ],
    },
    {
      name: "apiKey",
      type: "text",
      label: "API Key",
      admin: {
        components: {
          Field: "engine/components/admin/SecretKeyField#ApiKeyField",
        },
      },
      access: {
        read: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: "model",
      type: "text",
      label: { ru: "Модель", uk: "Модель", en: "Model" },
      defaultValue: "gpt-6.2-astra",
      admin: {
        components: {
          Field: "engine/components/admin/HiddenModelField/TextModel",
        },
      },
    },
    {
      name: "reasoningEffort",
      type: "select",
      label: {
        ru: "Уровень размышления (Reasoning Effort)",
        uk: "Рівень міркувань (Reasoning Effort)",
        en: "Reasoning Effort",
      },
      defaultValue: "low",
      options: REASONING_EFFORT_OPTIONS,
      admin: {
        description: {
          ru: "Применяется для reasoning-моделей (OpenAI gpt-5/gpt-6/o1/o3/o4, Anthropic Thinking, Gemini Thinking). Для обычных моделей игнорируется.",
          uk: "Застосовується для reasoning-моделей (OpenAI gpt-5/gpt-6/o1/o3/o4, Anthropic Thinking, Gemini Thinking). Для звичайних моделей ігнорується.",
          en: "Applied to reasoning-capable models (OpenAI gpt-5/gpt-6/o1/o3/o4, Anthropic Thinking, Gemini Thinking).",
        },
      },
    },
    {
      name: "maxTokens",
      type: "number",
      label: { ru: "Макс. токенов", uk: "Макс. токенів", en: "Max Tokens" },
      defaultValue: 2500,
    },
    {
      name: "temperature",
      type: "number",
      label: { ru: "Температура", uk: "Температура", en: "Temperature" },
      defaultValue: 0.7,
      min: 0,
      max: 2,
      admin: {
        description: {
          ru: "Используется для не-reasoning моделей (0.0 — строго, 1.0+ — креативнее).",
          uk: "Використовується для не-reasoning моделей (0.0 — суворо, 1.0+ — креативніше).",
          en: "Used for non-reasoning models.",
        },
      },
    },
    // ── Image Generation (Admin Blog Covers & Promo) ──────────────────────────
    {
      type: "ui",
      name: "imageGenerationDivider",
      admin: {
        components: {
          Field:
            "engine/components/admin/SectionDivider#AiImageGenerationDivider",
        },
      },
    },
    {
      name: "imageProvider",
      type: "select",
      label: {
        ru: "Провайдер изображений",
        uk: "Провайдер зображень",
        en: "Image Provider",
      },
      defaultValue: "openai",
      options: [
        { label: "OpenAI", value: "openai" },
        { label: "Google", value: "google" },
      ],
    },
    {
      name: "imageApiKey",
      type: "text",
      label: {
        ru: "API-ключ для изображений",
        uk: "API-ключ для зображень",
        en: "Image API Key",
      },
      admin: {
        components: {
          Field: "engine/components/admin/SecretKeyField#ImageApiKeyField",
        },
      },
      access: {
        read: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: "imageModel",
      type: "text",
      label: {
        ru: "Модель изображений",
        uk: "Модель зображень",
        en: "Image Model",
      },
      defaultValue: "gpt-image-2.5-sunburst-2026-09-08",
      admin: {
        components: {
          Field: "engine/components/admin/HiddenModelField/ImageModel",
        },
      },
    },
    // ── AI Persona ────────────────────────────────────────────────────────────
    {
      type: "ui",
      name: "aiPersonaDivider",
      admin: {
        components: {
          Field: "engine/components/admin/SectionDivider#AiPersonaDivider",
        },
      },
    },
    {
      name: "siteDescription",
      type: "textarea",
      label: {
        ru: "Описание сайта",
        uk: "Опис сайту",
        en: "Site Description",
      },
      admin: {
        description: {
          ru: "Краткое описание платформы VideoVitannya. Передаётся в промпты как {{siteDescription}}.",
          uk: "Короткий опис платформи VideoVitannya. Передається у промпти як {{siteDescription}}.",
          en: "Short summary of VideoVitannya passed as {{siteDescription}}.",
        },
        rows: 3,
      },
    },
    {
      name: "aiPersona",
      type: "textarea",
      label: {
        ru: "Редакционная персона ИИ",
        uk: "Редакційна персона ШІ",
        en: "AI Writing Persona",
      },
      admin: {
        description: {
          ru: "Тон и редакционные правила для генерации статей, описаний услуг и SEO.",
          uk: "Тон та редакційні правила для генерації статей, описів послуг і SEO.",
          en: "Tone and editorial rules for generating articles, service descriptions, and SEO.",
        },
        rows: 6,
      },
    },
  ],
};
