import type { Block } from "payload";

export const HeroBlock: Block = {
  slug: "hero",
  labels: {
    singular: { ru: "Главный экран (Hero)", uk: "Головний екран (Hero)", en: "Hero" },
    plural: { ru: "Hero блоки", uk: "Hero блоки", en: "Heroes" },
  },
  fields: [
    {
      name: "badge",
      type: "text",
      label: { ru: "Бейдж сверху", uk: "Бейдж зверху", en: "Top Badge" },
    },
    {
      name: "heading",
      type: "text",
      required: true,
      label: { ru: "Заголовок H1", uk: "Заголовок H1", en: "H1 Heading" },
    },
    {
      name: "subtitle",
      type: "textarea",
      label: { ru: "Подзаголовок", uk: "Підзаголовок", en: "Subtitle" },
    },
    {
      name: "showQuickPicker",
      type: "checkbox",
      defaultValue: true,
      label: {
        ru: "Показать быстрый выбор услуги и кнопки заказа",
        uk: "Показати швидкий вибір послуги та кнопки замовлення",
        en: "Show Quick Service Picker & CTAs",
      },
    },
  ],
};

export const LiveDemosBlock: Block = {
  slug: "live-demos",
  labels: {
    singular: { ru: "Живые примеры (Видео и PDF)", uk: "Живі приклади (Відео та PDF)", en: "Live Demos" },
    plural: { ru: "Живые примеры", uk: "Живі приклади", en: "Live Demos" },
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
          admin: { width: "40%" },
        },
        {
          name: "defaultTab",
          type: "select",
          defaultValue: "video",
          label: { ru: "Вкладка по умолчанию", uk: "Вкладка за замовчуванням", en: "Default Tab" },
          options: [
            { label: { ru: "Видео", uk: "Відео", en: "Video" }, value: "video" },
            { label: { ru: "Сказка PDF", uk: "Казка PDF", en: "Storybook PDF" }, value: "storybook" },
          ],
          admin: { width: "20%" },
        },
      ],
    },
  ],
};

export const ServicesCatalogBlock: Block = {
  slug: "services-catalog",
  labels: {
    singular: { ru: "Витрина услуг", uk: "Вітрина послуг", en: "Services Catalog" },
    plural: { ru: "Витрины услуг", uk: "Вітрини послуг", en: "Services Catalogs" },
  },
  fields: [
    {
      name: "heading",
      type: "text",
      label: { ru: "Заголовок", uk: "Заголовок", en: "Heading" },
    },
    {
      name: "subtitle",
      type: "textarea",
      label: { ru: "Подзаголовок", uk: "Підзаголовок", en: "Subtitle" },
    },
    {
      name: "showUpcoming",
      type: "checkbox",
      defaultValue: true,
      label: {
        ru: "Показывать плашку «Скоро запуск» для будущих услуг",
        uk: "Показувати плашку «Скоро запуск» для майбутніх послуг",
        en: "Show upcoming services strip",
      },
    },
  ],
};

export const PricingTableBlock: Block = {
  slug: "pricing-table",
  labels: {
    singular: { ru: "Таблица цен", uk: "Таблиця цін", en: "Pricing Table" },
    plural: { ru: "Таблицы цен", uk: "Таблиці цін", en: "Pricing Tables" },
  },
  fields: [
    {
      name: "includedHeading",
      type: "text",
      label: { ru: "Заголовок «Что входит в цену»", uk: "Заголовок «Що входить у ціну»", en: "What's Included Heading" },
    },
    {
      name: "includedSubtitle",
      type: "text",
      label: { ru: "Подзаголовок «Что входит»", uk: "Підзаголовок «Що входить»", en: "What's Included Subtitle" },
    },
    {
      name: "includedBullets",
      type: "array",
      label: { ru: "Пункты «Что входит»", uk: "Пункти «Що входить»", en: "Included Bullets" },
      labels: {
        singular: { ru: "Пункт", uk: "Пункт", en: "Bullet" },
        plural: { ru: "Пункты", uk: "Пункти", en: "Bullets" },
      },
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: "engine/components/admin/FirstFieldRowLabel",
        },
      },
      fields: [
        {
          name: "text",
          type: "text",
          required: true,
          label: { ru: "Текст", uk: "Текст", en: "Text" },
        },
      ],
    },
  ],
};

export const BlogGridBlock: Block = {
  slug: "blog-grid",
  labels: {
    singular: { ru: "Статьи блога", uk: "Статті блогу", en: "Blog Articles" },
    plural: { ru: "Блоки статей", uk: "Блоки статей", en: "Blog Grids" },
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
          name: "viewAllLabel",
          type: "text",
          label: { ru: "Текст ссылки «Все статьи»", uk: "Текст посилання «Усі статті»", en: "View All Label" },
          admin: { width: "30%" },
        },
        {
          name: "limit",
          type: "number",
          defaultValue: 3,
          min: 1,
          max: 12,
          label: { ru: "Количество", uk: "Кількість", en: "Limit" },
          admin: { width: "20%" },
        },
      ],
    },
  ],
};
