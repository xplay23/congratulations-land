import type { GlobalConfig } from "payload";
import { invalidateCmsContentCache } from "@/lib/cms-cache";

const navLinkCoreFields = [
  {
    type: "row" as const,
    fields: [
      {
        name: "label",
        type: "text" as const,
        localized: true,
        required: true,
        label: { ru: "Название", uk: "Назва", en: "Label" },
        admin: { width: "40%" },
      },
      {
        name: "href",
        type: "text" as const,
        required: true,
        label: { ru: "Ссылка (без /ru)", uk: "Посилання (без /ru)", en: "URL Path" },
        admin: {
          width: "35%",
          placeholder: "/svyatyj-mykolaj",
        },
      },
      {
        name: "icon",
        type: "select" as const,
        defaultValue: "none",
        label: { ru: "Иконка", uk: "Іконка", en: "Icon" },
        options: [
          { label: { ru: "Без иконки", uk: "Без іконки", en: "None" }, value: "none" },
          { label: { ru: "Видео", uk: "Відео", en: "Video" }, value: "video" },
          { label: { ru: "Книга", uk: "Книга", en: "Book" }, value: "book" },
          { label: { ru: "Мои заказы", uk: "Мої замовлення", en: "Orders" }, value: "orders" },
          { label: { ru: "Искры", uk: "Іскри", en: "Sparkles" }, value: "sparkles" },
        ],
        admin: { width: "25%" },
      },
    ],
  },
  {
    type: "row" as const,
    fields: [
      {
        name: "serviceKey",
        type: "select" as const,
        defaultValue: "none",
        label: {
          ru: "Скрывать, если услуга выключена",
          uk: "Приховувати, якщо послуга вимкнена",
          en: "Tie visibility to service",
        },
        options: [
          { label: { ru: "Всегда показывать", uk: "Завжди показувати", en: "Always show" }, value: "none" },
          { label: "video", value: "video" },
          { label: "storybook", value: "storybook" },
          { label: "photo_animation", value: "photo_animation" },
          { label: "song", value: "song" },
          { label: "postcard", value: "postcard" },
        ],
        admin: { width: "50%" },
      },
      {
        name: "openInNewTab",
        type: "checkbox" as const,
        defaultValue: false,
        label: {
          ru: "Открывать в новой вкладке",
          uk: "Відкривати в новій вкладці",
          en: "Open in new tab",
        },
        admin: { width: "50%", style: { alignSelf: "flex-end" } },
      },
    ],
  },
];

export const HeaderNav: GlobalConfig = {
  slug: "header-nav",
  label: {
    ru: "Меню шапки",
    uk: "Меню шапки",
    en: "Header Navigation",
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
      name: "items",
      type: "array",
      label: {
        ru: "Пункты верхнего меню",
        uk: "Пункти верхнього меню",
        en: "Header Menu Items",
      },
      labels: {
        singular: { ru: "Пункт", uk: "Пункт", en: "Item" },
        plural: { ru: "Пункты", uk: "Пункти", en: "Items" },
      },
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: "engine/components/admin/FirstFieldRowLabel",
        },
      },
      fields: [
        ...navLinkCoreFields,
        {
          name: "children",
          type: "array",
          label: {
            ru: "Подпункты (выпадающее меню)",
            uk: "Підпункти (випадаюче меню)",
            en: "Sub-items (Dropdown)",
          },
          labels: {
            singular: { ru: "Подпункт", uk: "Підпункт", en: "Sub-item" },
            plural: { ru: "Подпункты", uk: "Підпункти", en: "Sub-items" },
          },
          admin: {
            initCollapsed: true,
            components: {
              RowLabel: "engine/components/admin/FirstFieldRowLabel",
            },
          },
          fields: navLinkCoreFields,
        },
      ],
    },
  ],
};
