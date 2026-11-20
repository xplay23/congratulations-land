import type { Block, Field } from "payload";
import { makeSpacingField } from "../lib/blocks/spacing";

/**
 * Generic (non-domaining) builder blocks ported & adapted from domainer-platform:
 * Banner, Features, IconList, Logos, Stats, TextImage, Video, Manifesto,
 * Pricing cards, Payment methods.
 */

const rowLabel = {
  RowLabel: "engine/components/admin/FirstFieldRowLabel",
};

const iconFields: Field[] = [
  {
    name: "icon",
    type: "text",
    label: { ru: "Иконка", uk: "Іконка", en: "Icon" },
    admin: {
      components: {
        Field: "engine/components/admin/IconPickerField#IconPickerField",
      },
    },
  },
  {
    name: "iconColor",
    type: "text",
    label: { ru: "Цвет иконки", uk: "Колір іконки", en: "Icon Color" },
    admin: {
      condition: (_, siblingData) => Boolean(siblingData?.icon),
      components: {
        Field: "engine/components/admin/IconColorField#IconColorField",
      },
    },
  },
];

const ctaButtonGroup: Field = {
  name: "ctaButton",
  type: "group",
  label: { ru: "Кнопка", uk: "Кнопка", en: "CTA Button" },
  fields: [
    {
      name: "enabled",
      type: "checkbox",
      defaultValue: false,
      label: { ru: "Показать кнопку", uk: "Показати кнопку", en: "Show button" },
    },
    {
      type: "row",
      fields: [
        {
          name: "label",
          type: "text",
          label: { ru: "Текст кнопки", uk: "Текст кнопки", en: "Label" },
          admin: { width: "50%", condition: (_, s) => Boolean(s?.enabled) },
        },
        {
          name: "url",
          type: "text",
          label: { ru: "Ссылка", uk: "Посилання", en: "URL" },
          admin: { width: "50%", condition: (_, s) => Boolean(s?.enabled) },
        },
      ],
    },
  ],
};

export const BannerBlock: Block = {
  slug: "banner",
  labels: {
    singular: { ru: "Баннер-объявление", uk: "Банер-оголошення", en: "Banner" },
    plural: { ru: "Баннеры", uk: "Банери", en: "Banners" },
  },
  fields: [
    {
      name: "content",
      type: "text",
      required: true,
      label: { ru: "Текст баннера", uk: "Текст банера", en: "Content" },
    },
    {
      name: "style",
      type: "select",
      defaultValue: "promo",
      dbName: "bn_style",
      label: { ru: "Стиль", uk: "Стиль", en: "Style" },
      options: [
        { label: { ru: "Информация", uk: "Інформація", en: "Info" }, value: "info" },
        { label: { ru: "Успех", uk: "Успіх", en: "Success" }, value: "success" },
        { label: { ru: "Внимание", uk: "Увага", en: "Warning" }, value: "warning" },
        { label: { ru: "Промо", uk: "Промо", en: "Promo" }, value: "promo" },
      ],
    },
    ctaButtonGroup,
    {
      name: "dismissible",
      type: "checkbox",
      defaultValue: false,
      label: {
        ru: "Можно закрыть (запоминается в браузере)",
        uk: "Можна закрити (запам'ятовується в браузері)",
        en: "Dismissible",
      },
    },
    makeSpacingField("bn"),
  ],
};

