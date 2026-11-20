import type { Block } from "payload";

export const FAQBlock: Block = {
  slug: "faq",
  labels: {
    singular: { ru: "FAQ (Вопросы и ответы)", uk: "FAQ (Питання та відповіді)", en: "FAQ" },
    plural: { ru: "FAQ блоки", uk: "FAQ блоки", en: "FAQs" },
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "heading",
          type: "text",
          label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
          admin: { width: "55%" },
        },
        {
          name: "layout",
          type: "select",
          defaultValue: "accordion",
          label: { ru: "Отображение", uk: "Відображення", en: "Layout" },
          options: [
            { label: { ru: "Аккордеон", uk: "Акордеон", en: "Accordion" }, value: "accordion" },
            { label: { ru: "Все открыты", uk: "Усі відкриті", en: "All Open" }, value: "all-open" },
          ],
          admin: { width: "45%" },
        },
      ],
    },
    {
      name: "subtitle",
      type: "text",
      label: { ru: "Подзаголовок", uk: "Підзаголовок", en: "Subtitle" },
    },
    {
      name: "items",
      type: "array",
      label: { ru: "Вопросы и ответы", uk: "Питання та відповіді", en: "Questions & Answers" },
      labels: {
        singular: { ru: "Вопрос", uk: "Питання", en: "Question" },
        plural: { ru: "Вопросы", uk: "Питання", en: "Questions" },
      },
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: "engine/components/admin/FirstFieldRowLabel",
        },
      },
      fields: [
        {
          name: "question",
          type: "text",
          required: true,
          label: { ru: "Вопрос", uk: "Питання", en: "Question" },
        },
        {
          name: "answer",
          type: "textarea",
          required: true,
          label: { ru: "Ответ", uk: "Відповідь", en: "Answer" },
        },
      ],
    },
  ],
};

export const ReviewsBlock: Block = {
  slug: "reviews",
  labels: {
    singular: { ru: "Отзывы", uk: "Відгуки", en: "Reviews" },
    plural: { ru: "Блоки отзывов", uk: "Блоки відгуків", en: "Reviews Blocks" },
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "eyebrow",
          type: "text",
          label: { ru: "Надзаголовок", uk: "Надзаголовок", en: "Eyebrow" },
          admin: { width: "40%" },
        },
        {
          name: "heading",
          type: "text",
          label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
          admin: { width: "60%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "mode",
          type: "select",
          required: true,
          defaultValue: "all",
          label: { ru: "Какие отзывы выводить", uk: "Які відгуки виводити", en: "Selection Mode" },
          options: [
            { label: { ru: "Все отзывы", uk: "Усі відгуки", en: "All reviews" }, value: "all" },
            { label: { ru: "Выбрать конкретные", uk: "Обрати конкретні", en: "Selected reviews" }, value: "selected" },
          ],
          admin: { width: "50%" },
        },
        {
          name: "limit",
          type: "number",
          defaultValue: 4,
          min: 1,
          max: 24,
          label: { ru: "Максимум отзывов", uk: "Максимум відгуків", en: "Limit" },
          admin: {
            width: "50%",
            condition: (_, siblingData) => siblingData?.mode !== "selected",
          },
        },
      ],
    },
    {
      name: "selectedReviews",
      type: "relationship",
      relationTo: "reviews",
      hasMany: true,
      label: { ru: "Выбранные отзывы", uk: "Обрані відгуки", en: "Selected Reviews" },
      admin: {
        condition: (_, siblingData) => siblingData?.mode === "selected",
      },
    },
  ],
};

