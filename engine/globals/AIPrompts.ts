import type { GlobalConfig } from "payload";
import { invalidateCmsAiConfigCache } from "@/lib/cms-ai-config";

export const AIPrompts: GlobalConfig = {
  slug: "ai-prompts",
  label: "AI Prompts",
  admin: {
    group: "Settings",
    description:
      "Редактируемые шаблоны промптов для контента, перевода, сказок PDF, видео-реплик и ИИ-помощника. Поддерживают {{переменные}}.",
  },
  hooks: {
    afterChange: [
      () => {
        invalidateCmsAiConfigCache();
      },
    ],
  },
  fields: [
    {
      name: "prompts",
      type: "array",
      label: "Prompt Templates",
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: "engine/components/admin/PromptRowLabel",
        },
      },
      fields: [
        {
          name: "type",
          type: "text",
          required: true,
          label: "Type Slug",
          admin: {
            description:
              "Уникальный ключ промпта, например post-content, translate-ru-uk, storybook-writer-system, style-folk_storybook.",
          },
        },
        {
          name: "label",
          type: "text",
          required: true,
          label: "Label",
        },
        {
          name: "category",
          type: "select",
          label: "Category",
          defaultValue: "content_seo",
          options: [
            { label: "Контент и SEO", value: "content_seo" },
            { label: "Перевод RU ↔ UA", value: "translation" },
            { label: "Пайплайн сказок PDF", value: "storybook_pipeline" },
            { label: "Пайплайн видео (озвучка)", value: "video_pipeline" },
            { label: "ИИ-помощник на сайте", value: "assistant" },
          ],
        },
        {
          name: "template",
          type: "textarea",
          required: true,
          label: "Prompt Template",
          admin: {
            rows: 6,
          },
        },
        {
          name: "maxTokens",
          type: "number",
          label: "Max Tokens Override",
        },
        {
          name: "notes",
          type: "textarea",
          label: "Notes",
          admin: {
            rows: 2,
          },
        },
      ],
    },
  ],
};
