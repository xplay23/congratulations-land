import type { CollectionConfig } from "payload";
import { invalidateCmsContentCache } from "@/lib/cms-cache";

export const ServiceVariations: CollectionConfig = {
  slug: "service-variations",
  labels: {
    singular: { ru: "Вариация", uk: "Варіація", en: "Service Variation" },
    plural: { ru: "Вариации", uk: "Варіації", en: "Service Variations" },
  },
  admin: {
    group: { ru: "Каталог", uk: "Каталог", en: "Catalog" },
    useAsTitle: "title",
    defaultColumns: [
      "title",
      "service",
      "variationSlug",
      "enabled",
      "isDefault",
      "sortOrder",
    ],
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
          "/create/video",
          "/ru/create/video",
        ]);
      },
    ],
    afterDelete: [
      () => {
        invalidateCmsContentCache([
          "/",
          "/ru",
          "/svyatyj-mykolaj",
          "/ru/svyatyj-mykolaj",
          "/create/video",
          "/ru/create/video",
        ]);
      },
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: { ru: "Основное", uk: "Основне", en: "General" },
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
                  name: "service",
                  type: "relationship",
                  relationTo: "services",
                  required: true,
                  label: { ru: "Родительская услуга", uk: "Батьківська послуга", en: "Parent Service" },
                  admin: { width: "50%" },
                },
                {
                  name: "variationSlug",
                  type: "text",
                  required: true,
                  unique: true,
                  index: true,
                  label: { ru: "Слаг вариации", uk: "Слаг варіації", en: "Variation Slug" },
                  admin: {
                    width: "50%",
                    placeholder: "st-nicholas-room",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "enabled",
                  type: "checkbox",
                  defaultValue: true,
                  label: { ru: "Включена", uk: "Увімкнена", en: "Enabled" },
                  admin: { width: "25%" },
                },
                {
                  name: "isDefault",
                  type: "checkbox",
                  defaultValue: false,
                  label: { ru: "По умолчанию", uk: "За замовчуванням", en: "Default" },
                  admin: { width: "25%" },
                },
                {
                  name: "sortOrder",
                  type: "number",
                  defaultValue: 10,
                  label: { ru: "Сортировка", uk: "Сортування", en: "Sort Order" },
                  admin: { width: "25%" },
                },
                {
                  name: "priceOverrideUah",
                  type: "number",
                  min: 1,
                  max: 50000,
                  label: {
                    ru: "Своя цена (₴, опц.)",
                    uk: "Власна ціна (₴, опц.)",
                    en: "Price Override (UAH)",
                  },
                  admin: {
                    width: "25%",
                    description: {
                      ru: "Пусто = наследует цену услуги",
                      uk: "Порожньо = успадковує ціну послуги",
                      en: "Empty inherits service price",
                    },
                  },
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
                  label: { ru: "Название вариации", uk: "Назва варіації", en: "Variation Title" },
                  admin: { width: "60%" },
                },
                {
                  name: "shortBadge",
                  type: "text",
                  localized: true,
                  label: { ru: "Короткий бейдж", uk: "Короткий бейдж", en: "Short Badge" },
                  admin: { width: "40%" },
                },
              ],
            },
            {
              name: "description",
              type: "textarea",
              localized: true,
              label: { ru: "Описание сюжета / локации", uk: "Опис сюжету / локації", en: "Description" },
            },
            {
              type: "row",
              fields: [
                {
                  name: "previewImage",
                  type: "upload",
                  relationTo: "media",
                  label: { ru: "Превью-кадр (Медиа)", uk: "Прев'ю-кадр (Медіа)", en: "Preview Image" },
                  admin: { width: "50%" },
                },
                {
                  name: "fallbackPosterUrl",
                  type: "text",
                  label: { ru: "Путь к постеру", uk: "Шлях до постера", en: "Poster Path" },
                  admin: { width: "50%", placeholder: "/samples/video-nikolai/poster.jpg" },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "demoVideo",
                  type: "upload",
                  relationTo: "media",
                  label: { ru: "Демо-видео (Медиа)", uk: "Демо-відео (Медіа)", en: "Demo Video" },
                  admin: { width: "50%" },
                },
                {
                  name: "demoVideoUrl",
                  type: "text",
                  label: { ru: "Путь к демо-видео", uk: "Шлях до демо-відео", en: "Demo Video Path" },
                  admin: { width: "50%", placeholder: "/samples/video-nikolai/demo_video_uk.mp4" },
                },
              ],
            },
          ],
        },
        {
          label: { ru: "Пайплайн и озвучка", uk: "Пайплайн та озвучка", en: "Pipeline & Voice" },
          fields: [
            {
              name: "videoTemplate",
              type: "relationship",
              relationTo: "video-templates",
              label: {
                ru: "Видео-шаблон (студия таймлайна)",
                uk: "Відео-шаблон (студія таймлайну)",
                en: "Video Template (Timeline Studio)",
              },
              admin: {
                description: {
                  ru: "Если выбран — форма заказа, таймлайн, футажи и озвучка берутся целиком из этого шаблона. Иначе используется legacy-сборщик ниже.",
                  uk: "Якщо вибрано — форма замовлення, таймлайн, футажі та озвучка беруться цілком із цього шаблону. Інакше використовується legacy-збирач нижче.",
                  en: "When set, order form, timeline, clips and TTS come entirely from this Video Template.",
                },
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "pipelineTemplateId",
                  type: "text",
                  defaultValue: "st_nicholas_room",
                  label: {
                    ru: "ID шаблона видео-пайплайна",
                    uk: "ID шаблону відео-пайплайну",
                    en: "Pipeline Template ID",
                  },
                  admin: {
                    width: "50%",
                    description: {
                      ru: "Имя набора клипов для Python-сборщика (по умолчанию st_nicholas_room).",
                      uk: "Назва набору кліпів для Python-збирача (за замовчуванням st_nicholas_room).",
                      en: "Clip bundle identifier for assemble_pilot.py.",
                    },
                  },
                },
                {
                  name: "elevenLabsVoiceIdOverride",
                  type: "text",
                  label: {
                    ru: "Voice ID ElevenLabs (опционально)",
                    uk: "Voice ID ElevenLabs (опційно)",
                    en: "ElevenLabs Voice ID Override",
                  },
                  admin: {
                    width: "50%",
                    description: {
                      ru: "Если пусто — берётся основной голос из Настройки → ElevenLabs.",
                      uk: "Якщо порожньо — береться основний голос із Налаштування → ElevenLabs.",
                      en: "Leave empty to use default voice from ElevenLabs Settings.",
                    },
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "line03Uk",
                  type: "text",
                  label: "Реплика 03 (UA, опц.)",
                  admin: { width: "50%", placeholder: "Вітаю тебе, {voc}! ..." },
                },
                {
                  name: "line03Ru",
                  type: "text",
                  label: "Реплика 03 (RU, опц.)",
                  admin: { width: "50%", placeholder: "Здравствуй, {voc}! ..." },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "line04bUk",
                  type: "text",
                  label: "Реплика 04b (UA, опц.)",
                  admin: { width: "50%", placeholder: "{agePrefix} {ach}…" },
                },
                {
                  name: "line04bRu",
                  type: "text",
                  label: "Реплика 04b (RU, опц.)",
                  admin: { width: "50%", placeholder: "{agePrefix} {ach}…" },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "line07Uk",
                  type: "text",
                  label: "Реплика 07 (UA, опц.)",
                  admin: { width: "50%", placeholder: "Щасливих свят, {voc}!" },
                },
                {
                  name: "line07Ru",
                  type: "text",
                  label: "Реплика 07 (RU, опц.)",
                  admin: { width: "50%", placeholder: "Счастливых праздников, {voc}!" },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