export const StepsBlock: Block = {
  slug: "steps",
  labels: {
    singular: { ru: "Шаги (Как это работает)", uk: "Кроки (Як це працює)", en: "Steps" },
    plural: { ru: "Блоки шагов", uk: "Блоки кроків", en: "Steps Blocks" },
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "heading",
          type: "text",
          label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
          admin: { width: "65%" },
        },
        {
          name: "columns",
          type: "select",
          defaultValue: "4",
          label: { ru: "Колонок", uk: "Колонок", en: "Columns" },
          options: [
            { label: "3", value: "3" },
            { label: "4", value: "4" },
          ],
          admin: { width: "35%" },
        },
      ],
    },
    {
      name: "steps",
      type: "array",
      label: { ru: "Шаги", uk: "Кроки", en: "Steps" },
      labels: {
        singular: { ru: "Шаг", uk: "Крок", en: "Step" },
        plural: { ru: "Шаги", uk: "Кроки", en: "Steps" },
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
          label: { ru: "Заголовок шага", uk: "Заголовок кроку", en: "Step Title" },
        },
        {
          name: "description",
          type: "textarea",
          required: true,
          label: { ru: "Описание", uk: "Опис", en: "Description" },
        },
      ],
    },
  ],
};

export const TextBlock: Block = {
  slug: "text",
  labels: {
    singular: { ru: "Текстовый блок", uk: "Текстовий блок", en: "Text Block" },
    plural: { ru: "Текстовые блоки", uk: "Текстові блоки", en: "Text Blocks" },
  },
  fields: [
    {
      name: "heading",
      type: "text",
      label: { ru: "Заголовок (опц.)", uk: "Заголовок (опц.)", en: "Heading (opt.)" },
    },
    {
      name: "content",
      type: "richText",
      label: { ru: "Текст", uk: "Текст", en: "Content" },
    },
    {
      name: "showCookieSettingsButton",
      type: "checkbox",
      defaultValue: false,
      label: {
        ru: "Показать кнопку «Настройки cookies»",
        uk: "Показати кнопку «Налаштування cookies»",
        en: "Show Cookie Settings Button",
      },
    },
  ],
};

export const PrivacyTrustBlock: Block = {
  slug: "privacy-trust",
  labels: {
    singular: { ru: "Гарантия приватности", uk: "Гарантія приватності", en: "Privacy Trust Strip" },
    plural: { ru: "Полосы приватности", uk: "Смуги приватності", en: "Privacy Strips" },
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      label: { ru: "Заголовок", uk: "Заголовок", en: "Title" },
    },
    {
      name: "text",
      type: "textarea",
      required: true,
      label: { ru: "Текст", uk: "Текст", en: "Text" },
    },
    {
      name: "href",
      type: "text",
      defaultValue: "/konfidentsiynist",
      label: { ru: "Ссылка", uk: "Посилання", en: "Link URL" },
    },
  ],
};

export const CTABlock: Block = {
  slug: "cta",
  labels: {
    singular: { ru: "Призыв к действию (CTA)", uk: "Заклик до дії (CTA)", en: "CTA Banner" },
    plural: { ru: "CTA блоки", uk: "CTA блоки", en: "CTA Banners" },
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
    },
    {
      name: "subtitle",
      type: "textarea",
      label: { ru: "Описание", uk: "Опис", en: "Subtitle" },
    },
    {
      type: "row",
      fields: [
        {
          name: "buttonLabel",
          type: "text",
          required: true,
          label: { ru: "Текст кнопки", uk: "Текст кнопки", en: "Button Label" },
          admin: { width: "50%" },
        },
        {
          name: "buttonHref",
          type: "text",
          required: true,
          defaultValue: "#gifts",
          label: { ru: "Ссылка кнопки", uk: "Посилання кнопки", en: "Button URL" },
          admin: { width: "50%" },
        },
      ],
    },
  ],
};

export const SpacerBlock: Block = {
  slug: "spacer",
  labels: {
    singular: { ru: "Отступ", uk: "Відступ", en: "Spacer" },
    plural: { ru: "Отступы", uk: "Відступи", en: "Spacers" },
  },
  fields: [
    {
      name: "size",
      type: "select",
      defaultValue: "md",
      label: { ru: "Размер отступа", uk: "Розмір відступу", en: "Size" },
      options: [
        { label: { ru: "Маленький (16px)", uk: "Малий (16px)", en: "Small (16px)" }, value: "sm" },
        { label: { ru: "Средний (32px)", uk: "Середній (32px)", en: "Medium (32px)" }, value: "md" },
        { label: { ru: "Большой (56px)", uk: "Великий (56px)", en: "Large (56px)" }, value: "lg" },
      ],
    },
  ],
};
