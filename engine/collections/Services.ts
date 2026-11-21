import type { CollectionConfig } from "payload";
import { pageBuilderBlocks } from "@engine/blocks";
import {
  invalidateCmsContentCache,
  invalidatePricingCache,
} from "@/lib/cms-cache";

export const Services: CollectionConfig = {
  slug: "services",
  labels: {
    singular: { ru: "Услуга", uk: "Послуга", en: "Service" },
    plural: { ru: "Услуги", uk: "Послуги", en: "Services" },
  },
  admin: {
    group: { ru: "Каталог", uk: "Каталог", en: "Catalog" },
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "status", "basePriceUah", "sortOrder"],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      async ({ doc }) => {
        const slug = String((doc as { slug?: string }).slug || "");
        invalidatePricingCache();
        invalidateCmsContentCache([
          "/",
          "/ru",
          "/tsiny",
          "/ru/tsiny",
          ...(slug ? [`/${slug}`, `/ru/${slug}`] : []),
        ]);
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        const slug = String((doc as { slug?: string }).slug || "");
        invalidatePricingCache();
        invalidateCmsContentCache([
          "/",
          "/ru",
          "/tsiny",
          "/ru/tsiny",
          ...(slug ? [`/${slug}`, `/ru/${slug}`] : []),
        ]);
      },
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: {
            ru: "Основное и цена",
            uk: "Основне та ціна",
            en: "General & Pricing",
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "slug",
                  type: "text",
                  required: true,
                  unique: true,
                  index: true,
                  label: { ru: "URL-слаг", uk: "URL-слаг", en: "Slug" },
                  admin: {
                    width: "50%",
                    components: {
                      Field: "engine/components/admin/SlugField",
                    },
                  },
                },
                {
                  name: "serviceKey",
                  type: "select",
                  defaultValue: "custom",
                  label: {
                    ru: "Тип пайплайна / ключ услуги",
                    uk: "Тип пайплайну / ключ послуги",
                    en: "Service Key",
                  },
                  options: [
                    { label: { ru: "Видеопоздравление (video)", uk: "Відеопривітання (video)", en: "Video (video)" }, value: "video" },
                    { label: { ru: "Именная сказка PDF (storybook)", uk: "Іменна казка PDF (storybook)", en: "Storybook (storybook)" }, value: "storybook" },
                    { label: { ru: "Оживление фото (photo_animation)", uk: "Оживлення фото (photo_animation)", en: "Photo Animation" }, value: "photo_animation" },
                    { label: { ru: "Песня на заказ (song)", uk: "Пісня на замовлення (song)", en: "Song (song)" }, value: "song" },
                    { label: { ru: "Открытка (postcard)", uk: "Листівка (postcard)", en: "Postcard (postcard)" }, value: "postcard" },
                    { label: { ru: "Посадочная / без конструктора (custom)", uk: "Посадкова / без конструктора (custom)", en: "Custom landing" }, value: "custom" },
                  ],
                  admin: { width: "50%" },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "status",
                  type: "select",
                  required: true,
                  defaultValue: "active",
                  label: { ru: "Статус", uk: "Статус", en: "Status" },
                  options: [
                    { label: { ru: "Активна (доступна к заказу)", uk: "Активна (доступна для замовлення)", en: "Active" }, value: "active" },
                    { label: { ru: "Скоро (Coming soon)", uk: "Скоро (Coming soon)", en: "Coming soon" }, value: "coming_soon" },
                    { label: { ru: "Скрыта", uk: "Прихована", en: "Hidden" }, value: "hidden" },
                  ],
                  admin: { width: "34%" },
                },
                {
                  name: "sortOrder",
                  type: "number",
                  required: true,
                  defaultValue: 10,
                  label: { ru: "Порядок сортировки", uk: "Порядок сортування", en: "Sort Order" },
                  admin: { width: "33%" },
                },
                {
                  name: "showcaseKind",
                  type: "select",
                  defaultValue: "none",
                  label: { ru: "Встроенное демо на странице", uk: "Вбудоване демо на сторінці", en: "Embedded Showcase" },
                  options: [
                    { label: { ru: "Нет", uk: "Немає", en: "None" }, value: "none" },
                    { label: { ru: "Видеоплеер", uk: "Відеоплеєр", en: "Video Player" }, value: "video" },
                    { label: { ru: "PDF-сказка", uk: "PDF-казка", en: "Storybook PDF" }, value: "storybook" },
                  ],
                  admin: { width: "33%" },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "basePriceUah",
                  type: "number",
                  required: true,
                  defaultValue: 199,
                  min: 0,
                  max: 50000,
                  label: {
                    ru: "Базовая цена (₴)",
                    uk: "Базова ціна (₴)",
                    en: "Base Price (UAH)",
                  },
                  admin: {
                    width: "35%",
                    description: {
                      ru: "0 — цена не показывается (если услуга концептуальная/скоро).",
                      uk: "0 — ціна не показується (якщо послуга концептуальна/скоро).",
                      en: "0 hides price badge.",
                    },
                  },
                },
                {
                  name: "ctaOrderUrl",
                  type: "text",
                  label: {
                    ru: "Ссылка конструктора заказа (авто, опц.)",
                    uk: "Посилання конструктора замовлення (авто, опц.)",
                    en: "Order Constructor URL (auto, opt.)",
                  },
                  admin: {
                    width: "65%",
                    placeholder: "Оставьте пустым — соберётся автоматически по типу и слагу",
                    description: {
                      ru: "Для услуг с типом video ссылка /create/video?service=<slug> подставится автоматически (для storybook — /create/storybook). Заполняйте только если нужен нестандартный URL.",
                      uk: "Для послуг із типом video посилання /create/video?service=<slug> підставиться автоматично (для storybook — /create/storybook). Заповнюйте лише для нестандартного URL.",
                      en: "Auto-resolves to /create/video?service=<slug> for video services and /create/storybook for storybooks when empty.",
                    },
                  },
                },
              ],
            },
            {
              name: "pricingTiers",
              type: "array",
              label: {
                ru: "Тарифные варианты (тиры)",
                uk: "Тарифні варіанти (тіри)",
                en: "Pricing Tiers",
              },
              labels: {
                singular: { ru: "Вариант цены", uk: "Варіант ціни", en: "Tier" },
                plural: { ru: "Варианты цены", uk: "Варіанти ціни", en: "Tiers" },
              },
              admin: {
                initCollapsed: false,
                description: {
                  ru: "Например для сказок: ключи 4, 6, 8 (количество страниц). Для фото: single, pack_3.",
                  uk: "Наприклад для казок: ключі 4, 6, 8 (кількість сторінок). Для фото: single, pack_3.",
                  en: "E.g. 4, 6, 8 for storybook page counts.",
                },
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "key",
                      type: "text",
                      required: true,
                      label: { ru: "Ключ", uk: "Ключ", en: "Key" },
                      admin: { width: "22%", placeholder: "6" },
                    },
                    {
                      name: "label",
                      type: "text",
                      localized: true,
                      label: { ru: "Подпись", uk: "Підпис", en: "Label" },
                      admin: { width: "43%", placeholder: "6 сторінок / 6 страниц" },
                    },
                    {
                      name: "priceUah",
                      type: "number",
                      required: true,
                      min: 1,
                      max: 50000,
                      label: { ru: "Цена (₴)", uk: "Ціна (₴)", en: "Price (UAH)" },
                      admin: { width: "20%" },
                    },
                    {
                      name: "isPopular",
                      type: "checkbox",
                      defaultValue: false,
                      label: { ru: "Хит", uk: "Хіт", en: "Popular" },
                      admin: { width: "15%", style: { alignSelf: "flex-end" } },
                    },
                  ],
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "coverImage",
                  type: "upload",
                  relationTo: "media",
                  label: { ru: "Обложка (Медиа)", uk: "Обкладинка (Медіа)", en: "Cover Image" },
                  admin: { width: "50%" },
                },
                {
                  name: "fallbackImageUrl",
                  type: "text",
                  label: {
                    ru: "Резервный путь к изображению",
                    uk: "Резервний шлях до зображення",
                    en: "Fallback Image URL",
                  },
                  admin: {
                    width: "50%",
                    placeholder: "/samples/video-nikolai/poster.jpg",
                  },
                },
              ],
            },
            {
              name: "previewIsConcept",
              type: "checkbox",
              defaultValue: false,
              label: {
                ru: "Пометить превью как «Визуальный концепт»",
                uk: "Позначити прев'ю як «Візуальний концепт»",
                en: "Mark preview as visual concept",
              },
            },
            {
              name: "relatedServices",
              type: "relationship",
              relationTo: "services",
              hasMany: true,
              label: {
                ru: "Похожие услуги",
                uk: "Схожі послуги",
                en: "Related Services",
              },
            },
          ],
        },
        {
          label: {
            ru: "Контент (UA / RU)",
            uk: "Контент (UA / RU)",
            en: "Content (UA / RU)",
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
                  label: { ru: "Название услуги (карточка)", uk: "Назва послуги (картка)", en: "Service Title" },
                  admin: { width: "55%" },
                },
                {
                  name: "label",
                  type: "text",
                  localized: true,
                  label: { ru: "Короткое название (меню / хлебные крошки)", uk: "Коротка назва (меню / хлібні крихти)", en: "Short Label" },
                  admin: { width: "45%" },
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
                  name: "ctaLabel",
                  type: "text",
                  localized: true,
                  label: { ru: "Текст кнопки заказа", uk: "Текст кнопки замовлення", en: "CTA Button Label" },
                  admin: { width: "50%" },
                },
              ],
            },
            {
              name: "shortDescription",
              type: "textarea",
              localized: true,
              label: { ru: "Краткое описание карточки", uk: "Короткий опис картки", en: "Short Description" },
            },
            {
              name: "features",
              type: "array",
              localized: true,
              label: { ru: "Преимущества (список на карточке)", uk: "Переваги (список на картці)", en: "Features" },
              labels: {
                singular: { ru: "Пункт", uk: "Пункт", en: "Feature" },
                plural: { ru: "Пункты", uk: "Пункти", en: "Features" },
              },
              admin: {
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  name: "text",
                  type: "text",
                  required: true,
                  label: { ru: "Текст пункта", uk: "Текст пункту", en: "Text" },
                },
              ],
            },
            {
              name: "h1",
              type: "text",
              localized: true,
              label: { ru: "Заголовок H1 посадочной страницы", uk: "Заголовок H1 посадкової сторінки", en: "Landing H1" },
            },
            {
              name: "intro",
              type: "textarea",
              localized: true,
              label: { ru: "Лид / вступление страницы услуги", uk: "Лід / вступ сторінки послуги", en: "Landing Intro" },
            },
            {
              name: "heroFootnote",
              type: "text",
              localized: true,
              label: { ru: "Подпись под кнопкой в Hero", uk: "Підпис під кнопкою в Hero", en: "Hero Footnote" },
            },
            {
              name: "sections",
              type: "array",
              localized: true,
              label: { ru: "Секции описания на странице услуги", uk: "Секції опису на сторінці послуги", en: "Landing Sections" },
              labels: {
                singular: { ru: "Секция", uk: "Секція", en: "Section" },
                plural: { ru: "Секции", uk: "Секції", en: "Sections" },
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true,
                  label: { ru: "Заголовок секции", uk: "Заголовок секції", en: "Section Title" },
                },
                {
                  name: "text",
                  type: "textarea",
                  label: { ru: "Текст секции", uk: "Текст секції", en: "Section Text" },
                },
                {
                  name: "steps",
                  type: "array",
                  label: { ru: "Шаги / пункты", uk: "Кроки / пункти", en: "Steps" },
                  admin: {
                    initCollapsed: true,
                    components: {
                      RowLabel: "engine/components/admin/FirstFieldRowLabel",
                    },
                  },
                  fields: [
                    {
                      name: "step",
                      type: "text",
                      required: true,
                      label: { ru: "Шаг", uk: "Крок", en: "Step" },
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "includePriceNote",
                      type: "checkbox",
                      defaultValue: false,
                      label: { ru: "Показать блок актуальной цены", uk: "Показати блок актуальної ціни", en: "Include Price Note" },
                      admin: { width: "50%" },
                    },
                    {
                      name: "priceLink",
                      type: "checkbox",
                      defaultValue: false,
                      label: { ru: "Показать ссылку на /tsiny", uk: "Показати посилання на /tsiny", en: "Show Pricing Link" },
                      admin: { width: "50%" },
                    },
                  ],
                },
              ],
            },
            {
              name: "extraBlocks",
              type: "blocks",
              localized: true,
              blocks: pageBuilderBlocks,
              label: {
                ru: "Конструктор блоков страницы (FAQ, отзывы, CTA и др.)",
                uk: "Конструктор блоків сторінки (FAQ, відгуки, CTA та ін.)",
                en: "Page Builder Blocks (FAQ, Reviews, CTA, etc.)",
              },
              admin: {
                initCollapsed: true,
                description: {
                  ru: "Свободная область конструктора на странице услуги: добавляйте FAQ, отзывы, дополнительные секции, шаги и призывы к действию.",
                  uk: "Вільна область конструктора на сторінці послуги: додавайте FAQ, відгуки, додаткові секції, кроки та заклики до дії.",
                  en: "Free visual block builder area rendered on this service's landing page.",
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
