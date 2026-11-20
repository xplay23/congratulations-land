import type { CollectionConfig } from "payload";
import { invalidateCmsContentCache } from "@/lib/cms-cache";

export const Reviews: CollectionConfig = {
  slug: "reviews",
  labels: {
    singular: { ru: "Отзыв", uk: "Відгук", en: "Review" },
    plural: { ru: "Отзывы", uk: "Відгуки", en: "Reviews" },
  },
  admin: {
    group: { ru: "Каталог", uk: "Каталог", en: "Catalog" },
    useAsTitle: "authorName",
    defaultColumns: [
      "authorName",
      "reviewType",
      "rating",
      "service",
      "sortOrder",
    ],
    description: {
      ru: "Отзывы хранятся на оригинальном языке автора (украинский или русский) и не переводятся.",
      uk: "Відгуки зберігаються мовою оригіналу автора (українською або російською) і не перекладаються.",
      en: "Reviews are kept in the author's original language without translation.",
    },
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      () => {
        invalidateCmsContentCache(["/", "/ru"]);
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
      type: "row",
      fields: [
        {
          name: "reviewType",
          type: "select",
          required: true,
          defaultValue: "text",
          label: { ru: "Тип отзыва", uk: "Тип відгуку", en: "Review Type" },
          options: [
            {
              label: {
                ru: "Текстовый отзыв (с опциональным фото)",
                uk: "Текстовий відгук (з опційним фото)",
                en: "Text Review (optional photo)",
              },
              value: "text",
            },
            {
              label: {
                ru: "Отзыв из Instagram (встраиваемый)",
                uk: "Відгук з Instagram (вбудований)",
                en: "Instagram Embed",
              },
              value: "instagram",
            },
          ],
          admin: { width: "45%" },
        },
        {
          name: "authorName",
          type: "text",
          required: true,
          label: {
            ru: "Имя автора / @аккаунт",
            uk: "Ім'я автора / @акаунт",
            en: "Author Name / @handle",
          },
          admin: { width: "35%" },
        },
        {
          name: "rating",
          type: "number",
          required: true,
          defaultValue: 5,
          min: 1,
          max: 5,
          label: { ru: "Оценка (1–5)", uk: "Оцінка (1–5)", en: "Rating (1-5)" },
          admin: { width: "20%" },
        },
      ],
    },
    // ── Text review fields ────────────────────────────────────────────────────
    {
      name: "authorLocation",
      type: "text",
      label: { ru: "Город / подпись", uk: "Місто / підпис", en: "Location / Note" },
      admin: {
        placeholder: "Київ · мама Андрійка (6 років)",
        condition: (data) => data?.reviewType !== "instagram",
      },
    },
    {
      name: "quote",
      type: "textarea",
      label: {
        ru: "Текст отзыва (оригинал)",
        uk: "Текст відгуку (оригінал)",
        en: "Review Text (Original)",
      },
      admin: {
        description: {
          ru: "Обязательно для текстового отзыва; для Instagram можно оставить короткую подпись.",
          uk: "Обов'язково для текстового відгуку; для Instagram можна залишити короткий підпис.",
          en: "Required for text reviews; optional caption for Instagram.",
        },
      },
    },
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
      label: {
        ru: "Фото / скриншот к отзыву (опц.)",
        uk: "Фото / скриншот до відгуку (опц.)",
        en: "Review Photo (optional)",
      },
      admin: {
        condition: (data) => data?.reviewType !== "instagram",
      },
    },
    // ── Instagram review fields ───────────────────────────────────────────────
    {
      name: "instagramUrl",
      type: "text",
      label: {
        ru: "Ссылка на пост / Reels в Instagram",
        uk: "Посилання на пост / Reels в Instagram",
        en: "Instagram Post / Reel URL",
      },
      admin: {
        placeholder: "https://www.instagram.com/p/... или https://www.instagram.com/reel/...",
        condition: (data) => data?.reviewType === "instagram",
      },
    },
    {
      name: "instagramEmbedHtml",
      type: "textarea",
      label: {
        ru: "Embed-код Instagram (опционально)",
        uk: "Embed-код Instagram (опційно)",
        en: "Instagram Embed Code (optional)",
      },
      admin: {
        description: {
          ru: "Если пусто — встраивание построится автоматически по ссылке выше.",
          uk: "Якщо порожньо — вбудовування побудується автоматично за посиланням вище.",
          en: "Leave empty to embed automatically from the URL above.",
        },
        condition: (data) => data?.reviewType === "instagram",
      },
    },
    {
      name: "instagramScreenshot",
      type: "upload",
      relationTo: "media",
      label: {
        ru: "Резервный скриншот / обложка (опц.)",
        uk: "Резервний скриншот / обкладинка (опц.)",
        en: "Fallback Screenshot (optional)",
      },
      admin: {
        condition: (data) => data?.reviewType === "instagram",
      },
    },
    // ── Common meta ───────────────────────────────────────────────────────────
    {
      type: "row",
      fields: [
        {
          name: "service",
          type: "relationship",
          relationTo: "services",
          label: { ru: "Услуга", uk: "Послуга", en: "Service" },
          admin: { width: "45%" },
        },
        {
          name: "publishedDate",
          type: "date",
          label: { ru: "Дата", uk: "Дата", en: "Date" },
          admin: { width: "30%" },
        },
        {
          name: "sortOrder",
          type: "number",
          defaultValue: 10,
          label: { ru: "Порядок", uk: "Порядок", en: "Sort Order" },
          admin: { width: "25%" },
        },
      ],
    },
  ],
};
