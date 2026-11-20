import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "General",
  admin: {
    group: "Settings",
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
      label: "Название сайта",
      localized: true,
      defaultValue: "VideoVitannya",
      required: true,
    },
    {
      name: "tagline",
      type: "text",
      label: "Слоган",
      localized: true,
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      label: "Логотип",
    },
    {
      name: "favicon",
      type: "upload",
      relationTo: "media",
      label: "Favicon",
    },
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
      type: "text",
      label: "Контактный Email",
    },
    {
      name: "phone",
      type: "text",
      label: "Телефон",
    },
    {
      name: "telegramBotUrl",
      type: "text",
      label: "Ссылка на Telegram-бот",
    },
    {
      name: "instagramUrl",
      type: "text",
      label: "Instagram URL",
    },
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
      type: "textarea",
      label: "Текст в футере",
      localized: true,
      admin: {
        rows: 3,
      },
    },
  ],
};
