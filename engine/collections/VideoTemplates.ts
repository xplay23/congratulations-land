import type { CollectionConfig } from "payload";
import { videoFormFieldBlocks } from "@engine/blocks/videoFormFields";
import { invalidateCmsContentCache } from "@/lib/cms-cache";
import {
  EMPTY_TIMELINE_CONFIG,
  extractTimelineAssetIds,
  parseTimelineConfig,
} from "@/lib/video/template-schema";

export const VideoTemplates: CollectionConfig = {
  slug: "video-templates",
  labels: {
    singular: { ru: "Видео-шаблон", uk: "Відео-шаблон", en: "Video Template" },
    plural: { ru: "Видео-шаблоны", uk: "Відео-шаблони", en: "Video Templates" },
  },
  admin: {
    group: { ru: "Производство", uk: "Виробництво", en: "Production" },
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "enabled", "updatedAt"],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;
        if (data.timelineConfig !== undefined) {
          const parsed = parseTimelineConfig(data.timelineConfig);
          data.timelineConfig = parsed;
        }
        return data;
      },
    ],
    beforeChange: [
      ({ data }) => {
        if (!data) return data;
        const assetIds = new Set<number>();

        const addRelId = (val: unknown) => {
          if (val === null || val === undefined || val === "") return;
          const raw =
            typeof val === "object" && val !== null && "id" in val
              ? (val as { id: unknown }).id
              : val;
          const n = Number(raw);
          if (Number.isInteger(n) && n > 0) assetIds.add(n);
        };

        addRelId(data.bgmAsset);
        addRelId(data.ambientAsset);

        if (data.timelineConfig) {
          try {
            const parsed = parseTimelineConfig(data.timelineConfig);
            for (const id of extractTimelineAssetIds(parsed)) {
              assetIds.add(id);
            }
          } catch {
            // Validated in beforeValidate
          }
        }

        data.usedAssets = Array.from(assetIds);
        return data;
      },
    ],
    afterChange: [
      () => {
        invalidateCmsContentCache([
          "/create/video",
          "/ru/create/video",
          "/svyatyj-mykolaj",
          "/ru/svyatyj-mykolaj",
        ]);
      },
    ],
    afterDelete: [
      () => {
        invalidateCmsContentCache([
          "/create/video",
          "/ru/create/video",
          "/svyatyj-mykolaj",
          "/ru/svyatyj-mykolaj",
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
            ru: "Основное и звук",
            uk: "Основне та звук",
            en: "General & Audio",
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true,
                  label: { ru: "Название шаблона", uk: "Назва шаблону", en: "Template Title" },
                  admin: { width: "45%" },
                },
                {
                  name: "slug",
                  type: "text",
                  required: true,
                  unique: true,
                  index: true,
                  label: { ru: "Слаг шаблона", uk: "Слаг шаблону", en: "Slug" },
                  admin: {
                    width: "35%",
                    components: {
                      Field: "engine/components/admin/SlugField",
                    },
                  },
                },
                {
                  name: "enabled",
                  type: "checkbox",
                  defaultValue: true,
                  label: { ru: "Активен", uk: "Активний", en: "Enabled" },
                  admin: { width: "20%" },
                },
              ],
            },
            {
              name: "notes",
              type: "textarea",
              label: { ru: "Внутренние заметки", uk: "Внутрішні нотатки", en: "Internal Notes" },
            },
            {
              type: "collapsible",
              label: { ru: "Голос ElevenLabs", uk: "Голос ElevenLabs", en: "ElevenLabs Voice" },
              admin: { initCollapsed: false },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "elevenLabsVoiceId",
                      type: "text",
                      label: {
                        ru: "Голос шаблона (Voice ID, опц.)",
                        uk: "Голос шаблону (Voice ID, опц.)",
                        en: "Template Voice ID (optional)",
                      },
                      admin: {
                        width: "30%",
                        description: {
                          ru: "Пусто = голос из Настройки → ElevenLabs.",
                          uk: "Порожньо = голос із Налаштування → ElevenLabs.",
                          en: "Empty inherits ElevenLabs Settings default voice.",
                        },
                        components: {
                          Field: "engine/components/admin/ElevenLabsVoiceField#ElevenLabsVoiceField",
                        },
                      },
                    },
                    {
                      name: "elevenLabsModelId",
                      type: "text",
                      label: {
                        ru: "Модель ElevenLabs (опц.)",
                        uk: "Модель ElevenLabs (опц.)",
                        en: "ElevenLabs Model (optional)",
                      },
                      admin: {
                        width: "26%",
                        components: {
                          Field: "engine/components/admin/HiddenModelField/ElevenLabsModel",
                        },
                      },
                    },
                    {
                      name: "stability",
                      type: "number",
                      min: 0,
                      max: 1,
                      defaultValue: 0.5,
                      label: { ru: "Стабильность (Stability)", uk: "Стабільність (Stability)", en: "Stability" },
                      admin: {
                        width: "22%",
                        step: 0.01,
                        components: {
                          Field: "engine/components/admin/RangeNumberField#RangeNumberField",
                        },
                      },
                    },
                    {
                      name: "similarityBoost",
                      type: "number",
                      min: 0,
                      max: 1,
                      defaultValue: 0.78,
                      label: {
                        ru: "Схожесть тембра (Similarity Boost)",
                        uk: "Схожість тембру (Similarity Boost)",
                        en: "Similarity Boost",
                      },
                      admin: {
                        width: "22%",
                        step: 0.01,
                        components: {
                          Field: "engine/components/admin/RangeNumberField#RangeNumberField",
                        },
                      },
                    },
                  ],
                },
                {
                  name: "bulkRevoiceAction",
                  type: "ui",
                  admin: {
                    components: {
                      Field: "engine/components/admin/VideoTimelineStudio/BulkRevoiceButton",
                    },
                  },
                },
              ],
            },
            {
              type: "collapsible",
              label: {
                ru: "Фоновая музыка, амбиент и параметры рендера",
                uk: "Фонова музика, амбієнт і параметри рендеру",
                en: "BGM, Ambient & Render Settings",
              },
              admin: { initCollapsed: false },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "bgmAsset",
                      type: "upload",
                      relationTo: "pipeline-assets",
                      label: { ru: "Фоновая музыка (BGM)", uk: "Фонова музика (BGM)", en: "BGM Audio" },
                      admin: { width: "50%" },
                    },
                    {
                      name: "bgmVolume",
                      type: "number",
                      defaultValue: 0.38,
                      min: 0,
                      max: 1.5,
                      label: { ru: "Громкость BGM", uk: "Гучність BGM", en: "BGM Volume" },
                      admin: { width: "25%", step: 0.02 },
                    },
                    {
                      name: "duckingPreset",
                      type: "select",
                      defaultValue: "standard",
                      label: { ru: "Приглушение под речь", uk: "Приглушення під мову", en: "Sidechain Ducking" },
                      options: [
                        { label: { ru: "Мягкое", uk: "М'яке", en: "Gentle" }, value: "gentle" },
                        { label: { ru: "Стандартное", uk: "Стандартне", en: "Standard" }, value: "standard" },
                        { label: { ru: "Сильное", uk: "Сильне", en: "Strong" }, value: "strong" },
                      ],
                      admin: { width: "25%" },
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "ambientMode",
                      type: "select",
                      defaultValue: "extract_from_shot",
                      label: { ru: "Источник амбиента", uk: "Джерело амбієнту", en: "Ambient Source" },
                      options: [
                        { label: { ru: "Без амбиента", uk: "Без амбієнту", en: "None" }, value: "none" },
                        { label: { ru: "Отдельный аудио-ассет", uk: "Окремий аудіо-асет", en: "Uploaded Asset" }, value: "asset" },
                        { label: { ru: "Извлечь из шота", uk: "Витягти з шоту", en: "Extract From Shot" }, value: "extract_from_shot" },
                      ],
                      admin: { width: "34%" },
                    },
                    {
                      name: "ambientStartShotKey",
                      type: "text",
                      defaultValue: "02",
                      label: { ru: "С какого шота старт амбиента", uk: "З якого шоту старт амбієнту", en: "Ambient Start Shot Key" },
                      admin: { width: "33%" },
                    },
                    {
                      name: "ambientVolume",
                      type: "number",
                      defaultValue: 0.2,
                      min: 0,
                      max: 1.5,
                      label: { ru: "Громкость амбиента", uk: "Гучність амбієнту", en: "Ambient Volume" },
                      admin: { width: "33%", step: 0.02 },
                    },
                  ],
                },
                {
                  name: "ambientAsset",
                  type: "upload",
                  relationTo: "pipeline-assets",
                  label: { ru: "Аудио-ассет амбиента", uk: "Аудіо-асет амбієнту", en: "Ambient Audio Asset" },
                  admin: {
                    condition: (_, siblingData) => siblingData?.ambientMode === "asset",
                  },
                },
                {
                  type: "row",
                  admin: {
                    condition: (_, siblingData) => siblingData?.ambientMode === "extract_from_shot",
                  },
                  fields: [
                    {
                      name: "ambientSourceShotKey",
                      type: "text",
                      defaultValue: "02",
                      label: { ru: "Ключ шота-источника", uk: "Ключ шоту-джерела", en: "Source Shot Key" },
                      admin: { width: "34%" },
                    },
                    {
                      name: "ambientExtractStart",
                      type: "number",
                      defaultValue: 0.2,
                      min: 0,
                      label: { ru: "Начало (сек)", uk: "Початок (сек)", en: "Start (sec)" },
                      admin: { width: "33%", step: 0.1 },
                    },
                    {
                      name: "ambientExtractEnd",
                      type: "number",
                      defaultValue: 9.5,
                      min: 0.5,
                      label: { ru: "Конец (сек)", uk: "Кінець (сек)", en: "End (sec)" },
                      admin: { width: "33%", step: 0.1 },
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "outputWidth",
                      type: "number",
                      defaultValue: 1280,
                      label: { ru: "Ширина (px)", uk: "Ширина (px)", en: "Width (px)" },
                      admin: { width: "20%" },
                    },
                    {
                      name: "outputHeight",
                      type: "number",
                      defaultValue: 720,
                      label: { ru: "Высота (px)", uk: "Висота (px)", en: "Height (px)" },
                      admin: { width: "20%" },
                    },
                    {
                      name: "fps",
                      type: "number",
                      defaultValue: 24,
                      label: "FPS",
                      admin: { width: "20%" },
                    },
                    {
                      name: "endFadeColor",
                      type: "text",
                      defaultValue: "#2a1a08",
                      label: { ru: "Цвет финального fade", uk: "Колір фінального fade", en: "End Fade Color" },
                      admin: { width: "20%" },
                    },
                    {
                      name: "endFadeDuration",
                      type: "number",
                      defaultValue: 0.45,
                      min: 0,
                      max: 3,
                      label: { ru: "Длит. fade (с)", uk: "Трив. fade (с)", en: "Fade Dur (s)" },
                      admin: { width: "20%", step: 0.05 },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: {
            ru: "Форма заказа",
            uk: "Форма замовлення",
            en: "Order Form",
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
              type: "collapsible",
              label: {
                ru: "Карточка персонажа и совет родителям (UA / RU)",
                uk: "Картка персонажа та порада батькам (UA / RU)",
                en: "Character Showcase & Parent Advice",
              },
              admin: { initCollapsed: false },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "cardBadge",
                      type: "text",
                      localized: true,
                      label: { ru: "Бейдж персонажа", uk: "Бейдж персонажа", en: "Character Badge" },
                      admin: { width: "50%", placeholder: "Персонаж • ~49 секунд" },
                    },
                    {
                      name: "cardTitle",
                      type: "text",
                      localized: true,
                      label: { ru: "Заголовок карточки", uk: "Заголовок картки", en: "Card Title" },
                      admin: { width: "50%" },
                    },
                  ],
                },
                {
                  name: "cardDescription",
                  type: "textarea",
                  localized: true,
                  label: { ru: "Описание в карточке", uk: "Опис у картці", en: "Card Description" },
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "cardPreviewImage",
                      type: "upload",
                      relationTo: "media",
                      label: { ru: "Превью-кадр (Медиа)", uk: "Прев'ю-кадр (Медіа)", en: "Preview Image (Media)" },
                      admin: { width: "50%" },
                    },
                    {
                      name: "cardPreviewFallbackUrl",
                      type: "text",
                      label: { ru: "Путь превью-кадра (fallback, опц.)", uk: "Шлях прев'ю-кадру (fallback, опц.)", en: "Fallback Preview URL (opt.)" },
                      admin: {
                        width: "50%",
                        placeholder: "Пусто = автокадр из 1-го шота",
                        description: {
                          ru: "Если не загружено фото и поле пустое — автоматически берётся кадр из первого шота таймлайна.",
                          uk: "Якщо не завантажено фото і поле порожнє — автоматично береться кадр із першого шоту таймлайну.",
                          en: "Leave empty to automatically extract a frame from the first shot.",
                        },
                      },
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "parentAdviceTitle",
                      type: "text",
                      localized: true,
                      label: { ru: "Заголовок совета родителям", uk: "Заголовок поради батькам", en: "Parent Advice Title" },
                      admin: { width: "35%" },
                    },
                    {
                      name: "parentAdviceText",
                      type: "textarea",
                      localized: true,
                      label: { ru: "Текст совета родителям", uk: "Текст поради батькам", en: "Parent Advice Text" },
                      admin: { width: "65%" },
                    },
                  ],
                },
              ],
            },
            {
              name: "formFields",
              type: "blocks",
              blocks: videoFormFieldBlocks,
              label: {
                ru: "Поля клиентской формы заказа",
                uk: "Поля клієнтської форми замовлення",
                en: "Client Order Form Fields",
              },
              admin: {
                description: {
                  ru: "Порядок и типы полей, которые увидит клиент на странице заказа. Ключи переменных (например childName, voc, age, achievement, photo) доступны в репликах и оверлеях.",
                  uk: "Порядок і типи полів, які побачить клієнт на сторінці замовлення. Ключі змінних доступні у репліках та оверлеях.",
                  en: "Fields shown to customers on the video order page.",
                },
              },
            },
          ],
        },
        {
          label: {
            ru: "Студия таймлайна",
            uk: "Студія таймлайну",
            en: "Timeline Studio",
          },
          fields: [
            {
              name: "timelineConfig",
              type: "json",
              defaultValue: EMPTY_TIMELINE_CONFIG,
              label: {
                ru: "Конфигурация таймлайна (шоты, реплики UA/RU, оверлеи)",
                uk: "Конфігурація таймлайну (шоти, репліки UA/RU, оверлеї)",
                en: "Timeline Config",
              },
              admin: {
                components: {
                  Field: "engine/components/admin/VideoTimelineStudio",
                },
              },
            },
            {
              name: "usedAssets",
              type: "relationship",
              relationTo: "pipeline-assets",
              hasMany: true,
              label: {
                ru: "Используемые ассеты (авто)",
                uk: "Використовувані асети (авто)",
                en: "Used Assets (auto)",
              },
              admin: {
                readOnly: true,
                description: {
                  ru: "Автоматически синхронизируется из таймлайна и звуковых настроек при сохранении.",
                  uk: "Автоматично синхронізується з таймлайну та налаштувань звуку при збереженні.",
                  en: "Auto-synced from timelineConfig and audio settings on save.",
                },
              },
            },
          ],
        },
        {
          label: {
            ru: "Тест-рендер",
            uk: "Тест-рендер",
            en: "Test Render",
          },
          fields: [
            {
              name: "testRenderPanel",
              type: "ui",
              admin: {
                components: {
                  Field: "engine/components/admin/VideoTimelineStudio/VideoTemplateTestRender",
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
