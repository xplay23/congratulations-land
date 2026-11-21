import type { Block } from "payload";

export const GenderFieldBlock: Block = {
  slug: "genderField",
  labels: {
    singular: { ru: "Выбор пола ребёнка", uk: "Вибір статі дитини", en: "Gender Field" },
    plural: { ru: "Выбор пола ребёнка", uk: "Вибір статі дитини", en: "Gender Fields" },
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "fieldKey",
          type: "text",
          required: true,
          defaultValue: "gender",
          label: { ru: "Ключ переменной", uk: "Ключ змінної", en: "Field Key" },
          admin: { width: "40%" },
        },
        {
          name: "label",
          type: "text",
          localized: true,
          required: true,
          defaultValue: "Стать дитини",
          label: { ru: "Заголовок поля", uk: "Заголовок поля", en: "Field Label" },
          admin: { width: "40%" },
        },
        {
          name: "required",
          type: "checkbox",
          defaultValue: true,
          label: { ru: "Обязательно", uk: "Обов'язково", en: "Required" },
          admin: { width: "20%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "boyLabel",
          type: "text",
          localized: true,
          defaultValue: "Хлопчик",
          label: { ru: "Метка (мальчик)", uk: "Мітка (хлопчик)", en: "Boy Label" },
          admin: { width: "25%" },
        },
        {
          name: "boyHint",
          type: "text",
          localized: true,
          defaultValue: "він • молодчина",
          label: { ru: "Подсказка (мальчик)", uk: "Підказка (хлопчик)", en: "Boy Hint" },
          admin: { width: "25%" },
        },
        {
          name: "girlLabel",
          type: "text",
          localized: true,
          defaultValue: "Дівчинка",
          label: { ru: "Метка (девочка)", uk: "Мітка (дівчинка)", en: "Girl Label" },
          admin: { width: "25%" },
        },
        {
          name: "girlHint",
          type: "text",
          localized: true,
          defaultValue: "вона • розумниця",
          label: { ru: "Подсказка (девочка)", uk: "Підказка (дівчинка)", en: "Girl Hint" },
          admin: { width: "25%" },
        },
      ],
    },
  ],
};

export const TextFieldBlock: Block = {
  slug: "textField",
  labels: {
    singular: { ru: "Текстовое поле (Имя / Текст)", uk: "Текстове поле (Ім'я / Текст)", en: "Text Field" },
    plural: { ru: "Текстовые поля", uk: "Текстові поля", en: "Text Fields" },
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "fieldKey",
          type: "text",
          required: true,
          defaultValue: "childName",
          label: { ru: "Ключ переменной", uk: "Ключ змінної", en: "Field Key" },
          admin: { width: "35%" },
        },
        {
          name: "label",
          type: "text",
          localized: true,
          required: true,
          label: { ru: "Заголовок поля", uk: "Заголовок поля", en: "Field Label" },
          admin: { width: "45%" },
        },
        {
          name: "required",
          type: "checkbox",
          defaultValue: true,
          label: { ru: "Обязательно", uk: "Обов'язково", en: "Required" },
          admin: { width: "20%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "placeholder",
          type: "text",
          localized: true,
          label: { ru: "Плейсхолдер", uk: "Плейсхолдер", en: "Placeholder" },
          admin: { width: "40%" },
        },
        {
          name: "minLength",
          type: "number",
          defaultValue: 2,
          min: 0,
          max: 300,
          label: { ru: "Мин. символов", uk: "Мін. символів", en: "Min Length" },
          admin: { width: "20%" },
        },
        {
          name: "maxLength",
          type: "number",
          defaultValue: 15,
          min: 1,
          max: 300,
          label: { ru: "Макс. символов", uk: "Макс. символів", en: "Max Length" },
          admin: { width: "20%" },
        },
        {
          name: "width",
          type: "select",
          defaultValue: "half",
          label: { ru: "Ширина", uk: "Ширина", en: "Width" },
          options: [
            { label: { ru: "Половина", uk: "Половина", en: "Half" }, value: "half" },
            { label: { ru: "На всю ширину", uk: "На всю ширину", en: "Full" }, value: "full" },
          ],
          admin: { width: "20%" },
        },
      ],
    },
    {
      name: "enableVocative",
      type: "checkbox",
      defaultValue: false,
      label: {
        ru: "Добавить парное поле «Звательный падеж / обращение в речи»",
        uk: "Додати парне поле «Кличний відмінок / звернення в мові»",
        en: "Add paired vocative / spoken form input",
      },
    },
    {
      type: "row",
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enableVocative),
      },
      fields: [
        {
          name: "vocativeFieldKey",
          type: "text",
          defaultValue: "childNameVocative",
          label: { ru: "Ключ обращения", uk: "Ключ звернення", en: "Vocative Key" },
          admin: { width: "25%" },
        },
        {
          name: "vocativeLabel",
          type: "text",
          localized: true,
          label: { ru: "Заголовок обращения", uk: "Заголовок звернення", en: "Vocative Label" },
          admin: { width: "35%" },
        },
        {
          name: "vocativePlaceholder",
          type: "text",
          localized: true,
          label: { ru: "Плейсхолдер обращения", uk: "Плейсхолдер звернення", en: "Vocative Placeholder" },
          admin: { width: "25%" },
        },
        {
          name: "vocativeMaxLength",
          type: "number",
          defaultValue: 17,
          min: 2,
          max: 50,
          label: { ru: "Макс.", uk: "Макс.", en: "Max" },
          admin: { width: "15%" },
        },
      ],
    },
  ],
};

