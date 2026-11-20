import type { GlobalConfig } from "payload";
import { invalidateCmsContentCache } from "@/lib/cms-cache";

export const FooterNav: GlobalConfig = {
  slug: "footer-nav",
  label: {
    ru: "Меню футера",
    uk: "Меню футера",
    en: "Footer Navigation",
  },
  admin: {
    group: { ru: "Настройки", uk: "Налаштування", en: "Settings" },
  },
  hooks: {
    afterChange: [
      () => {
        invalidateCmsContentCache(["/", "/ru"]);
      },
    ],
  },
  fields: [
    {
      name: "translateBar",
      type: "ui",
      admin: {
        components: {
          Field: "engine/components/admin/TranslateLocaleButton",
        },
      },
    },
    {
      name: "columns",
      type: "array",
      label: {
        ru: "Колонки ссылок футера",
        uk: "Колонки посилань футера",
        en: "Footer Link Columns",
      },
      labels: {
        singular: { ru: "Колонка", uk: "Колонка", en: "Column" },
        plural: { ru: "Колонки", uk: "Колонки", en: "Columns" },
      },
      admin: {
        initCollapsed: false,
        components: {
          RowLabel: "engine/components/admin/FirstFieldRowLabel",
        },
      },
      fields: [
        {
          name: "heading",
          type: "text",
          localized: true,
          required: true,
          label: { ru: "Заголовок колонки", uk: "Заголовок колонки", en: "Column Heading" },
        },
        {
          name: "links",
          type: "array",
          label: { ru: "Ссылки", uk: "Посилання", en: "Links" },
          labels: {
            singular: { ru: "Ссылка", uk: "Посилання", en: "Link" },
            plural: { ru: "Ссылки", uk: "Посилання", en: "Links" },
          },
          admin: {
            components: {
              RowLabel: "engine/components/admin/FirstFieldRowLabel",
            },
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "label",
                  type: "text",
                  localized: true,
                  required: true,
                  label: { ru: "Текст", uk: "Текст", en: "Label" },
                  admin: { width: "45%" },
                },
                {
                  name: "href",
                  type: "text",
                  required: true,
                  label: { ru: "URL (без /ru)", uk: "URL (без /ru)", en: "URL" },
                  admin: { width: "40%" },
                },
                {
                  name: "openInNewTab",
                  type: "checkbox",
                  defaultValue: false,
                  label: { ru: "Новая вкладка", uk: "Нова вкладка", en: "New tab" },
                  admin: { width: "15%", style: { alignSelf: "flex-end" } },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "legalLinks",
      type: "array",
      label: {
        ru: "Юридические ссылки",
        uk: "Юридичні посилання",
        en: "Legal Links",
      },
      labels: {
        singular: { ru: "Ссылка", uk: "Посилання", en: "Link" },
        plural: { ru: "Ссылки", uk: "Посилання", en: "Links" },
      },
      admin: {
        components: {
          RowLabel: "engine/components/admin/FirstFieldRowLabel",
        },
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "label",
              type: "text",
              localized: true,
              required: true,
              label: { ru: "Название", uk: "Назва", en: "Label" },
              admin: { width: "50%" },
            },
            {
              name: "href",
              type: "text",
              required: true,
              label: { ru: "URL (без /ru)", uk: "URL (без /ru)", en: "URL" },
              admin: { width: "50%" },
            },
          ],
        },
      ],
    },
  ],
};
