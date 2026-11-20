import type { CollectionConfig } from "payload";
import { invalidateCmsContentCache } from "@/lib/cms-cache";

export const Showcases: CollectionConfig = {
  slug: "showcases",
  labels: {
    singular: { ru: "Пример", uk: "Приклад", en: "Showcase" },
    plural: { ru: "Примеры", uk: "Приклади", en: "Showcases" },
  },
  admin: {
    group: { ru: "Каталог", uk: "Каталог", en: "Catalog" },
    useAsTitle: "title",
    defaultColumns: ["title", "kind", "demoLang", "featuredOnHome", "sortOrder"],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      () => {
        invalidateCmsContentCache([
          "/",
          "/ru",
          "/svyatyj-mykolaj",
          "/ru/svyatyj-mykolaj",
          "/kazka",
          "/ru/kazka",
        ]);
      },
    ],
    afterDelete: [
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
      type: "row",
      fields: [
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
          index: true,
          label: { ru: "Код / слаг", uk: "Код / слаг", en: "Slug" },
          admin: { width: "34%" },
        },
        {
          name: "kind",
          type: "select",
          required: true,
          defaultValue: "video",
          label: { ru: "Тип примера", uk: "Тип прикладу", en: "Kind" },
          options: [
            { label: { ru: "Видео (MP4)", uk: "Відео (MP4)", en: "Video (MP4)" }, value: "video" },
            { label: { ru: "Сказка (PDF)", uk: "Казка (PDF)", en: "Storybook (PDF)" }, value: "storybook_pdf" },
            { label: { ru: "До / После", uk: "До / Після", en: "Before / After" }, value: "before_after" },
          ],
          admin: { width: "33%" },
        },
        {
          name: "demoLang",
          type: "select",
          required: true,
          defaultValue: "uk",
          label: { ru: "Язык самого образца", uk: "Мова самого зразка", en: "Sample Language" },
          options: [
            { label: "Українська (UA)", value: "uk" },
            { label: "Русский (RU)", value: "ru" },
          ],
          admin: { width: "33%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "service",
          type: "relationship",
          relationTo: "services",
          label: { ru: "Услуга", uk: "Послуга", en: "Service" },
          admin: { width: "35%" },
        },
        {
          name: "serviceVariation",
          type: "relationship",
          relationTo: "service-variations",
          label: { ru: "Вариация (опц.)", uk: "Варіація (опц.)", en: "Variation (opt.)" },
          admin: { width: "35%" },
        },
        {
          name: "sortOrder",
          type: "number",
          defaultValue: 10,
          label: { ru: "Порядок", uk: "Порядок", en: "Sort Order" },
          admin: { width: "15%" },
        },
        {
          name: "featuredOnHome",
          type: "checkbox",
          defaultValue: true,
          label: { ru: "На главной", uk: "На головній", en: "On Home" },
          admin: { width: "15%", style: { alignSelf: "flex-end" } },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "title",
          type: "text",
          localized: true,
          required: true,
          label: { ru: "Заголовок", uk: "Заголовок", en: "Title" },
          admin: { width: "50%" },
        },
        {
          name: "label",
          type: "text",
          localized: true,
          label: { ru: "Подпись вкладки переключателя", uk: "Підпис вкладки перемикача", en: "Tab Label" },
          admin: { width: "50%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "badge",
          type: "text",
          localized: true,
          label: { ru: "Бейдж", uk: "Бейдж", en: "Badge" },
          admin: { width: "50%" },
        },
        {
          name: "subtitle",
          type: "text",
          localized: true,
          label: { ru: "Подзаголовок", uk: "Підзаголовок", en: "Subtitle" },
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "audienceNote",
      type: "textarea",
      localized: true,
      label: { ru: "Комментарий / описание", uk: "Коментар / опис", en: "Note" },
    },
    {
      type: "row",
      fields: [
        {
          name: "recipientName",
          type: "text",
          label: { ru: "Имя героя в примере", uk: "Ім'я героя у прикладі", en: "Recipient Name" },
          admin: { width: "25%" },
        },
        {
          name: "age",
          type: "text",
          label: { ru: "Возраст", uk: "Вік", en: "Age" },
          admin: { width: "25%" },
        },
        {
          name: "duration",
          type: "text",
          label: { ru: "Длительность / объём", uk: "Тривалість / обсяг", en: "Duration" },
          admin: { width: "25%" },
        },
        {
          name: "companionLabel",
          type: "text",
          label: { ru: "Спутник (для сказки)", uk: "Супутник (для казки)", en: "Companion" },
          admin: { width: "25%" },
        },
      ],
    },
    {
      name: "achievement",
      type: "text",
      label: { ru: "Достижение (для видео)", uk: "Досягнення (для відео)", en: "Achievement" },
    },
    {
      type: "row",
      fields: [
        {
          name: "artStyle",
          type: "text",
          label: { ru: "Стиль сказки (ID)", uk: "Стиль казки (ID)", en: "Art Style ID" },
          admin: { width: "50%" },
        },
        {
          name: "layoutMode",
          type: "text",
          label: { ru: "Режим вёрстки (classic/panorama)", uk: "Режим верстки (classic/panorama)", en: "Layout Mode" },
          admin: { width: "50%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "mediaFile",
          type: "upload",
          relationTo: "media",
          label: { ru: "Файл видео/PDF (Медиа)", uk: "Файл відео/PDF (Медіа)", en: "Media File" },
          admin: { width: "50%" },
        },
        {
          name: "mediaUrl",
          type: "text",
          label: { ru: "Путь к MP4 / PDF", uk: "Шлях до MP4 / PDF", en: "Media URL" },
          admin: { width: "50%", placeholder: "/samples/video-nikolai/demo_video_uk.mp4" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "posterFile",
          type: "upload",
          relationTo: "media",
          label: { ru: "Постер / обложка (Медиа)", uk: "Постер / обкладинка (Медіа)", en: "Poster File" },
          admin: { width: "50%" },
        },
        {
          name: "posterUrl",
          type: "text",
          label: { ru: "Путь к постеру / обложке", uk: "Шлях до постера / обкладинки", en: "Poster URL" },
          admin: { width: "50%", placeholder: "/samples/video-nikolai/poster.jpg" },
        },
      ],
    },
  ],
};