export const FeaturesBlock: Block = {
  slug: "features",
  labels: {
    singular: { ru: "Преимущества / Фичи", uk: "Переваги / Фічі", en: "Features" },
    plural: { ru: "Блоки преимуществ", uk: "Блоки переваг", en: "Features" },
  },
  fields: [
    {
      name: "heading",
      type: "text",
      label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
    },
    {
      type: "row",
      fields: [
        {
          name: "style",
          type: "select",
          defaultValue: "cards",
          dbName: "ft_style",
          label: { ru: "Стиль", uk: "Стиль", en: "Style" },
          options: [
            { label: { ru: "Карточки", uk: "Картки", en: "Cards" }, value: "cards" },
            { label: { ru: "Список", uk: "Список", en: "List" }, value: "list" },
            { label: { ru: "Только иконки", uk: "Тільки іконки", en: "Icons only" }, value: "icons-only" },
          ],
          admin: { width: "40%" },
        },
        {
          name: "columns",
          type: "select",
          defaultValue: "3",
          dbName: "ft_cols",
          label: { ru: "Колонок в ряду", uk: "Колонок у ряду", en: "Columns" },
          options: [
            { label: "2", value: "2" },
            { label: "3", value: "3" },
            { label: "4", value: "4" },
          ],
          admin: {
            width: "30%",
            condition: (_, s) => s?.style !== "list",
          },
        },
        {
          name: "useBackground",
          type: "checkbox",
          defaultValue: true,
          label: { ru: "Фон карточек", uk: "Фон карток", en: "Card background" },
          admin: {
            width: "30%",
            style: { alignSelf: "flex-end" },
            condition: (_, s) => s?.style !== "list",
          },
        },
      ],
    },
    {
      name: "items",
      type: "array",
      label: { ru: "Пункты", uk: "Пункти", en: "Items" },
      labels: {
        singular: { ru: "Пункт", uk: "Пункт", en: "Item" },
        plural: { ru: "Пункты", uk: "Пункти", en: "Items" },
      },
      admin: { initCollapsed: true, components: rowLabel },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          label: { ru: "Заголовок", uk: "Заголовок", en: "Title" },
        },
        {
          name: "description",
          type: "textarea",
          label: { ru: "Описание", uk: "Опис", en: "Description" },
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          label: {
            ru: "Картинка (вместо иконки)",
            uk: "Картинка (замість іконки)",
            en: "Image (instead of icon)",
          },
        },
        ...iconFields,
      ],
    },
    makeSpacingField("ft"),
  ],
};

export const IconListBlock: Block = {
  slug: "icon-list",
  labels: {
    singular: { ru: "Список с иконками", uk: "Список з іконками", en: "Icon List" },
    plural: { ru: "Списки с иконками", uk: "Списки з іконками", en: "Icon Lists" },
  },
  fields: [
    {
      name: "heading",
      type: "text",
      label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
    },
    {
      type: "row",
      fields: [
        {
          name: "columns",
          type: "select",
          defaultValue: "1",
          dbName: "il_cols",
          label: { ru: "Колонок", uk: "Колонок", en: "Columns" },
          options: [
            { label: "1", value: "1" },
            { label: "2", value: "2" },
          ],
          admin: { width: "50%" },
        },
        {
          name: "useBackground",
          type: "checkbox",
          defaultValue: false,
          label: { ru: "Фон-карточка", uk: "Фон-картка", en: "Card background" },
          admin: { width: "50%", style: { alignSelf: "flex-end" } },
        },
      ],
    },
    {
      name: "items",
      type: "array",
      label: { ru: "Пункты списка", uk: "Пункти списку", en: "Items" },
      labels: {
        singular: { ru: "Пункт", uk: "Пункт", en: "Item" },
        plural: { ru: "Пункты", uk: "Пункти", en: "Items" },
      },
      admin: { initCollapsed: true, components: rowLabel },
      fields: [
        {
          name: "text",
          type: "text",
          required: true,
          label: { ru: "Текст", uk: "Текст", en: "Text" },
        },
        ...iconFields,
      ],
    },
    makeSpacingField("il"),
  ],
};

export const LogosBlock: Block = {
  slug: "logos",
  labels: {
    singular: { ru: "Логотипы партнёров", uk: "Логотипи партнерів", en: "Logos" },
    plural: { ru: "Блоки логотипов", uk: "Блоки логотипів", en: "Logos" },
  },
  fields: [
    {
      name: "heading",
      type: "text",
      label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
    },
    {
      name: "grayscale",
      type: "checkbox",
      defaultValue: true,
      label: {
        ru: "Чёрно-белые (цвет при наведении)",
        uk: "Чорно-білі (колір при наведенні)",
        en: "Grayscale",
      },
    },
    {
      name: "items",
      type: "array",
      label: { ru: "Логотипы", uk: "Логотипи", en: "Logos" },
      labels: {
        singular: { ru: "Логотип", uk: "Логотип", en: "Logo" },
        plural: { ru: "Логотипы", uk: "Логотипи", en: "Logos" },
      },
      admin: { initCollapsed: true, components: rowLabel },
      fields: [
        {
          name: "label",
          type: "text",
          label: { ru: "Название", uk: "Назва", en: "Label" },
        },
        {
          name: "logo",
          type: "upload",
          relationTo: "media",
          required: true,
          label: { ru: "Логотип", uk: "Логотип", en: "Logo" },
        },
        {
          name: "url",
          type: "text",
          label: { ru: "Ссылка (опц.)", uk: "Посилання (опц.)", en: "URL (opt.)" },
        },
      ],
    },
    makeSpacingField("lg"),
  ],
};

