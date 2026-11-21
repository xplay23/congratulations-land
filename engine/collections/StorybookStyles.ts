import type { CollectionConfig } from "payload";
import {
  invalidateAiConfigCache,
  invalidateCmsContentCache,
  invalidateStorybookConfigCache,
} from "@/lib/cms-cache";

export const StorybookStyles: CollectionConfig = {
  slug: "storybook-styles",
  labels: {
    singular: { ru: "Стиль сказки", uk: "Стиль казки", en: "Storybook Style" },
    plural: { ru: "Стили сказок", uk: "Стилі казок", en: "Storybook Styles" },
  },
  admin: {
    group: { ru: "Производство", uk: "Виробництво", en: "Production" },
    useAsTitle: "title",
    defaultColumns: [
      "title",
      "slug",
      "mediumPreset",
      "enabled",
      "isDefault",
      "sortOrder",
    ],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [
      () => {
        invalidateStorybookConfigCache();
        invalidateAiConfigCache();
        invalidateCmsContentCache([
          "/create/storybook",
          "/ru/create/storybook",
          "/kazka",
          "/ru/kazka",
          "/",
          "/ru",
        ]);
      },
    ],
    afterDelete: [
      () => {
        invalidateStorybookConfigCache();
        invalidateAiConfigCache();
        invalidateCmsContentCache([
          "/create/storybook",
          "/ru/create/storybook",
          "/kazka",
          "/ru/kazka",
          "/",
          "/ru",
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
            ru: "Витрина (UA / RU)",
            uk: "Вітрина (UA / RU)",
            en: "Storefront (UA / RU)",
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
                  label: {
                    ru: "Название стиля",
                    uk: "Назва стилю",
                    en: "Style Title",
                  },
                  admin: { width: "50%" },
                },
                {
                  name: "slug",
                  type: "text",
                  required: true,
                  unique: true,
                  index: true,
                  label: {
                    ru: "Код / слаг стиля",
                    uk: "Код / слаг стилю",
                    en: "Style Slug",
                  },
                  admin: {
                    width: "50%",
                    components: {
                      Field: "engine/components/admin/SlugField",
                    },
                    description: {
                      ru: "Латиницей, например watercolor, 3d_pixar, anime_cozy.",
                      uk: "Латиницею, наприклад watercolor, 3d_pixar, anime_cozy.",
                      en: "Latin identifier, e.g. watercolor, 3d_pixar, anime_cozy.",
                    },
                  },
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
                  label: {
                    ru: "Бейдж (опц.)",
                    uk: "Бейдж (опц.)",
                    en: "Badge (opt.)",
                  },
                  admin: {
                    width: "40%",
                    placeholder: "Хит / Новинка",
                  },
                },
                {
                  name: "sortOrder",
                  type: "number",
                  defaultValue: 50,
                  label: {
                    ru: "Порядок",
                    uk: "Порядок",
                    en: "Sort Order",
                  },
                  admin: { width: "20%" },
                },
                {
                  name: "enabled",
                  type: "checkbox",
                  defaultValue: true,
                  label: {
                    ru: "Активен на сайте",
                    uk: "Активний на сайті",
                    en: "Enabled",
                  },
                  admin: { width: "20%", style: { alignSelf: "flex-end" } },
                },
                {
                  name: "isDefault",
                  type: "checkbox",
                  defaultValue: false,
                  label: {
                    ru: "По умолчанию",
                    uk: "За замовчуванням",
                    en: "Default",
                  },
                  admin: { width: "20%", style: { alignSelf: "flex-end" } },
                },
              ],
            },
            {
              name: "description",
              type: "textarea",
              localized: true,
              required: true,
              label: {
                ru: "Краткое описание для карточки",
                uk: "Короткий опис для картки",
                en: "Card Description",
              },
              admin: { rows: 2 },
            },
            {
              type: "row",
              fields: [
                {
                  name: "previewImage",
                  type: "upload",
                  relationTo: "media",
                  label: {
                    ru: "Превью-картинка (Медиа)",
                    uk: "Прев'ю-зображення (Медіа)",
                    en: "Preview Image (Media)",
                  },
                  admin: { width: "50%" },
                },
                {
                  name: "fallbackImageUrl",
                  type: "text",
                  label: {
                    ru: "Резервный путь к превью",
                    uk: "Резервний шлях до прев'ю",
                    en: "Fallback Preview URL",
                  },
                  admin: {
                    width: "50%",
                    placeholder: "/samples/style_watercolor.jpg",
                  },
                },
              ],
            },
          ],
        },
        {
          label: {
            ru: "Промпт и рендер",
            uk: "Промпт і рендер",
            en: "Prompt & Render",
          },
          fields: [
            {
              name: "stylePrompt",
              type: "textarea",
              required: true,
              label: {
                ru: "Основной промпт стиля (EN)",
                uk: "Основний промпт стилю (EN)",
                en: "Style Prompt (EN)",
              },
              admin: {
                rows: 5,
                description: {
                  ru: "Передаётся в VisualBible (styleLock), Visual Director и генерацию всех иллюстраций и якорей.",
                  uk: "Передається у VisualBible (styleLock), Visual Director та генерацію всіх ілюстрацій і якорів.",
                  en: "Used as visualBible.styleLock across Visual Director and all illustrations.",
                },
              },
            },
            {
              name: "mediumPreset",
              type: "select",
              required: true,
              defaultValue: "2d_illustration",
              label: {
                ru: "Тип медиума (авто-правила перевода фото и anti-ripple)",
                uk: "Тип медіуму (авто-правила перекладу фото та anti-ripple)",
                en: "Medium Preset",
              },
              options: [
                {
                  label: {
                    ru: "2D-иллюстрация (акварель, гуашь, карандаш, 2D-анимация)",
                    uk: "2D-ілюстрація (акварель, гуаш, олівець, 2D-анімація)",
                    en: "2D Illustration",
                  },
                  value: "2d_illustration",
                },
                {
                  label: {
                    ru: "3D-анимация (CGI, Pixar-подобный свет)",
                    uk: "3D-анімація (CGI, Pixar-подібне світло)",
                    en: "3D Animation",
                  },
                  value: "3d_animation",
                },
                {
                  label: {
                    ru: "Пластилин / кукольная stop-motion миниатюра",
                    uk: "Пластилін / лялькова stop-motion мініатюра",
                    en: "Claymation / Stop-Motion",
                  },
                  value: "claymation_stopmotion",
                },
                {
                  label: {
                    ru: "Свой (использовать поля override ниже)",
                    uk: "Свій (використовувати поля override нижче)",
                    en: "Custom",
                  },
                  value: "custom",
                },
              ],
            },
            {
              name: "mediumRuleOverride",
              type: "textarea",
              label: {
                ru: "Переопределение правила перевода фото в стиль (опц., EN)",
                uk: "Перевизначення правила перекладу фото у стиль (опц., EN)",
                en: "Medium Translation Rule Override (opt., EN)",
              },
              admin: {
                rows: 3,
                description: {
                  ru: "Если пусто — используется проверенный пресет выбранного типа медиума.",
                  uk: "Якщо порожньо — використовується перевірений пресет обраного типу медіуму.",
                  en: "Leave empty to use the selected medium preset default.",
                },
              },
            },
            {
              name: "negativeRulesOverride",
              type: "textarea",
              label: {
                ru: "Переопределение anti-ripple / запретов артефактов (опц., EN)",
                uk: "Перевизначення anti-ripple / заборон артефактів (опц., EN)",
                en: "Anti-Ripple / Negative Rules Override (opt., EN)",
              },
              admin: {
                rows: 3,
                description: {
                  ru: "Если пусто — подставляется стандартный анти-артефакт блок для выбранного медиума.",
                  uk: "Якщо порожньо — підставляється стандартний анти-артефакт блок для обраного медіуму.",
                  en: "Leave empty to use the default anti-artifact rule for this medium.",
                },
              },
            },
          ],
        },
        {
          label: {
            ru: "Тест стиля",
            uk: "Тест стилю",
            en: "Style Sandbox",
          },
          fields: [
            {
              name: "styleTester",
              type: "ui",
              admin: {
                components: {
                  Field: "engine/components/admin/StorybookStyleTester",
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
