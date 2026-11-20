import type { GlobalConfig } from "payload";
import { invalidateModelsCache } from "@/app/api/ai/models/route";
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

export const StorybookAISettings: GlobalConfig = {
  slug: "storybook-ai-settings",
  label: { ru: "ИИ-сказки", uk: "ШІ-казки", en: "AI Storybooks" },
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
    // ── Section 1: Story Writer & Proofreader ─────────────────────────────────
    {
      type: "ui",
      name: "storybookWriterDivider",
      admin: {
        components: {
          Field: "engine/components/admin/SectionDivider#StorybookWriterDivider",
        },
      },
    },
    {
      name: "writerProvider",
      type: "select",
      label: { ru: "Провайдер текста", uk: "Провайдер тексту", en: "Writer Provider" },
      defaultValue: "openai",
      options: [
        { label: "OpenAI", value: "openai" },
        { label: "Anthropic", value: "anthropic" },
        { label: "Google", value: "google" },
      ],
    },
    {
      name: "writerApiKey",
      type: "text",
      label: { ru: "API-ключ (Текст сказки)", uk: "API-ключ (Текст казки)", en: "Writer API Key" },
      admin: {
        components: {
          Field:
            "engine/components/admin/SecretKeyField#StorybookWriterApiKeyField",
        },
      },
      access: {
        read: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: "writerModel",
      type: "text",
      label: {
        ru: "Модель писателя и корректора",
        uk: "Модель письменника та коректора",
        en: "Writer / Proofreader Model",
      },
      defaultValue: "gpt-6.2-astra",
      admin: {
        components: {
          Field: "engine/components/admin/HiddenModelField/StorybookWriterModel",
        },
      },
    },
    {
      name: "writerReasoningEffort",
      type: "select",
      label: {
        ru: "Уровень размышления (Текст)",
        uk: "Рівень міркувань (Текст)",
        en: "Writer Reasoning Effort",
      },
      defaultValue: "low",
      options: REASONING_EFFORT_OPTIONS,
    },

    // ── Section 2: Visual Director & Vision QA ────────────────────────────────
    {
      type: "ui",
      name: "storybookDirectorDivider",
      admin: {
        components: {
          Field:
            "engine/components/admin/SectionDivider#StorybookDirectorDivider",
        },
      },
    },
    {
      name: "directorProvider",
      type: "select",
      label: {
        ru: "Провайдер режиссуры и Vision",
        uk: "Провайдер режисури та Vision",
        en: "Director & Vision Provider",
      },
      defaultValue: "openai",
      options: [
        { label: "OpenAI", value: "openai" },
        { label: "Anthropic", value: "anthropic" },
        { label: "Google", value: "google" },
      ],
    },
    {
      name: "directorApiKey",
      type: "text",
      label: {
        ru: "API-ключ (Режиссёр и Vision QA)",
        uk: "API-ключ (Режисер та Vision QA)",
        en: "Director API Key",
      },
      admin: {
        components: {
          Field:
            "engine/components/admin/SecretKeyField#StorybookDirectorApiKeyField",
        },
      },
      access: {
        read: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: "directorModel",
      type: "text",
      label: {
        ru: "Модель режиссуры и Vision QA",
        uk: "Модель режисури та Vision QA",
        en: "Director & Vision QA Model",
      },
      defaultValue: "gpt-6.2-sol",
      admin: {
        components: {
          Field:
            "engine/components/admin/HiddenModelField/StorybookDirectorModel",
        },
      },
    },
    {
      name: "directorReasoningEffort",
      type: "select",
      label: {
        ru: "Уровень размышления (Режиссёр / Vision)",
        uk: "Рівень міркувань (Режисер / Vision)",
        en: "Director Reasoning Effort",
      },
      defaultValue: "low",
      options: REASONING_EFFORT_OPTIONS,
    },
    {
      name: "visionQaEnabled",
      type: "checkbox",
      label: {
        ru: "Включить Vision QA-проверку иллюстраций",
        uk: "Увімкнути Vision QA-перевірку ілюстрацій",
        en: "Vision QA Gate Enabled",
      },
      defaultValue: true,
      admin: {
        description: {
          ru: "Автоматическая проверка готовых страниц через Vision с до 1 перегенерацией при браке.",
          uk: "Автоматична перевірка готових сторінок через Vision із до 1 перегенерацією при браку.",
          en: "Automatically inspect generated illustrations via Vision and retry once on defects.",
        },
      },
    },

    // ── Section 3: Storybook Illustrations ────────────────────────────────────
    {
      type: "ui",
      name: "storybookImagesDivider",
      admin: {
        components: {
          Field: "engine/components/admin/SectionDivider#StorybookImagesDivider",
        },
      },
    },
    {
      name: "imageProvider",
      type: "select",
      label: {
        ru: "Провайдер иллюстраций",
        uk: "Провайдер ілюстрацій",
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
        ru: "API-ключ (Иллюстрации сказок)",
        uk: "API-ключ (Ілюстрації казок)",
        en: "Image API Key",
      },
      admin: {
        components: {
          Field:
            "engine/components/admin/SecretKeyField#StorybookImageApiKeyField",
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
        ru: "Модель иллюстраций",
        uk: "Модель ілюстрацій",
        en: "Image Model",
      },
      defaultValue: "gpt-image-2.5-sunburst-2026-09-08",
      admin: {
        components: {
          Field: "engine/components/admin/HiddenModelField/StorybookImageModel",
        },
      },
    },
    {
      name: "imageQuality",
      type: "select",
      label: {
        ru: "Качество иллюстраций",
        uk: "Якість ілюстрацій",
        en: "Image Quality",
      },
      defaultValue: "medium",
      options: [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
        { label: "Auto", value: "auto" },
      ],
    },
  ],
};