export const StatsBlock: Block = {
  slug: "stats",
  labels: {
    singular: { ru: "Цифры и факты", uk: "Цифри та факти", en: "Stats" },
    plural: { ru: "Блоки цифр", uk: "Блоки цифр", en: "Stats" },
  },
  fields: [
    {
      name: "heading",
      type: "text",
      label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
    },
    {
      name: "items",
      type: "array",
      label: { ru: "Показатели", uk: "Показники", en: "Stats" },
      labels: {
        singular: { ru: "Показатель", uk: "Показник", en: "Stat" },
        plural: { ru: "Показатели", uk: "Показники", en: "Stats" },
      },
      admin: { initCollapsed: true, components: rowLabel },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "value",
              type: "text",
              required: true,
              label: { ru: "Значение", uk: "Значення", en: "Value" },
              admin: { width: "30%", placeholder: "47 с / 30 днів / 6" },
            },
            {
              name: "label",
              type: "text",
              required: true,
              label: { ru: "Подпись", uk: "Підпис", en: "Label" },
              admin: { width: "70%" },
            },
          ],
        },
        {
          name: "description",
          type: "text",
          label: { ru: "Пояснение (опц.)", uk: "Пояснення (опц.)", en: "Description" },
        },
      ],
    },
    makeSpacingField("st"),
  ],
};

export const TextImageBlock: Block = {
  slug: "text-image",
  labels: {
    singular: { ru: "Текст + картинка", uk: "Текст + картинка", en: "Text + Image" },
    plural: { ru: "Текст + картинка", uk: "Текст + картинка", en: "Text + Image" },
  },
  fields: [
    {
      name: "heading",
      type: "text",
      label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
    },
    {
      name: "content",
      type: "richText",
      required: true,
      label: { ru: "Текст", uk: "Текст", en: "Content" },
    },
    {
      type: "row",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
          label: { ru: "Картинка", uk: "Картинка", en: "Image" },
          admin: { width: "60%" },
        },
        {
          name: "imagePosition",
          type: "select",
          defaultValue: "right",
          dbName: "ti_pos",
          label: { ru: "Положение картинки", uk: "Положення картинки", en: "Image position" },
          options: [
            { label: { ru: "Слева", uk: "Ліворуч", en: "Left" }, value: "left" },
            { label: { ru: "Справа", uk: "Праворуч", en: "Right" }, value: "right" },
          ],
          admin: { width: "40%" },
        },
      ],
    },
    ctaButtonGroup,
    makeSpacingField("ti"),
  ],
};