export const AgeStepperFieldBlock: Block = {
  slug: "ageStepperField",
  labels: {
    singular: { ru: "Возраст (степпер)", uk: "Вік (степпер)", en: "Age Stepper" },
    plural: { ru: "Возраст (степпер)", uk: "Вік (степпер)", en: "Age Steppers" },
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "fieldKey",
          type: "text",
          required: true,
          defaultValue: "age",
          label: { ru: "Ключ переменной", uk: "Ключ змінної", en: "Field Key" },
          admin: { width: "35%" },
        },
        {
          name: "label",
          type: "text",
          localized: true,
          required: true,
          defaultValue: "Вік дитини",
          label: { ru: "Заголовок", uk: "Заголовок", en: "Label" },
          admin: { width: "65%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "minAge",
          type: "number",
          defaultValue: 1,
          min: 1,
          max: 99,
          label: { ru: "Мин.", uk: "Мін.", en: "Min" },
          admin: { width: "20%" },
        },
        {
          name: "maxAge",
          type: "number",
          defaultValue: 14,
          min: 1,
          max: 99,
          label: { ru: "Макс.", uk: "Макс.", en: "Max" },
          admin: { width: "20%" },
        },
        {
          name: "defaultAge",
          type: "number",
          defaultValue: 6,
          min: 1,
          max: 99,
          label: { ru: "По умолч.", uk: "За замовч.", en: "Default" },
          admin: { width: "20%" },
        },
        {
          name: "allowOmit",
          type: "checkbox",
          defaultValue: true,
          label: { ru: "Разрешить пропуск", uk: "Дозволити пропуск", en: "Allow Omit" },
          admin: { width: "20%" },
        },
        {
          name: "omitLabel",
          type: "text",
          localized: true,
          defaultValue: "Не озвучувати вік",
          label: { ru: "Текст пропуска", uk: "Текст пропуску", en: "Omit Label" },
          admin: { width: "20%" },
        },
      ],
    },
  ],
};

