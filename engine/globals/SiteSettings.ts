import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: { ru: "Общие", uk: "Загальні", en: "General" },
  admin: {
    group: { ru: "Настройки", uk: "Налаштування", en: "Settings" },
  },
  fields: [
    {
      name: "translateLocaleBar",
      type: "ui",
      admin: {
        components: {
          Field:
            "engine/components/admin/TranslateLocaleButton#TranslateLocaleButton",
        },
      },
    },
    {
      name: "siteName",
      type: "text",
      label: { ru: "Название сайта", uk: "Назва сайту", en: "Site Name" },
      localized: true,
      defaultValue: "VideoVitannya",
      required: true,
    },
    {
      name: "tagline",
      type: "text",
      label: { ru: "Слоган", uk: "Слоган", en: "Tagline" },
      localized: true,
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      label: { ru: "Логотип", uk: "Логотип", en: "Logo" },
    },
    {
      name: "favicon",
      type: "upload",
      relationTo: "media",
      label: { ru: "Favicon", uk: "Favicon", en: "Favicon" },
    },
    {
      name: "showSiteNameWithLogo",
      type: "checkbox",
      label: {
        ru: "Показывать название сайта рядом с логотипом",
        uk: "Показувати назву сайту поруч із логотипом",
        en: "Show site name with logo",
      },
      defaultValue: false,
    },
    // ── Contacts ──────────────────────────────────────────────────────────────
    {
      name: "contactsDivider",
      type: "ui",
      admin: {
        components: {
          Field:
            "engine/components/admin/SectionDivider#SiteContactsDivider",
        },
      },
    },
    {
      name: "contactEmail",
      type: "email",
      label: { ru: "Контактный Email", uk: "Контактний Email", en: "Contact Email" },
    },
    {
      name: "phone",
      type: "text",
      label: { ru: "Телефон", uk: "Телефон", en: "Phone" },
    },
    {
      name: "address",
      type: "textarea",
      label: { ru: "Адрес", uk: "Адреса", en: "Address" },
      localized: true,
      admin: { rows: 2 },
    },
    {
      name: "telegramBotUrl",
      type: "text",
      label: {
        ru: "Ссылка на Telegram-бот доставки",
        uk: "Посилання на Telegram-бот доставки",
        en: "Telegram Delivery Bot URL",
      },
    },
    // ── Footer & Socials ──────────────────────────────────────────────────────
    {
      name: "footerDivider",
      type: "ui",
      admin: {
        components: {
          Field:
            "engine/components/admin/SectionDivider#SiteFooterDivider",
        },
      },
    },
    {
      name: "footerText",
      type: "richText",
      label: { ru: "Текст в футере", uk: "Текст у футері", en: "Footer Text" },
      localized: true,
    },
    {
      name: "copyrightText",
      type: "richText",
      label: { ru: "Копирайт в футере", uk: "Копірайт у футері", en: "Copyright Text" },
      localized: true,
      admin: {
        description: {
          ru: "Отображается в нижней строке футера после года и названия сайта.",
          uk: "Відображається в нижньому рядку футера після року та назви сайту.",
          en: "Shown in the bottom bar of the footer, after the year and site name.",
        },
      },
    },
    {
      name: "socialLinks",
      type: "array",
      label: { ru: "Социальные сети", uk: "Соціальні мережі", en: "Social Links" },
      admin: {
        components: {
          RowLabel: "engine/components/admin/SocialLinkRowLabel",
        },
      },
      fields: [
        {
          name: "platform",
          type: "select",
          label: { ru: "Платформа", uk: "Платформа", en: "Platform" },
          required: true,
          defaultValue: "instagram",
          options: [
            { label: "Instagram", value: "instagram" },
            { label: "Telegram", value: "telegram" },
            { label: "TikTok", value: "tiktok" },
            { label: "YouTube", value: "youtube" },
            { label: "Facebook", value: "facebook" },
            { label: "Twitter / X", value: "twitter" },
            { label: "Pinterest", value: "pinterest" },
            { label: "Viber", value: "viber" },
            { label: "WhatsApp", value: "whatsapp" },
            { label: "LinkedIn", value: "linkedin" },
            { label: "GitHub", value: "github" },
            {
              label: { ru: "Другая", uk: "Інша", en: "Other" },
              value: "other",
            },
          ],
        },
        {
          name: "label",
          type: "text",
          label: {
            ru: "Подпись (необязательно)",
            uk: "Підпис (необов'язково)",
            en: "Custom Label (optional)",
          },
          admin: {
            description: {
              ru: "Если пусто — используется название платформы.",
              uk: "Якщо порожньо — використовується назва платформи.",
              en: "Falls back to the platform name if empty.",
            },
          },
        },
        {
          name: "url",
          type: "text",
          label: "URL",
          required: true,
        },
      ],
    },
  ],
};