export const VideoBlock: Block = {
  slug: "video",
  labels: {
    singular: { ru: "Видео", uk: "Відео", en: "Video" },
    plural: { ru: "Видео", uk: "Відео", en: "Videos" },
  },
  fields: [
    {
      name: "heading",
      type: "text",
      label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
    },
    {
      type: "row",
      fields: [
        {
          name: "source",
          type: "select",
          defaultValue: "youtube",
          dbName: "vd_src",
          label: { ru: "Источник", uk: "Джерело", en: "Source" },
          options: [
            { label: "YouTube", value: "youtube" },
            { label: "Vimeo", value: "vimeo" },
            { label: { ru: "Загрузить файл", uk: "Завантажити файл", en: "Upload" }, value: "upload" },
          ],
          admin: { width: "50%" },
        },
        {
          name: "aspectRatio",
          type: "select",
          defaultValue: "16:9",
          dbName: "vd_ar",
          label: { ru: "Пропорции", uk: "Пропорції", en: "Aspect ratio" },
          options: [
            { label: "16:9", value: "16:9" },
            { label: "4:3", value: "4:3" },
            { label: "1:1", value: "1:1" },
          ],
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "url",
      type: "text",
      label: { ru: "Ссылка или ID видео", uk: "Посилання або ID відео", en: "URL or video ID" },
      admin: {
        condition: (_, s) => s?.source === "youtube" || s?.source === "vimeo",
      },
    },
    {
      name: "file",
      type: "upload",
      relationTo: "media",
      label: { ru: "Видеофайл", uk: "Відеофайл", en: "Video file" },
      admin: { condition: (_, s) => s?.source === "upload" },
    },
    {
      type: "row",
      fields: [
        {
          name: "caption",
          type: "text",
          label: { ru: "Подпись", uk: "Підпис", en: "Caption" },
          admin: { width: "70%" },
        },
        {
          name: "autoplay",
          type: "checkbox",
          defaultValue: false,
          label: { ru: "Автозапуск (без звука)", uk: "Автозапуск (без звуку)", en: "Autoplay" },
          admin: { width: "30%", style: { alignSelf: "flex-end" } },
        },
      ],
    },
    makeSpacingField("vd"),
  ],
};

export const ManifestoBlock: Block = {
  slug: "manifesto",
  labels: {
    singular: { ru: "Манифест / Акцентный текст", uk: "Маніфест / Акцентний текст", en: "Manifesto" },
    plural: { ru: "Манифесты", uk: "Маніфести", en: "Manifestos" },
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
    },
    {
      name: "content",
      type: "richText",
      required: true,
      label: { ru: "Текст", uk: "Текст", en: "Content" },
    },
    {
      type: "row",
      fields: [
        {
          name: "background",
          type: "select",
          defaultValue: "dark",
          dbName: "mf_bg",
          label: { ru: "Фон", uk: "Фон", en: "Background" },
          options: [
            { label: { ru: "Обычный", uk: "Звичайний", en: "Default" }, value: "default" },
            { label: { ru: "Тёмный", uk: "Темний", en: "Dark" }, value: "dark" },
            { label: { ru: "Акцентный (золото)", uk: "Акцентний (золото)", en: "Accent" }, value: "primary" },
          ],
          admin: { width: "50%" },
        },
        {
          name: "alignment",
          type: "select",
          defaultValue: "left",
          dbName: "mf_al",
          label: { ru: "Выравнивание", uk: "Вирівнювання", en: "Alignment" },
          options: [
            { label: { ru: "Слева", uk: "Ліворуч", en: "Left" }, value: "left" },
            { label: { ru: "По центру", uk: "По центру", en: "Center" }, value: "center" },
          ],
          admin: { width: "50%" },
        },
      ],
    },
    makeSpacingField("mf"),
  ],
};

export const PricingCardsBlock: Block = {
  slug: "pricing-cards",
  labels: {
    singular: { ru: "Тарифные карточки", uk: "Тарифні картки", en: "Pricing Cards" },
    plural: { ru: "Тарифные карточки", uk: "Тарифні картки", en: "Pricing Cards" },
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "heading",
          type: "text",
          label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
          admin: { width: "50%" },
        },
        {
          name: "subheading",
          type: "text",
          label: { ru: "Подзаголовок", uk: "Підзаголовок", en: "Subheading" },
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "items",
      type: "array",
      label: { ru: "Тарифы", uk: "Тарифи", en: "Plans" },
      labels: {
        singular: { ru: "Тариф", uk: "Тариф", en: "Plan" },
        plural: { ru: "Тарифы", uk: "Тарифи", en: "Plans" },
      },
      admin: { initCollapsed: true, components: { RowLabel: "engine/components/admin/FirstFieldRowLabel" } },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "name",
              type: "text",
              required: true,
              label: { ru: "Название", uk: "Назва", en: "Name" },
              admin: { width: "40%" },
            },
            {
              name: "price",
              type: "text",
              required: true,
              label: { ru: "Цена", uk: "Ціна", en: "Price" },
              admin: { width: "30%", placeholder: "199 ₴" },
            },
            {
              name: "period",
              type: "text",
              label: { ru: "Период / пояснение", uk: "Період / пояснення", en: "Period" },
              admin: { width: "30%", placeholder: "разово" },
            },
          ],
        },
        {
          name: "description",
          type: "text",
          label: { ru: "Описание", uk: "Опис", en: "Description" },
        },
        {
          name: "features",
          type: "array",
          label: { ru: "Что входит", uk: "Що входить", en: "Features" },
          admin: { initCollapsed: true, components: { RowLabel: "engine/components/admin/FirstFieldRowLabel" } },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "text",
                  type: "text",
                  required: true,
                  label: { ru: "Текст", uk: "Текст", en: "Text" },
                  admin: { width: "80%" },
                },
                {
                  name: "included",
                  type: "checkbox",
                  defaultValue: true,
                  label: { ru: "Включено", uk: "Включено", en: "Included" },
                  admin: { width: "20%", style: { alignSelf: "flex-end" } },
                },
              ],
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "ctaLabel",
              type: "text",
              required: true,
              label: { ru: "Текст кнопки", uk: "Текст кнопки", en: "CTA label" },
              admin: { width: "35%" },
            },
            {
              name: "ctaUrl",
              type: "text",
              required: true,
              label: { ru: "Ссылка кнопки", uk: "Посилання кнопки", en: "CTA URL" },
              admin: { width: "40%" },
            },
            {
              name: "highlighted",
              type: "checkbox",
              defaultValue: false,
              label: { ru: "Выделить («Хит»)", uk: "Виділити («Хіт»)", en: "Highlight" },
              admin: { width: "25%", style: { alignSelf: "flex-end" } },
            },
          ],
        },
      ],
    },
    makeSpacingField("pc"),
  ],
};

