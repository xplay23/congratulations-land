import type { GlobalConfig } from "payload";
import { homeBuilderBlocks } from "@engine/blocks";
import { invalidateCmsContentCache } from "@/lib/cms-cache";

export const HomeTemplate: GlobalConfig = {
  slug: "home-template",
  label: {
    ru: "Главная страница",
    uk: "Головна сторінка",
    en: "Home Page",
  },
  admin: {
    group: { ru: "Шаблоны", uk: "Шаблони", en: "Templates" },
    description: {
      ru: "Обязательный неудаляемый шаблон главной страницы, собранный из блоков конструктора.",
      uk: "Обов'язковий шаблон головної сторінки, зібраний із блоків конструктора.",
      en: "Mandatory non-deletable home page template built from visual blocks.",
    },
  },
  hooks: {
    afterChange: [
      () => {
        invalidateCmsContentCache(["/", "/ru"]);
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
      name: "sections",
      type: "blocks",
      localized: true,
      blocks: homeBuilderBlocks,
      label: {
        ru: "Блоки главной страницы",
        uk: "Блоки головної сторінки",
        en: "Home Page Blocks",
      },
      admin: {
        initCollapsed: true,
        description: {
          ru: "Добавляйте, меняйте порядок и редактируйте секции главной страницы.",
          uk: "Додавайте, змінюйте порядок та редагуйте секції головної сторінки.",
          en: "Add, reorder and edit sections of the home page.",
        },
      },
    },
  ],
};
