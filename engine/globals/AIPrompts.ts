import type { GlobalConfig } from "payload";
import { invalidateCmsAiConfigCache } from "@/lib/cms-ai-config";

export const AIPrompts: GlobalConfig = {
  slug: "ai-prompts",
  label: { ru: "Промпты", uk: "Промпти", en: "AI Prompts" },
  admin: {
    group: { ru: "Настройки", uk: "Налаштування", en: "Settings" },
    description: {
      ru: "Редактируемые шаблоны промптов для контента, перевода, видео-реплик и ИИ-помощника (промпты и стили сказок PDF находятся в разделе «Производство» → «Конструктор сказок» и «Стили сказок»).",
      uk: "Редаговані шаблони промптів для контенту, перекладу, відео-реплік та ШІ-помічника (промпти й стилі казок PDF знаходяться у розділі «Виробництво» → «Конструктор казок» та «Стилі казок»).",
      en: "Editable prompt templates for content, translation, video TTS scripts, and website assistant (PDF storybook prompts & styles live under Production).",
    },
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
      label: { ru: "Шаблоны промптов", uk: "Шаблони промптів", en: "Prompt Templates" },
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
          label: { ru: "Ключ (Slug)", uk: "Ключ (Slug)", en: "Type Slug" },
          admin: {
            description: {
              ru: "Уникальный ключ промпта, например post-content, translate-ru-uk, storybook-draft-system, style-folk_storybook.",
              uk: "Унікальний ключ промпта, наприклад post-content, translate-ru-uk, storybook-draft-system, style-folk_storybook.",
              en: "Unique prompt slug.",
            },
          },
        },
        {
          name: "label",
          type: "text",
          required: true,
          label: { ru: "Название", uk: "Назва", en: "Label" },
        },
        {
          name: "category",
          type: "select",
          label: { ru: "Категория", uk: "Категорія", en: "Category" },
          defaultValue: "content_seo",
          options: [
            {
              label: { ru: "Контент и SEO", uk: "Контент і SEO", en: "Content & SEO" },
              value: "content_seo",
            },
            {
              label: { ru: "Перевод RU ↔ UA", uk: "Переклад RU ↔ UA", en: "Translation RU ↔ UA" },
              value: "translation",
            },
            {
              label: {
                ru: "Пайплайн сказок PDF",
                uk: "Пайплайн казок PDF",
                en: "Storybook PDF Pipeline",
              },
              value: "storybook_pipeline",
            },
            {
              label: {
                ru: "Пайплайн видео (озвучка)",
                uk: "Пайплайн відео (озвучка)",
                en: "Video TTS Pipeline",
              },
              value: "video_pipeline",
            },
            {
              label: {
                ru: "ИИ-помощник на сайте",
                uk: "ШІ-помічник на сайті",
                en: "Website AI Assistant",
              },
              value: "assistant",
            },
          ],
        },
        {
          name: "template",
          type: "textarea",
          required: true,
          label: { ru: "Шаблон промпта", uk: "Шаблон промпта", en: "Prompt Template" },
          admin: {
            rows: 6,
          },
        },
        {
          name: "maxTokens",
          type: "number",
          label: {
            ru: "Лимит токенов (override)",
            uk: "Ліміт токенів (override)",
            en: "Max Tokens Override",
          },
        },
        {
          name: "notes",
          type: "textarea",
          label: { ru: "Заметки", uk: "Нотатки", en: "Notes" },
          admin: {
            rows: 2,
          },
        },
      ],
    },
  ],
};