export const PAYMENT_METHODS = [
  { value: "plata-by-mono", label: "Plata by mono" },
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "apple-pay", label: "Apple Pay" },
  { value: "google-pay", label: "Google Pay" },
  { value: "monobank", label: "monobank" },
  { value: "privat24", label: "Privat24" },
  { value: "custom", label: "— Свой вариант —" },
] as const;

export const PaymentLogosBlock: Block = {
  slug: "payment-logos",
  labels: {
    singular: { ru: "Способы оплаты", uk: "Способи оплати", en: "Payment Methods" },
    plural: { ru: "Способы оплаты", uk: "Способи оплати", en: "Payment Methods" },
  },
  fields: [
    {
      name: "heading",
      type: "text",
      label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
    },
    {
      name: "align",
      type: "select",
      defaultValue: "left",
      dbName: "pl_al",
      label: { ru: "Выравнивание", uk: "Вирівнювання", en: "Align" },
      options: [
        { label: { ru: "Слева", uk: "Ліворуч", en: "Left" }, value: "left" },
        { label: { ru: "По центру", uk: "По центру", en: "Center" }, value: "center" },
        { label: { ru: "Справа", uk: "Праворуч", en: "Right" }, value: "right" },
      ],
    },
    {
      name: "items",
      type: "array",
      label: { ru: "Способы оплаты", uk: "Способи оплати", en: "Methods" },
      labels: {
        singular: { ru: "Способ", uk: "Спосіб", en: "Method" },
        plural: { ru: "Способы", uk: "Способи", en: "Methods" },
      },
      admin: { initCollapsed: true, components: rowLabel },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "preset",
              type: "select",
              required: true,
              defaultValue: "plata-by-mono",
              dbName: "pl_preset",
              label: { ru: "Способ оплаты", uk: "Спосіб оплати", en: "Method" },
              options: PAYMENT_METHODS.map((m) => ({ label: m.label, value: m.value })),
              admin: { width: "45%" },
            },
            {
              name: "label",
              type: "text",
              label: { ru: "Название (для «Свой вариант»)", uk: "Назва (для «Свій варіант»)", en: "Label (custom)" },
              admin: { width: "55%" },
            },
          ],
        },
      ],
    },
    makeSpacingField("pl"),
  ],
};
