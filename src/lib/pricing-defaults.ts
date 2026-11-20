import type {
  AiRatesConfig,
  PlatformLimitsConfig,
  PricingConfig,
  ServiceId,
} from "./types";

export const SERVICE_ORDER: ServiceId[] = [
  "storybook",
  "video",
  "photo_animation",
  "song",
  "postcard",
];

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  currency: "UAH",
  services: {
    storybook: {
      id: "storybook",
      stage: 2,
      enabled: true,
      comingSoon: false,
      badgeLabel: {
        uk: "Іменна книга • PDF",
        ru: "Именная книга • PDF",
      },
      title: {
        uk: "Персональна ілюстрована казка",
        ru: "Персональная иллюстрированная сказка",
      },
      description: {
        uk: "Конструктор у 3 кроки з необов’язковим фото дитини. Два режими верстки: Класична книга з акварельними віньєтками або Панорамний розворот.",
        ru: "Конструктор в 3 шага с необязательным фото ребёнка. Два режима вёрстки: Классическая книга с акварельными виньетками или Панорамный разворот.",
      },
      ctaLabel: {
        uk: "Зібрати казку (3 кроки)",
        ru: "Собрать сказку (3 шага)",
      },
      features: {
        uk: [
          "Єдина зовнішність героя та супутника (улюбленця, рідного чи друга) на всіх ілюстраціях",
          "6 художніх стилів та 2 режими верстки: Класична книга або Панорамний розворот",
          "Безкоштовне прев’ю всього тексту, обкладинки й перших ілюстрацій + редагування до оплати",
        ],
        ru: [
          "Единая внешность героя и спутника (питомца, родственника или друга) на всех иллюстрациях",
          "6 художественных стилей и 2 режима вёрстки: Классическая книга или Панорамный разворот",
          "Бесплатное превью всего текста, обложки и первых иллюстраций + редактирование до оплаты",
        ],
      },
      basePriceUah: 199,
      tiers: {
        "4": 199,
        "6": 199,
        "8": 249,
      },
    },
    video: {
      id: "video",
      stage: 1,
      enabled: true,
      comingSoon: false,
      badgeLabel: {
        uk: "Персональне відео • HD",
        ru: "Персональное видео • HD",
      },
      title: {
        uk: "Відеопривітання від Святого Миколая",
        ru: "Видеопоздравление от Святого Николая",
      },
      description: {
        uk: "Кінематографічний ~49-секундний ролик у затишній резиденції: Святий Миколай звертається по імені, відкриває Книгу добрих справ із вашим фото та хвалить за досягнення.",
        ru: "Кинематографичный ~49-секундный ролик в уютной резиденции: Святой Николай обращается по имени, открывает Книгу добрых дел с вашим фото и хвалит за успехи.",
      },
      ctaLabel: {
        uk: "Персоналізувати відео",
        ru: "Персонализировать видео",
      },
      features: {
        uk: [
          "Звертання по імені (включно з кличним відмінком) та жива озвучка українською або російською",
          "Фотографія та ім’я отримувача на сторінці чарівної Книги добрих справ",
          "Перегляд готового відео-прев’ю зі звуком до оплати через Plata by mono",
        ],
        ru: [
          "Обращение по имени (с поддержкой ласковой формы) и живая озвучка на украинском или русском языке",
          "Фотография и имя получателя на странице волшебной Книги добрых дел",
          "Просмотр готового видео-превью со звуком до оплаты через Plata by mono",
        ],
      },
      basePriceUah: 249,
    },
    photo_animation: {
      id: "photo_animation",
      stage: 3,
      enabled: false,
      comingSoon: true,
      badgeLabel: {
        uk: "Анімація фото • Скоро",
        ru: "Анимация фото • Скоро",
      },
      title: {
        uk: "Оживлення фото",
        ru: "Оживление фото",
      },
      description: {
        uk: "Перетворення сімейних та архівних фото на живі емоційні відеосцени.",
        ru: "Превращение семейных и архивных фото в живые эмоциональные видеосцены.",
      },
      ctaLabel: {
        uk: "Оживити фото",
        ru: "Оживить фото",
      },
      features: {
        uk: [
          "Бережна реставрація та плавна кінематографічна анімація",
          "Підтримка родинних портретів і архівних знімків",
        ],
        ru: [
          "Бережная реставрация и плавная кинематографичная анимация",
          "Поддержка семейных портретов и архивных снимков",
        ],
      },
      basePriceUah: 149,
      tiers: {
        single: 149,
        pack_3: 349,
      },
    },
    song: {
      id: "song",
      stage: 4,
      enabled: false,
      comingSoon: true,
      badgeLabel: {
        uk: "Іменна пісня • Скоро",
        ru: "Именная песня • Скоро",
      },
      title: {
        uk: "Персональна пісня-подарунок",
        ru: "Персональная песня-подарок",
      },
      description: {
        uk: "Унікальна вітальна пісня з іменем та історією отримувача.",
        ru: "Уникальная поздравительная песня с именем и историей получателя.",
      },
      ctaLabel: {
        uk: "Створити пісню",
        ru: "Создать песню",
      },
      features: {
        uk: ["Індивідуальний текст та студійне звучання"],
        ru: ["Индивидуальный текст и студийное звучание"],
      },
      basePriceUah: 179,
    },
    postcard: {
      id: "postcard",
      stage: 4,
      enabled: false,
      comingSoon: true,
      badgeLabel: {
        uk: "Музична листівка • Скоро",
        ru: "Музыкальная открытка • Скоро",
      },
      title: {
        uk: "Інтерактивна листівка",
        ru: "Интерактивная открытка",
      },
      description: {
        uk: "Анімована святкова листівка з персональним текстом і музикою.",
        ru: "Анимированная праздничная открытка с персональным текстом и музыкой.",
      },
      ctaLabel: {
        uk: "Створити листівку",
        ru: "Создать открытку",
      },
      features: {
        uk: ["Миттєва відправка у месенджери та соцмережі"],
        ru: ["Мгновенная отправка в мессенджеры и соцсети"],
      },
      basePriceUah: 99,
    },
  },
  updatedAt: "2026-11-20T00:00:00.000Z",
};

