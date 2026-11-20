import type { GlobalConfig } from "payload";
import { invalidateModelsCache } from "@/app/api/ai/models/route";
import { invalidateCmsAiConfigCache } from "@/lib/cms-ai-config";

export const AISettings: GlobalConfig = {
  slug: "ai-settings",
  label: "AI & ElevenLabs",
  admin: {
    group: "Settings",
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
      label: "AI Enabled",
      defaultValue: true,
      admin: {
        description:
          "Главный переключатель ИИ-генерации контента и перевода в админке.",
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
      label: "Provider",
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
      label: "Model",
      defaultValue: "gpt-6.2-astra",
      admin: {
        components: {
          Field: "engine/components/admin/HiddenModelField/TextModel",
        },
      },
    },
    {
      name: "maxTokens",
      type: "number",
      label: "Max Tokens",
      defaultValue: 2500,
    },
    {
      name: "temperature",
      type: "number",
      label: "Temperature",
      defaultValue: 0.7,
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
      label: "Image Provider",
      defaultValue: "openai",
      options: [
        { label: "OpenAI", value: "openai" },
        { label: "Google", value: "google" },
      ],
    },
    {
      name: "imageApiKey",
      type: "text",
      label: "Image API Key",
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
      label: "Image Model",
      defaultValue: "gpt-image-2.5-sunburst-2026-09-08",
      admin: {
        components: {
          Field: "engine/components/admin/HiddenModelField/ImageModel",
        },
      },
    },
    // ── Storybook Pipeline (OpenAI) ───────────────────────────────────────────
    {
      type: "ui",
      name: "storybookPipelineDivider",
      admin: {
        components: {
          Field:
            "engine/components/admin/SectionDivider#AiStorybookPipelineDivider",
        },
      },
    },
    {
      name: "storybookWriterModel",
      type: "text",
      label: "Storybook Writer / Proofreader Model",
      defaultValue: "gpt-6.2-astra",
      admin: {
        description:
          "Модель для шагов story_beats, story_draft и корректуры RU/UA.",
      },
    },
    {
      name: "storybookDirectorModel",
      type: "text",
      label: "Storybook Director & Vision QA Model",
      defaultValue: "gpt-6.2-sol",
      admin: {
        description:
          "Модель для Vision-паспорта фото, визуальной режиссуры сцен и QA-проверки картинок.",
      },
    },
    {
      name: "storybookImageModel",
      type: "text",
      label: "Storybook Image Model",
      defaultValue: "gpt-image-2.5-sunburst-2026-09-08",
      admin: {
        description: "Модель генерации якорей и иллюстраций сказок.",
      },
    },
    {
      name: "storybookImageQuality",
      type: "select",
      label: "Storybook Image Quality",
      defaultValue: "medium",
      options: [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
        { label: "Auto", value: "auto" },
      ],
    },
    {
      name: "storybookVisionQaEnabled",
      type: "checkbox",
      label: "Vision QA Gate Enabled",
      defaultValue: true,
      admin: {
        description:
          "Автоматическая проверка иллюстраций через Vision и до 1 перегенерации при браке.",
      },
    },
    // ── ElevenLabs Voice Pipeline ─────────────────────────────────────────────
    {
      type: "ui",
      name: "elevenLabsPipelineDivider",
      admin: {
        components: {
          Field:
            "engine/components/admin/SectionDivider#AiElevenLabsPipelineDivider",
        },
      },
    },
    {
      name: "elevenLabsApiKey",
      type: "text",
      label: "ElevenLabs API Key",
      admin: {
        components: {
          Field:
            "engine/components/admin/SecretKeyField#ElevenLabsApiKeyField",
        },
      },
      access: {
        read: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: "elevenLabsModelId",
      type: "text",
      label: "ElevenLabs Model ID",
      defaultValue: "eleven_v4",
    },
    {
      name: "elevenLabsVoiceId",
      type: "text",
      label: "Default Voice ID",
      defaultValue: "NOpBlnGInO9m6vDvFkFC",
      admin: {
        description:
          "ID голоса по умолчанию для видеопоздравлений (например, Святой Николай).",
      },
    },
    {
      name: "elevenLabsStability",
      type: "number",
      label: "Voice Stability (0–1)",
      defaultValue: 0.5,
      min: 0,
      max: 1,
    },
    {
      name: "elevenLabsSimilarityBoost",
      type: "number",
      label: "Similarity Boost (0–1)",
      defaultValue: 0.78,
      min: 0,
      max: 1,
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
      label: "Site Description",
      admin: {
        description:
          "Краткое описание платформы VideoVitannya. Передаётся как {{siteDescription}}.",
        rows: 3,
      },
    },
    {
      name: "aiPersona",
      type: "textarea",
      label: "AI Writing Persona",
      admin: {
        description:
          "Тон и редакционные правила для генерации статей, описаний услуг и SEO.",
        rows: 6,
      },
    },
  ],
};
