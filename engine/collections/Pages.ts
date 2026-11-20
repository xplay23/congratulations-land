import type { CollectionConfig } from "payload";
import { ValidationError } from "payload";
import { pageBuilderBlocks } from "@engine/blocks";
import { invalidateCmsContentCache } from "@/lib/cms-cache";

const RESERVED_PAGE_SLUGS = new Set([
  "admin",
  "api",
  "blog",
  "create",
  "orders",
  "my-orders",
  "ru",
  "uk",
  "media",
  "assets",
  "samples",
]);

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: {
    singular: { ru: "Страница", uk: "Сторінка", en: "Page" },
    plural: { ru: "Страницы", uk: "Сторінки", en: "Pages" },
  },
  admin: {
    group: { ru: "Контент", uk: "Контент", en: "Content" },
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "status", "updatedAt"],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        const slug = String((doc as { slug?: string }).slug || "");
        invalidateCmsContentCache([
          "/",
          "/ru",
          ...(slug ? [`/${slug}`, `/ru/${slug}`] : []),
        ]);
      },
    ],
    afterDelete: [
      ({ doc }) => {
        const slug = String((doc as { slug?: string }).slug || "");
        invalidateCmsContentCache([
          "/",
          "/ru",
          ...(slug ? [`/${slug}`, `/ru/${slug}`] : []),
        ]);
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
      type: "row",
      fields: [
        {
          name: "title",
          type: "text",
          localized: true,
          required: true,
          label: { ru: "Название страницы", uk: "Назва сторінки", en: "Page Title" },
          admin: { width: "50%" },
        },
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
          index: true,
          label: { ru: "URL-слаг", uk: "URL-слаг", en: "Slug" },
          admin: {
            width: "30%",
            components: {
              Field: "engine/components/admin/SlugField",
            },
          },
          hooks: {
            beforeValidate: [
              ({ value }) => {
                if (
                  typeof value === "string" &&
                  RESERVED_PAGE_SLUGS.has(value.trim().toLowerCase())
                ) {
                  throw new ValidationError({
                    errors: [
                      {
                        path: "slug",
                        message: `Слаг "${value}" зарезервирован системой.`,
                      },
                    ],
                  });
                }
                return value;
              },
            ],
          },
        },
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "published",
          label: { ru: "Статус", uk: "Статус", en: "Status" },
          options: [
            { label: { ru: "Опубликована", uk: "Опублікована", en: "Published" }, value: "published" },
            { label: { ru: "Черновик", uk: "Чернетка", en: "Draft" }, value: "draft" },
          ],
          admin: { width: "20%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "eyebrow",
          type: "text",
          localized: true,
          label: { ru: "Надзаголовок (eyebrow)", uk: "Надзаголовок (eyebrow)", en: "Eyebrow" },
          admin: { width: "40%" },
        },
        {
          name: "h1",
          type: "text",
          localized: true,
          label: { ru: "Заголовок H1", uk: "Заголовок H1", en: "H1 Heading" },
          admin: { width: "60%" },
        },
      ],
    },
    {
      name: "subtitle",
      type: "textarea",
      localized: true,
      label: { ru: "Вводное описание", uk: "Вступний опис", en: "Subtitle" },
    },
    {
      name: "sections",
      type: "blocks",
      localized: true,
      blocks: pageBuilderBlocks,
      label: {
        ru: "Конструктор блоков страницы",
        uk: "Конструктор блоків сторінки",
        en: "Page Builder Blocks",
      },
      admin: {
        initCollapsed: true,
        description: {
          ru: "Добавляйте, настраивайте и перетаскивайте блоки страницы (Таблица цен, FAQ, Отзывы, Текст, CTA и т.д.).",
          uk: "Додавайте, налаштовуйте та перетягуйте блоки сторінки (Таблиця цін, FAQ, Відгуки, Текст, CTA тощо).",
          en: "Add and arrange visual blocks for this page.",
        },
      },
    },
  ],
};