export const DEFAULT_PLATFORM_LIMITS: PlatformLimitsConfig = {
  maxPreviewOrdersPerSession: 3,
  maxAiEditsPerBook: 3,
  maxAiEditsPerVideo: 1,
  orderRetentionDays: 30,
  updatedAt: "2026-11-20T00:00:00.000Z",
};

export const DEFAULT_AI_RATES_CONFIG: AiRatesConfig = {
  usdToUah: 41.5,
  textModels: {
    "gpt-6.2-astra": { inputPer1M: 1.25, outputPer1M: 5.0 },
    "gpt-6.2-sol": { inputPer1M: 0.4, outputPer1M: 1.6 },
    "gpt-6.1-terra": { inputPer1M: 0.4, outputPer1M: 1.6 },
    "gpt-6-luna": { inputPer1M: 1.0, outputPer1M: 4.0 },
    default: { inputPer1M: 1.25, outputPer1M: 5.0 },
  },
  imagePerCallUsd: {
    "low:1024x1024": 0.011,
    "low:1536x1024": 0.016,
    "low:1024x1536": 0.016,
    "medium:1024x1024": 0.042,
    "medium:1536x1024": 0.063,
    "medium:1024x1536": 0.063,
    "high:1024x1024": 0.167,
    "high:1536x1024": 0.25,
    "high:1024x1536": 0.25,
    default: 0.045,
  },
  elevenLabsPer1kCharsUsd: 0.3,
  updatedAt: "2026-11-20T00:00:00.000Z",
};

export function getStorybookPriceFromConfig(
  config: PricingConfig,
  pageCount?: number
): number {
  const sb = config.services.storybook;
  if (!sb) return pageCount && pageCount >= 8 ? 249 : 199;
  if (typeof pageCount === "number") {
    const exact = sb.tiers?.[String(pageCount)];
    if (typeof exact === "number" && exact > 0) return exact;
    if (pageCount >= 8) {
      const t8 = sb.tiers?.["8"];
      if (typeof t8 === "number" && t8 > 0) return t8;
      return sb.basePriceUah + 50;
    }
  }
  return sb.basePriceUah;
}

export function getServicePriceFromConfig(
  config: PricingConfig,
  serviceId: ServiceId,
  options?: { pageCount?: number; tierKey?: string }
): number {
  if (serviceId === "storybook") {
    return getStorybookPriceFromConfig(config, options?.pageCount);
  }
  const entry = config.services[serviceId];
  if (!entry) return 0;
  if (options?.tierKey && typeof entry.tiers?.[options.tierKey] === "number") {
    return entry.tiers[options.tierKey];
  }
  return entry.basePriceUah;
}