export const PraisePresetsFieldBlock: Block = {
  slug: "praisePresetsField",
  labels: {
    singular: { ru: "Похвала / фраза с пресетами", uk: "Похвала / фраза з пресетами", en: "Praise Presets Field" },
    plural: { ru: "Похвала / фразы с пресетами", uk: "Похвала / фрази з пресетами", en: "Praise Presets Fields" },
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "fieldKey",
          type: "text",
          required: true,
          defaultValue: "achievement",
          label: { ru: "Ключ переменной", uk: "Ключ змінної", en: "Field Key" },
          admin: { width: "35%" },
        },
        {
          name: "label",
          type: "text",
          localized: true,
          required: true,
          label: { ru: "Заголовок секции", uk: "Заголовок секції", en: "Section Title" },
          admin: { width: "45%" },
        },
        {
          name: "required",
          type: "checkbox",
          defaultValue: true,
          label: { ru: "Обязательно", uk: "Обов'язково", en: "Required" },
          admin: { width: "20%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "minLength",
          type: "number",
          defaultValue: 10,
          label: { ru: "Мин.", uk: "Мін.", en: "Min" },
          admin: { width: "20%" },
        },
        {
          name: "maxLength",
          type: "number",
          defaultValue: 90,
          label: { ru: "Макс.", uk: "Макс.", en: "Max" },
          admin: { width: "20%" },
        },
        {
          name: "optimalMin",
          type: "number",
          defaultValue: 25,
          label: { ru: "Опт. от", uk: "Опт. від", en: "Opt Min" },
          admin: { width: "20%" },
        },
        {
          name: "optimalMax",
          type: "number",
          defaultValue: 75,
          label: { ru: "Опт. до", uk: "Опт. до", en: "Opt Max" },
          admin: { width: "20%" },
        },
        {
          name: "allowCustom",
          type: "checkbox",
          defaultValue: true,
          label: { ru: "Свой текст", uk: "Свій текст", en: "Allow Custom" },
          admin: { width: "20%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "showSpokenPreview",
          type: "checkbox",
          defaultValue: true,
          label: { ru: "Показать превью озвучки", uk: "Показати прев'ю озвучки", en: "Show Spoken Preview" },
          admin: { width: "30%" },
        },
        {
          name: "spokenPreviewTemplate",
          type: "text",
          localized: true,
          defaultValue: "{agePrefix} {achievement}…",
          label: { ru: "Шаблон превью фразы", uk: "Шаблон прев'ю фрази", en: "Spoken Preview Template" },
          admin: { width: "70%" },
        },
      ],
    },
    {
      name: "presets",
      type: "array",
      label: { ru: "Готовые карточки-пресеты", uk: "Готові картки-пресети", en: "Preset Cards" },
      admin: {
        components: {
          RowLabel: "engine/components/admin/FirstFieldRowLabel",
        },
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "presetId",
              type: "text",
              required: true,
              label: "ID",
              admin: { width: "25%" },
            },
            {
              name: "icon",
              type: "select",
              defaultValue: "heart",
              label: { ru: "Иконка", uk: "Іконка", en: "Icon" },
              options: [
                { label: "Bike", value: "bike" },
                { label: "Book", value: "book" },
                { label: "Home", value: "home" },
                { label: "Palette", value: "palette" },
                { label: "Heart", value: "heart" },
                { label: "Sparkles", value: "sparkles" },
              ],
              admin: { width: "25%" },
            },
            {
              name: "title",
              type: "text",
              localized: true,
              required: true,
              label: { ru: "Заголовок", uk: "Заголовок", en: "Title" },
              admin: { width: "50%" },
            },
          ],
        },
        {
          name: "desc",
          type: "text",
          localized: true,
          label: { ru: "Короткое описание", uk: "Короткий опис", en: "Description" },
        },
        {
          type: "row",
          fields: [
            {
              name: "phraseBoy",
              type: "text",
              localized: true,
              required: true,
              label: { ru: "Фраза (мальчик)", uk: "Фраза (хлопчик)", en: "Phrase (boy)" },
              admin: { width: "50%" },
            },
            {
              name: "phraseGirl",
              type: "text",
              localized: true,
              required: true,
              label: { ru: "Фраза (девочка)", uk: "Фраза (дівчинка)", en: "Phrase (girl)" },
              admin: { width: "50%" },
            },
          ],
        },
      ],
    },
  ],
};

