import type { GlobalConfig } from "payload";
import {
  invalidateAiConfigCache,
  invalidateCmsContentCache,
  invalidateStorybookConfigCache,
} from "@/lib/cms-cache";

export const StorybookConfig: GlobalConfig = {
  slug: "storybook-config",
  label: {
    ru: "Конструктор сказок",
    uk: "Конструктор казок",
    en: "Storybook Builder",
  },
  admin: {
    group: { ru: "Производство", uk: "Виробництво", en: "Production" },
    description: {
      ru: "Справочники формы заказа сказок, режимы вёрстки, системные промпты пайплайна и оформление PDF.",
      uk: "Довідники форми замовлення казок, режими верстки, системні промпти пайплайну та оформлення PDF.",
      en: "Storybook wizard options, layouts, pipeline prompts, and PDF styling.",
    },
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
      type: "tabs",
      tabs: [
        // ── Tab 1: Layouts, Age Groups, Page Volumes ─────────────────────────
        {
          label: {
            ru: "Вёрстка, возраст и объём",
            uk: "Верстка, вік і обсяг",
            en: "Layout, Age & Volume",
          },
          fields: [
            {
              name: "layouts",
              type: "array",
              label: {
                ru: "Режимы вёрстки PDF",
                uk: "Режими верстки PDF",
                en: "PDF Layout Modes",
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "code",
                      type: "select",
                      required: true,
                      defaultValue: "classic",
                      label: { ru: "Движок вёрстки", uk: "Рушій верстки", en: "Layout Engine" },
                      options: [
                        { label: { ru: "Классическая книга (classic)", uk: "Класична книга (classic)", en: "Classic" }, value: "classic" },
                        { label: { ru: "Панорамный разворот (panorama)", uk: "Панорамний розворот (panorama)", en: "Panorama" }, value: "panorama" },
                      ],
                      admin: { width: "40%" },
                    },
                    {
                      name: "enabled",
                      type: "checkbox",
                      defaultValue: true,
                      label: { ru: "Активен", uk: "Активний", en: "Enabled" },
                      admin: { width: "30%", style: { alignSelf: "flex-end" } },
                    },
                    {
                      name: "isDefault",
                      type: "checkbox",
                      defaultValue: false,
                      label: { ru: "По умолчанию", uk: "За замовчуванням", en: "Default" },
                      admin: { width: "30%", style: { alignSelf: "flex-end" } },
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "label",
                      type: "text",
                      localized: true,
                      required: true,
                      label: { ru: "Название", uk: "Назва", en: "Label" },
                      admin: { width: "50%" },
                    },
                    {
                      name: "badge",
                      type: "text",
                      localized: true,
                      label: { ru: "Бейдж (опц.)", uk: "Бейдж (опц.)", en: "Badge (opt.)" },
                      admin: { width: "50%" },
                    },
                  ],
                },
                {
                  name: "description",
                  type: "textarea",
                  localized: true,
                  required: true,
                  label: { ru: "Описание", uk: "Опис", en: "Description" },
                  admin: { rows: 2 },
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "previewImage",
                      type: "upload",
                      relationTo: "media",
                      label: { ru: "Превью (Медиа)", uk: "Прев'ю (Медіа)", en: "Preview Image" },
                      admin: { width: "50%" },
                    },
                    {
                      name: "fallbackImageUrl",
                      type: "text",
                      label: { ru: "Резервный путь к превью", uk: "Резервний шлях до прев'ю", en: "Fallback Preview URL" },
                      admin: { width: "50%", placeholder: "/samples/layout_classic.jpg" },
                    },
                  ],
                },
              ],
            },
            {
              name: "ageGroups",
              type: "array",
              label: {
                ru: "Возрастные группы",
                uk: "Вікові групи",
                en: "Age Groups",
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "code",
                      type: "text",
                      required: true,
                      label: { ru: "Код (напр. 2-3, 4-5, 6-8)", uk: "Код (напр. 2-3, 4-5, 6-8)", en: "Code" },
                      admin: { width: "34%" },
                    },
                    {
                      name: "wordRange",
                      type: "text",
                      required: true,
                      label: { ru: "Слов на страницу (для ИИ)", uk: "Слів на сторінку (для ШІ)", en: "Words per page" },
                      admin: { width: "26%", placeholder: "50–70" },
                    },
                    {
                      name: "enabled",
                      type: "checkbox",
                      defaultValue: true,
                      label: { ru: "Активна", uk: "Активна", en: "Enabled" },
                      admin: { width: "20%", style: { alignSelf: "flex-end" } },
                    },
                    {
                      name: "isDefault",
                      type: "checkbox",
                      defaultValue: false,
                      label: { ru: "По умолчанию", uk: "За замовчуванням", en: "Default" },
                      admin: { width: "20%", style: { alignSelf: "flex-end" } },
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "label",
                      type: "text",
                      localized: true,
                      required: true,
                      label: { ru: "Название (напр. Дошкольник)", uk: "Назва (напр. Дошкільня)", en: "Label" },
                      admin: { width: "50%" },
                    },
                    {
                      name: "hint",
                      type: "text",
                      localized: true,
                      label: { ru: "Подсказка (напр. Яркая история)", uk: "Підказка (напр. Яскрава історія)", en: "Hint" },
                      admin: { width: "50%" },
                    },
                  ],
                },
                {
                  name: "writerNote",
                  type: "text",
                  label: {
                    ru: "Доп. указание для писателя (опц., EN)",
                    uk: "Дод. вказівка для письменника (опц., EN)",
                    en: "Writer Note (opt., EN)",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "previewPagesCount",
                  type: "number",
                  required: true,
                  defaultValue: 2,
                  min: 1,
                  max: 4,
                  label: {
                    ru: "Бесплатных иллюстрированных страниц до оплаты",
                    uk: "Безкоштовних ілюстрованих сторінок до оплати",
                    en: "Free Preview Illustrated Pages",
                  },
                  admin: { width: "50%" },
                },
                {
                  name: "defaultPageCount",
                  type: "number",
                  required: true,
                  defaultValue: 6,
                  min: 4,
                  max: 16,
                  label: {
                    ru: "Объём страниц по умолчанию",
                    uk: "Обсяг сторінок за замовчуванням",
                    en: "Default Page Count",
                  },
                  admin: { width: "50%" },
                },
              ],
            },
            {
              name: "pageVolumes",
              type: "array",
              label: {
                ru: "Варианты объёма книги (цены задаются в Каталог → Услуги → kazka)",
                uk: "Варіанти обсягу книги (ціни задаються в Каталог → Послуги → kazka)",
                en: "Book Page Volumes",
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "pages",
                      type: "number",
                      required: true,
                      min: 4,
                      max: 16,
                      label: { ru: "Страниц", uk: "Сторінок", en: "Pages" },
                      admin: { width: "20%" },
                    },
                    {
                      name: "readingTimeLabel",
                      type: "text",
                      localized: true,
                      required: true,
                      label: { ru: "Подпись времени чтения", uk: "Підпис часу читання", en: "Reading Time Label" },
                      admin: { width: "44%", placeholder: "~5 мин (оптимум)" },
                    },
                    {
                      name: "enabled",
                      type: "checkbox",
                      defaultValue: true,
                      label: { ru: "Активен", uk: "Активний", en: "Enabled" },
                      admin: { width: "18%", style: { alignSelf: "flex-end" } },
                    },
                    {
                      name: "isDefault",
                      type: "checkbox",
                      defaultValue: false,
                      label: { ru: "По умолч.", uk: "За замовч.", en: "Default" },
                      admin: { width: "18%", style: { alignSelf: "flex-end" } },
                    },
                  ],
                },
              ],
            },
          ],
        },

        // ── Tab 2: Tones, Worlds, Plots, Presets ─────────────────────────────
        {
          label: {
            ru: "Настроения, миры и сюжеты",
            uk: "Настрої, світи й сюжети",
            en: "Tones, Worlds & Plots",
          },
          fields: [
            {
              name: "tones",
              type: "array",
              label: {
                ru: "Настроения / ритм чтения",
                uk: "Настрої / ритм читання",
                en: "Story Tones",
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "slug",
                      type: "text",
                      required: true,
                      label: { ru: "Код (slug)", uk: "Код (slug)", en: "Slug" },
                      admin: { width: "35%" },
                    },
                    {
                      name: "icon",
                      type: "text",
                      label: { ru: "Иконка", uk: "Іконка", en: "Icon" },
                      admin: {
                        width: "45%",
                        components: {
                          Field: "engine/components/admin/IconPickerField#IconPickerField",
                        },
                      },
                    },
                    {
                      name: "enabled",
                      type: "checkbox",
                      defaultValue: true,
                      label: { ru: "Активно", uk: "Активно", en: "Enabled" },
                      admin: { width: "20%", style: { alignSelf: "flex-end" } },
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "label",
                      type: "text",
                      localized: true,
                      required: true,
                      label: { ru: "Название", uk: "Назва", en: "Label" },
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
                  name: "promptHint",
                  type: "text",
                  label: {
                    ru: "Подсказка тона для писателя (опц.)",
                    uk: "Підказка тону для письменника (опц.)",
                    en: "Tone Prompt Hint (opt.)",
                  },
                },
              ],
            },
            {
              name: "settings",
              type: "array",
              label: {
                ru: "Миры / сеттинги",
                uk: "Світи / сеттинги",
                en: "Story Worlds",
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "slug",
                      type: "text",
                      required: true,
                      label: { ru: "Код (slug)", uk: "Код (slug)", en: "Slug" },
                      admin: { width: "35%" },
                    },
                    {
                      name: "icon",
                      type: "text",
                      label: { ru: "Иконка (если нет превью)", uk: "Іконка (якщо немає прев'ю)", en: "Icon" },
                      admin: {
                        width: "45%",
                        components: {
                          Field: "engine/components/admin/IconPickerField#IconPickerField",
                        },
                      },
                    },
                    {
                      name: "enabled",
                      type: "checkbox",
                      defaultValue: true,
                      label: { ru: "Активен", uk: "Активний", en: "Enabled" },
                      admin: { width: "20%", style: { alignSelf: "flex-end" } },
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
                      label: { ru: "Название мира", uk: "Назва світу", en: "World Title" },
                      admin: { width: "50%" },
                    },
                    {
                      name: "description",
                      type: "text",
                      localized: true,
                      required: true,
                      label: { ru: "Короткое описание на карточке", uk: "Короткий опис на картці", en: "Card Description" },
                      admin: { width: "50%" },
                    },
                  ],
                },
                {
                  name: "promptValue",
                  type: "textarea",
                  localized: true,
                  required: true,
                  label: {
                    ru: "Развёрнутое описание мира для ИИ-писателя",
                    uk: "Розгорнутий опис світу для ШІ-письменника",
                    en: "AI Prompt Description",
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
                        ru: "Картинка-превью мира (необязательно)",
                        uk: "Картинка-прев'ю світу (необов'язково)",
                        en: "World Preview Image (optional)",
                      },
                      admin: { width: "50%" },
                    },
                    {
                      name: "fallbackImageUrl",
                      type: "text",
                      label: {
                        ru: "Резервный URL картинки (опц.)",
                        uk: "Резервний URL картинки (опц.)",
                        en: "Fallback Image URL (opt.)",
                      },
                      admin: { width: "50%" },
                    },
                  ],
                },
              ],
            },
            {
              name: "plots",
              type: "array",
              label: {
                ru: "Сюжетные линии",
                uk: "Сюжетні лінії",
                en: "Plot Arcs",
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "slug",
                      type: "text",
                      required: true,
                      label: { ru: "Код (slug)", uk: "Код (slug)", en: "Slug" },
                      admin: { width: "35%" },
                    },
                    {
                      name: "icon",
                      type: "text",
                      label: { ru: "Иконка (если нет превью)", uk: "Іконка (якщо немає прев'ю)", en: "Icon" },
                      admin: {
                        width: "45%",
                        components: {
                          Field: "engine/components/admin/IconPickerField#IconPickerField",
                        },
                      },
                    },
                    {
                      name: "enabled",
                      type: "checkbox",
                      defaultValue: true,
                      label: { ru: "Активен", uk: "Активний", en: "Enabled" },
                      admin: { width: "20%", style: { alignSelf: "flex-end" } },
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
                      label: { ru: "Название сюжета", uk: "Назва сюжету", en: "Plot Title" },
                      admin: { width: "50%" },
                    },
                    {
                      name: "description",
                      type: "text",
                      localized: true,
                      required: true,
                      label: { ru: "Короткое описание на карточке", uk: "Короткий опис на картці", en: "Card Description" },
                      admin: { width: "50%" },
                    },
                  ],
                },
                {
                  name: "promptValue",
                  type: "textarea",
                  localized: true,
                  required: true,
                  label: {
                    ru: "Развёрнутая завязка для ИИ-писателя",
                    uk: "Розгорнута зав'язка для ШІ-письменника",
                    en: "AI Prompt Description",
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
                        ru: "Картинка-превью сюжета (необязательно)",
                        uk: "Картинка-прев'ю сюжету (необов'язково)",
                        en: "Plot Preview Image (optional)",
                      },
                      admin: { width: "50%" },
                    },
                    {
                      name: "fallbackImageUrl",
                      type: "text",
                      label: {
                        ru: "Резервный URL картинки (опц.)",
                        uk: "Резервний URL картинки (опц.)",
                        en: "Fallback Image URL (opt.)",
                      },
                      admin: { width: "50%" },
                    },
                  ],
                },
              ],
            },
            {
              name: "presets",
              type: "array",
              label: {
                ru: "Готовые комбинации («Случайная комбинация» и ?preset=slug)",
                uk: "Готові комбінації («Випадкова комбінація» і ?preset=slug)",
                en: "Quick Presets",
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "slug",
                      type: "text",
                      required: true,
                      label: { ru: "Слаг (для ?preset=)", uk: "Слаг (для ?preset=)", en: "Slug" },
                      admin: { width: "50%" },
                    },
                    {
                      name: "label",
                      type: "text",
                      localized: true,
                      label: { ru: "Название (опц.)", uk: "Назва (опц.)", en: "Label (opt.)" },
                      admin: { width: "50%" },
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "toneSlug",
                      type: "text",
                      required: true,
                      label: { ru: "Код настроения", uk: "Код настрою", en: "Tone Slug" },
                      admin: { width: "25%" },
                    },
                    {
                      name: "settingSlug",
                      type: "text",
                      required: true,
                      label: { ru: "Код мира", uk: "Код світу", en: "Setting Slug" },
                      admin: { width: "25%" },
                    },
                    {
                      name: "plotSlug",
                      type: "text",
                      required: true,
                      label: { ru: "Код сюжета", uk: "Код сюжету", en: "Plot Slug" },
                      admin: { width: "25%" },
                    },
                    {
                      name: "styleSlug",
                      type: "text",
                      label: { ru: "Код стиля (опц.)", uk: "Код стилю (опц.)", en: "Style Slug (opt.)" },
                      admin: { width: "25%" },
                    },
                  ],
                },
              ],
            },
          ],
        },

        // ── Tab 3: Hero Appearance & Companions ──────────────────────────────
        {
          label: {
            ru: "Герой и спутники",
            uk: "Герой і супутники",
            en: "Hero & Companions",
          },
          fields: [
            {
              name: "hairSwatches",
              type: "array",
              label: {
                ru: "Цвета волос (без фото)",
                uk: "Кольори волосся (без фото)",
                en: "Hair Swatches",
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "slug",
                      type: "text",
                      required: true,
                      label: { ru: "Код", uk: "Код", en: "Slug" },
                      admin: { width: "25%" },
                    },
                    {
                      name: "label",
                      type: "text",
                      localized: true,
                      required: true,
                      label: { ru: "Название", uk: "Назва", en: "Label" },
                      admin: { width: "25%" },
                    },
                    {
                      name: "promptEn",
                      type: "text",
                      label: { ru: "Для промпта (EN)", uk: "Для промпта (EN)", en: "Prompt (EN)" },
                      admin: { width: "25%" },
                    },
                    {
                      name: "color",
                      type: "text",
                      required: true,
                      defaultValue: "#8c5832",
                      label: { ru: "Цвет (HEX)", uk: "Колір (HEX)", en: "Color (HEX)" },
                      admin: {
                        width: "25%",
                        components: {
                          Field: "engine/components/admin/SiteColorPickerField#SiteColorPickerField",
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: "eyeSwatches",
              type: "array",
              label: {
                ru: "Цвета глаз (без фото)",
                uk: "Кольори очей (без фото)",
                en: "Eye Swatches",
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "slug",
                      type: "text",
                      required: true,
                      label: { ru: "Код", uk: "Код", en: "Slug" },
                      admin: { width: "25%" },
                    },
                    {
                      name: "label",
                      type: "text",
                      localized: true,
                      required: true,
                      label: { ru: "Название", uk: "Назва", en: "Label" },
                      admin: { width: "25%" },
                    },
                    {
                      name: "promptEn",
                      type: "text",
                      label: { ru: "Для промпта (EN)", uk: "Для промпта (EN)", en: "Prompt (EN)" },
                      admin: { width: "25%" },
                    },
                    {
                      name: "color",
                      type: "text",
                      required: true,
                      defaultValue: "#4f8fd6",
                      label: { ru: "Цвет (HEX)", uk: "Колір (HEX)", en: "Color (HEX)" },
                      admin: {
                        width: "25%",
                        components: {
                          Field: "engine/components/admin/SiteColorPickerField#SiteColorPickerField",
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: "petSpecies",
              type: "array",
              label: {
                ru: "Виды питомцев",
                uk: "Види улюбленців",
                en: "Pet Species",
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "slug",
                      type: "text",
                      required: true,
                      label: { ru: "Код", uk: "Код", en: "Slug" },
                      admin: { width: "25%" },
                    },
                    {
                      name: "label",
                      type: "text",
                      localized: true,
                      required: true,
                      label: { ru: "Название на сайте", uk: "Назва на сайті", en: "Label" },
                      admin: { width: "30%" },
                    },
                    {
                      name: "promptEn",
                      type: "text",
                      required: true,
                      label: { ru: "Вид для ИИ (EN)", uk: "Вид для ШІ (EN)", en: "Species (EN)" },
                      admin: { width: "25%", placeholder: "dog / cat / owl" },
                    },
                    {
                      name: "enabled",
                      type: "checkbox",
                      defaultValue: true,
                      label: { ru: "Активен", uk: "Активний", en: "Enabled" },
                      admin: { width: "20%", style: { alignSelf: "flex-end" } },
                    },
                  ],
                },
              ],
            },
            {
              name: "familyRelations",
              type: "array",
              label: {
                ru: "Члены семьи",
                uk: "Члени сім'ї",
                en: "Family Relations",
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "slug",
                      type: "text",
                      required: true,
                      label: { ru: "Код", uk: "Код", en: "Slug" },
                      admin: { width: "18%" },
                    },
                    {
                      name: "label",
                      type: "text",
                      localized: true,
                      required: true,
                      label: { ru: "Название", uk: "Назва", en: "Label" },
                      admin: { width: "24%" },
                    },
                    {
                      name: "promptEn",
                      type: "text",
                      required: true,
                      label: { ru: "Для ИИ (EN)", uk: "Для ШІ (EN)", en: "Relation (EN)" },
                      admin: { width: "22%", placeholder: "mother / father" },
                    },
                    {
                      name: "impliedGender",
                      type: "select",
                      required: true,
                      defaultValue: "female",
                      label: { ru: "Пол", uk: "Стать", en: "Implied Gender" },
                      options: [
                        { label: { ru: "Женский (скрыть выбор)", uk: "Жіночий (сховати вибір)", en: "Female" }, value: "female" },
                        { label: { ru: "Мужской (скрыть выбор)", uk: "Чоловічий (сховати вибір)", en: "Male" }, value: "male" },
                        { label: { ru: "Спросить на форме", uk: "Запитати на формі", en: "Ask on form" }, value: "ask" },
                      ],
                      admin: { width: "22%" },
                    },
                    {
                      name: "enabled",
                      type: "checkbox",
                      defaultValue: true,
                      label: { ru: "Вкл", uk: "Увімк", en: "On" },
                      admin: { width: "14%", style: { alignSelf: "flex-end" } },
                    },
                  ],
                },
              ],
            },
            {
              name: "toyPresets",
              type: "array",
              label: {
                ru: "Пресеты любимой игрушки / предмета (Шаг 5)",
                uk: "Пресети улюбленої іграшки / предмета (Крок 5)",
                en: "Favorite Toy Presets",
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: "engine/components/admin/FirstFieldRowLabel",
                },
              },
              fields: [
                {
                  name: "label",
                  type: "text",
                  localized: true,
                  required: true,
                  label: { ru: "Название предмета", uk: "Назва предмета", en: "Toy Label" },
                },
              ],
            },
          ],
        },

        // ── Tab 4: Pipeline System Prompts ───────────────────────────────────
        {
          label: {
            ru: "Промпты пайплайна",
            uk: "Промпти пайплайну",
            en: "Pipeline Prompts",
          },
          fields: [
            {
              name: "promptBeatsSystem",
              type: "textarea",
              label: {
                ru: "Шаг 1: Архитектор сюжета (Beats System)",
                uk: "Крок 1: Архітектор сюжету (Beats System)",
                en: "Step 1: Story Beats System Prompt",
              },
              admin: {
                rows: 4,
                description: {
                  ru: "Поддерживаемые переменные: {{langName}}. Суффикс strict JSON добавляется автоматически.",
                  uk: "Підтримувані змінні: {{langName}}. Суфікс strict JSON додається автоматично.",
                  en: "Variables: {{langName}}. Strict JSON suffix is appended automatically.",
                },
              },
            },
            {
              name: "promptDraftSystem",
              type: "textarea",
              label: {
                ru: "Шаг 2: Литературный писатель (Draft System)",
                uk: "Крок 2: Літературний письменник (Draft System)",
                en: "Step 2: Literary Writer System Prompt",
              },
              admin: {
                rows: 6,
                description: {
                  ru: "Переменные: {{langName}}, {{wordRange}}. Суффикс strict JSON добавляется автоматически.",
                  uk: "Змінні: {{langName}}, {{wordRange}}. Суфікс strict JSON додається автоматично.",
                  en: "Variables: {{langName}}, {{wordRange}}.",
                },
              },
            },
            {
              name: "promptProofreadSystem",
              type: "textarea",
              label: {
                ru: "Шаг 3: Корректор RU/UA (Proofreader System)",
                uk: "Крок 3: Коректор RU/UA (Proofreader System)",
                en: "Step 3: Proofreader System Prompt",
              },
              admin: {
                rows: 6,
                description: {
                  ru: "Переменные: {{langName}}, {{childName}}, {{childNameVocative}}, {{genderPronoun}}, {{companionSummary}}, {{wordRange}}.",
                  uk: "Змінні: {{langName}}, {{childName}}, {{childNameVocative}}, {{genderPronoun}}, {{companionSummary}}, {{wordRange}}.",
                  en: "Variables: {{langName}}, {{childName}}, {{childNameVocative}}, {{genderPronoun}}, {{companionSummary}}, {{wordRange}}.",
                },
              },
            },
            {
              name: "promptDirectorSystem",
              type: "textarea",
              label: {
                ru: "Шаг 4: Визуальный режиссёр (Visual Director System)",
                uk: "Крок 4: Візуальний режисер (Visual Director System)",
                en: "Step 4: Visual Director System Prompt",
              },
              admin: {
                rows: 10,
                description: {
                  ru: "Переменная: {{styleDesc}}. Суффикс strict JSON добавляется автоматически.",
                  uk: "Змінна: {{styleDesc}}. Суфікс strict JSON додається автоматично.",
                  en: "Variables: {{styleDesc}}.",
                },
              },
            },
            {
              name: "promptVisionQa",
              type: "textarea",
              label: {
                ru: "Шаг 5: Чеклист Vision QA иллюстраций",
                uk: "Крок 5: Чекліст Vision QA ілюстрацій",
                en: "Step 5: Vision QA Checklist",
              },
              admin: {
                rows: 6,
                description: {
                  ru: "Ожидаемое описание сцены и формат JSON-ответа добавляются кодом автоматически.",
                  uk: "Очікуваний опис сцени та формат JSON-відповіді додаються кодом автоматично.",
                  en: "Expected scene summary and JSON output schema are appended automatically.",
                },
              },
            },
          ],
        },

        // ── Tab 5: PDF & Decor (with automatic fallback to assets/decorations) ──
        {
          label: {
            ru: "PDF и декор",
            uk: "PDF і декор",
            en: "PDF & Decor",
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "pdfWatermarkText",
                  type: "text",
                  localized: true,
                  label: {
                    ru: "Текст водяного знака на превью PDF",
                    uk: "Текст водяного знака на прев'ю PDF",
                    en: "Preview PDF Watermark Text",
                  },
                  admin: {
                    width: "70%",
                    placeholder: "VIDEOVITANNYA • ЗРАЗОК • НЕ ДЛЯ ДРУКУ",
                  },
                },
                {
                  name: "pdfJpegQuality",
                  type: "number",
                  defaultValue: 92,
                  min: 70,
                  max: 98,
                  label: {
                    ru: "Качество JPEG в PDF (70–98)",
                    uk: "Якість JPEG у PDF (70–98)",
                    en: "PDF JPEG Quality (70–98)",
                  },
                  admin: { width: "30%" },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "decorCornerVignette",
                  type: "upload",
                  relationTo: "media",
                  label: {
                    ru: "Угловая виньетка страницы (PNG, опц.)",
                    uk: "Кутова віньєтка сторінки (PNG, опц.)",
                    en: "Page Corner Vignette (PNG, opt.)",
                  },
                  admin: {
                    width: "50%",
                    description: {
                      ru: "Если пусто — используется стандартный assets/decorations/corner_vignette.png",
                      uk: "Якщо порожньо — використовується стандартний assets/decorations/corner_vignette.png",
                      en: "Falls back to assets/decorations/corner_vignette.png.",
                    },
                  },
                },
                {
                  name: "decorChapterDivider",
                  type: "upload",
                  relationTo: "media",
                  label: {
                    ru: "Разделитель глав (PNG, опц.)",
                    uk: "Роздільник глав (PNG, опц.)",
                    en: "Chapter Divider (PNG, opt.)",
                  },
                  admin: {
                    width: "50%",
                    description: {
                      ru: "Если пусто — стандартный assets/decorations/chapter_divider.png",
                      uk: "Якщо порожньо — стандартний assets/decorations/chapter_divider.png",
                      en: "Falls back to assets/decorations/chapter_divider.png.",
                    },
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "decorDedicationWreath",
                  type: "upload",
                  relationTo: "media",
                  label: {
                    ru: "Венок страницы посвящения (PNG, опц.)",
                    uk: "Вінок сторінки присвяти (PNG, опц.)",
                    en: "Dedication Wreath (PNG, opt.)",
                  },
                  admin: {
                    width: "50%",
                    description: {
                      ru: "Если пусто — стандартный assets/decorations/dedication_wreath.png",
                      uk: "Якщо порожньо — стандартний assets/decorations/dedication_wreath.png",
                      en: "Falls back to assets/decorations/dedication_wreath.png.",
                    },
                  },
                },
                {
                  name: "decorCoverCorner",
                  type: "upload",
                  relationTo: "media",
                  label: {
                    ru: "Уголок обложки (PNG, зеркалится на 4 угла, опц.)",
                    uk: "Куточок обкладинки (PNG, дзеркалиться на 4 кути, опц.)",
                    en: "Cover Corner (PNG, mirrored x4, opt.)",
                  },
                  admin: {
                    width: "50%",
                    description: {
                      ru: "Если пусто — стандартный assets/decorations/cover_corner.png",
                      uk: "Якщо порожньо — стандартний assets/decorations/cover_corner.png",
                      en: "Falls back to assets/decorations/cover_corner.png.",
                    },
                  },
                },
              ],
            },
            {
              name: "decorCoverBackdrop",
              type: "upload",
              relationTo: "media",
              label: {
                ru: "Фон обложки (для квадратных артов, PNG, опц.)",
                uk: "Фон обкладинки (для квадратних артів, PNG, опц.)",
                en: "Cover Backdrop (for framed covers, PNG, opt.)",
              },
              admin: {
                description: {
                  ru: "Если пусто — стандартный assets/decorations/cover_backdrop.png",
                  uk: "Якщо порожньо — стандартний assets/decorations/cover_backdrop.png",
                  en: "Falls back to assets/decorations/cover_backdrop.png.",
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
