import type { CollectionConfig } from "payload";
import { invalidateCmsContentCache } from "@/lib/cms-cache";

export const PostCategories: CollectionConfig = {
  slug: "post-categories",
  labels: {
    singular: { ru: "Рубрика", uk: "Рубрика", en: "Blog Category" },
    plural: { ru: "Рубрики", uk: "Рубрики", en: "Blog Categories" },
  },
  admin: {
    group: { ru: "Блог", uk: "Блог", en: "Blog" },
    useAsTitle: "label",
    defaultColumns: ["label", "slug", "targetService", "sortOrder"],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        const slug = String((doc as { slug?: string }).slug || "");
        invalidateCmsContentCache([
          "/blog",
          "/ru/blog",
          ...(slug ? [`/blog/${slug}`, `/ru/blog/${slug}`] : []),
        ]);
      },
    ],
    afterDelete: [
      () => {
        invalidateCmsContentCache(["/blog", "/ru/blog"]);
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
          name: "label",
          type: "text",
          localized: true,
          required: true,
          label: { ru: "Короткое название (вкладка)", uk: "Коротка назва (вкладка)", en: "Tab Label" },
          admin: { width: "45%" },
        },
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
          index: true,
          label: { ru: "URL-слаг хаба", uk: "URL-слаг хаба", en: "Hub Slug" },
          admin: {
            width: "35%",
            components: {
              Field: "engine/components/admin/SlugField",
            },
          },
        },
        {
          name: "sortOrder",
          type: "number",
          defaultValue: 10,
          label: { ru: "Порядок", uk: "Порядок", en: "Sort Order" },
          admin: { width: "20%" },
        },
      ],
    },
    {
      name: "title",
      type: "text",
      localized: true,
      required: true,
      label: { ru: "SEO-заголовок хаба", uk: "SEO-заголовок хаба", en: "SEO Title" },
    },
    {
      name: "h1",
      type: "text",
      localized: true,
      label: { ru: "Заголовок H1", uk: "Заголовок H1", en: "H1 Heading" },
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
      label: { ru: "Описание хаба", uk: "Опис хаба", en: "Description" },
    },
    {
      name: "targetService",
      type: "relationship",
      relationTo: "services",
      label: { ru: "Целевая услуга для CTA", uk: "Цільова послуга для CTA", en: "Target CTA Service" },
    },
  ],
};
