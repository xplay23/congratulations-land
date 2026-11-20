import type { GlobalConfig } from "payload";
import { savePlatformLimits } from "@/lib/settings";

export const PlatformLimits: GlobalConfig = {
  slug: "platform-limits",
  label: { ru: "Лимиты", uk: "Ліміти", en: "Limits" },
  admin: {
    group: { ru: "Настройки", uk: "Налаштування", en: "Settings" },
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        const d = doc as Record<string, unknown>;
        savePlatformLimits({
          maxPreviewOrdersPerSession:
            typeof d.maxPreviewOrdersPerSession === "number"
              ? d.maxPreviewOrdersPerSession
              : undefined,
          maxAiEditsPerBook:
            typeof d.maxAiEditsPerBook === "number"
              ? d.maxAiEditsPerBook
              : undefined,
          maxAiEditsPerVideo:
            typeof d.maxAiEditsPerVideo === "number"
              ? d.maxAiEditsPerVideo
              : undefined,
          orderRetentionDays:
            typeof d.orderRetentionDays === "number"
              ? d.orderRetentionDays
              : undefined,
        });
      },
    ],
  },
  fields: [
    {
      type: "ui",
      name: "limitsDivider",
      admin: {
        components: {
          Field:
            "engine/components/admin/SectionDivider#PlatformLimitsDivider",
        },
      },
    },
    {
      name: "maxPreviewOrdersPerSession",
      type: "number",
      label: {
        ru: "Максимум превью на сессию",
        uk: "Максимум прев'ю на сесію",
        en: "Max Previews Per Session",
      },
      defaultValue: 3,
      min: 1,
      max: 100,
      required: true,
      admin: {
        description: {
          ru: "Защита от злоупотребления бесплатной генерацией превью в одной пользовательской сессии.",
          uk: "Захист від зловживання безкоштовною генерацією прев'ю в одній користувацькій сесії.",
          en: "Anti-abuse limit for free preview generations per browser session.",
        },
      },
    },
    {
      name: "maxAiEditsPerBook",
      type: "number",
      label: {
        ru: "ИИ-правок на одну сказку",
        uk: "ШІ-правок на одну казку",
        en: "AI Edits Per Storybook",
      },
      defaultValue: 3,
      min: 0,
      max: 20,
      required: true,
      admin: {
        description: {
          ru: "Количество бесплатных AI-перегенераций текста или иллюстрации страницы в одном заказе сказки.",
          uk: "Кількість безкоштовних AI-перегенерацій тексту або ілюстрації сторінки в одному замовленні казки.",
          en: "Number of free AI text/page edits included per storybook order.",
        },
      },
    },
    {
      name: "maxAiEditsPerVideo",
      type: "number",
      label: {
        ru: "ИИ-правок на одно видео",
        uk: "ШІ-правок на одне відео",
        en: "AI Edits Per Video",
      },
      defaultValue: 1,
      min: 0,
      max: 20,
      required: true,
      admin: {
        description: {
          ru: "Лимит повторных генераций для одного заказа видеопоздравления.",
          uk: "Ліміт повторних генерацій для одного замовлення відеопривітання.",
          en: "Maximum re-generations included per video greeting order.",
        },
      },
    },
    {
      name: "orderRetentionDays",
      type: "number",
      label: {
        ru: "Хранение готовых файлов (дней)",
        uk: "Зберігання готових файлів (днів)",
        en: "Order File Retention (Days)",
      },
      defaultValue: 30,
      min: 1,
      max: 365,
      required: true,
      admin: {
        description: {
          ru: "Срок хранения готовых PDF и видеофайлов заказа до автоматической очистки по TTL.",
          uk: "Термін зберігання готових PDF і відеофайлів замовлення до автоматичного очищення за TTL.",
          en: "Days before generated PDFs and videos are eligible for TTL cleanup.",
        },
      },
    },
  ],
};