export const PhotoUploadFieldBlock: Block = {
  slug: "photoUploadField",
  labels: {
    singular: { ru: "Загрузка приватного фото", uk: "Завантаження приватного фото", en: "Photo Upload Field" },
    plural: { ru: "Загрузка приватного фото", uk: "Завантаження приватного фото", en: "Photo Upload Fields" },
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "fieldKey",
          type: "text",
          required: true,
          defaultValue: "photo",
          label: { ru: "Ключ поля фото", uk: "Ключ поля фото", en: "Photo Field Key" },
          admin: { width: "30%" },
        },
        {
          name: "label",
          type: "text",
          localized: true,
          required: true,
          label: { ru: "Заголовок секции", uk: "Заголовок секції", en: "Section Title" },
          admin: { width: "50%" },
        },
        {
          name: "required",
          type: "checkbox",
          defaultValue: true,
          label: { ru: "Обязательно", uk: "Обов'язково", en: "Required" },
          admin: { width: "20%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "requireConsent",
          type: "checkbox",
          defaultValue: true,
          label: { ru: "Требовать согласие родителей", uk: "Вимагати згоду батьків", en: "Require Consent" },
          admin: { width: "35%" },
        },
        {
          name: "autoDeleteAfterRender",
          type: "checkbox",
          defaultValue: true,
          label: { ru: "Удалить сразу после рендера", uk: "Видалити одразу після рендеру", en: "Auto-delete after render" },
          admin: { width: "35%" },
        },
        {
          name: "showOverlayMockup",
          type: "checkbox",
          defaultValue: true,
          label: { ru: "Живой мокап в кадре", uk: "Живий мокап у кадрі", en: "Live Overlay Mockup" },
          admin: { width: "30%" },
        },
      ],
    },
    {
      type: "row",
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.showOverlayMockup),
      },
      fields: [
        {
          name: "mockupShotKey",
          type: "text",
          defaultValue: "04b",
          label: { ru: "Ключ шота для мокапа", uk: "Ключ шоту для мокапу", en: "Mockup Shot Key" },
          admin: { width: "50%" },
        },
        {
          name: "mockupOverlayId",
          type: "text",
          defaultValue: "book_photo",
          label: { ru: "ID оверлея для мокапа", uk: "ID оверлея для мокапу", en: "Mockup Overlay ID" },
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "consentText",
      type: "textarea",
      localized: true,
      label: { ru: "Текст чекбокса согласия", uk: "Текст чекбоксу згоди", en: "Consent Checkbox Text" },
    },
    {
      name: "privacyNote",
      type: "text",
      localized: true,
      label: { ru: "Подсказка про EXIF и приватность", uk: "Підказка про EXIF та приватність", en: "Privacy Note" },
    },
  ],
};

export const SelectCardsFieldBlock: Block = {
  slug: "selectCardsField",
  labels: {
    singular: { ru: "Выбор из карточек (хобби / подарок / опция)", uk: "Вибір із карток (хобі / подарунок / опція)", en: "Select Cards Field" },
    plural: { ru: "Выбор из карточек", uk: "Вибір із карток", en: "Select Cards Fields" },
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "fieldKey",
          type: "text",
          required: true,
          label: { ru: "Ключ переменной", uk: "Ключ змінної", en: "Field Key" },
          admin: { width: "35%" },
        },
        {
          name: "label",
          type: "text",
          localized: true,
          required: true,
          label: { ru: "Заголовок поля", uk: "Заголовок поля", en: "Field Label" },
          admin: { width: "45%" },
        },
        {
          name: "required",
          type: "checkbox",
          defaultValue: false,
          label: { ru: "Обязательно", uk: "Обов'язково", en: "Required" },
          admin: { width: "20%" },
        },
      ],
    },
    {
      name: "allowCustom",
      type: "checkbox",
      defaultValue: false,
      label: { ru: "Разрешить свой вариант", uk: "Дозволити свій варіант", en: "Allow Custom Option" },
    },
    {
      name: "options",
      type: "array",
      label: { ru: "Варианты", uk: "Варіанти", en: "Options" },
      admin: {
        components: {
          RowLabel: "engine/components/admin/FirstFieldRowLabel",
        },
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "value",
              type: "text",
              required: true,
              label: { ru: "Значение (value)", uk: "Значення (value)", en: "Value" },
              admin: { width: "30%" },
            },
            {
              name: "label",
              type: "text",
              localized: true,
              required: true,
              label: { ru: "Заголовок", uk: "Заголовок", en: "Label" },
              admin: { width: "35%" },
            },
            {
              name: "desc",
              type: "text",
              localized: true,
              label: { ru: "Описание", uk: "Опис", en: "Description" },
              admin: { width: "35%" },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "spokenBoy",
              type: "text",
              localized: true,
              label: { ru: "Текст в речи (мальчик, опц.)", uk: "Текст у мові (хлопчик, опц.)", en: "Spoken (boy, opt.)" },
              admin: { width: "50%" },
            },
            {
              name: "spokenGirl",
              type: "text",
              localized: true,
              label: { ru: "Текст в речи (девочка, опц.)", uk: "Текст у мові (дівчинка, опц.)", en: "Spoken (girl, opt.)" },
              admin: { width: "50%" },
            },
          ],
        },
      ],
    },
  ],
};

export const videoFormFieldBlocks: Block[] = [
  GenderFieldBlock,
  TextFieldBlock,
  AgeStepperFieldBlock,
  PraisePresetsFieldBlock,
  PhotoUploadFieldBlock,
  SelectCardsFieldBlock,
];
