import type { CollectionConfig } from "payload";
import { invalidateCmsContentCache } from "@/lib/cms-cache";

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: {
    singular: { ru: "Статья", uk: "Стаття", en: "Post" },
    plural: { ru: "Статьи", uk: "Статті", en: "Posts" },
  },
  admin: {
    group: { ru: "Блог", uk: "Блог", en: "Blog" },
    useAsTitle: "title",
    defaultColumns: ["title", "category", "status", "publishedAt"],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      () => {
        invalidateCmsContentCache(["/", "/ru", "/blog", "/ru/blog"]);
      },
    ],
    afterDelete: [
      () => {
        invalidateCmsContentCache(["/", "/ru", "/blog", "/ru/blog"]);
      },
    ],
  },
  fields: [
    {
      name: "aiButtons",
      type: "ui",
      admin: {
        components: {
          Field: "engine/components/admin/PostAiButtons",
        },
      },
    },
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
      name: "title",
      type: "text",
      localized: true,
      required: true,
      label: { ru: "Заголовок статьи", uk: "Заголовок статті", en: "Title" },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: { ru: "URL-слаг", uk: "URL-слаг", en: "Slug" },
      admin: {
        components: {
          Field: "engine/components/admin/SlugField",
        },
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      localized: true,
      label: { ru: "Краткий анонс (карточка)", uk: "Короткий анонс (картка)", en: "Excerpt" },
    },
    {
      name: "lead",
      type: "textarea",
      localized: true,
      label: { ru: "Вводный абзац (Lead)", uk: "Вступний абзац (Lead)", en: "Lead Paragraph" },
    },
    {
      name: "content",
      type: "richText",
      localized: true,
      label: { ru: "Текст статьи", uk: "Текст статті", en: "Article Content" },
    },
    // ── Sidebar fields ──
    {
      name: "sidebarStatusDivider",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field:
            "engine/components/admin/SectionDivider#PostSidebarStatusDivider",
        },
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
      admin: { position: "sidebar" },
    },
    {
      name: "publishedAt",
      type: "date",
      label: { ru: "Дата публикации", uk: "Дата публікації", en: "Published At" },
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayOnly", displayFormat: "yyyy-MM-dd" },
      },
    },
    {
      name: "readTime",
      type: "text",
      localized: true,
      label: { ru: "Время чтения", uk: "Час читання", en: "Read Time" },
      admin: {
        position: "sidebar",
        placeholder: "3 хв читання / 3 мин чтения",
      },
    },
    {
      name: "sidebarCategoriesDivider",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field:
            "engine/components/admin/SectionDivider#PostSidebarCategoriesTagsDivider",
        },
      },
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "post-categories",
      required: true,
      label: { ru: "Рубрика (хаб)", uk: "Рубрика (хаб)", en: "Category" },
      admin: { position: "sidebar" },
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "authors",
      label: { ru: "Автор", uk: "Автор", en: "Author" },
      admin: { position: "sidebar" },
    },
    {
      name: "ctaService",
      type: "relationship",
      relationTo: "services",
      label: { ru: "Услуга в CTA-блоке", uk: "Послуга в CTA-блоці", en: "CTA Service" },
      admin: { position: "sidebar" },
    },
    {
      name: "tags",
      type: "array",
      label: { ru: "Теги", uk: "Теги", en: "Tags" },
      admin: {
        position: "sidebar",
        components: {
          Field: "engine/components/admin/TagsField",
        },
      },
      fields: [
        {
          name: "tag",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "sidebarCoverDivider",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field:
            "engine/components/admin/SectionDivider#PostSidebarVisualIdentityDivider",
        },
      },
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      label: { ru: "Обложка", uk: "Обкладинка", en: "Cover Image" },
      admin: { position: "sidebar" },
    },
  ],
};
