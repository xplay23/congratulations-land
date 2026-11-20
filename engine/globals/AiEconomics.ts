import type { GlobalConfig } from "payload";
import { saveAiRatesConfig } from "@/lib/settings";

export const AiEconomics: GlobalConfig = {
  slug: "ai-economics",
  label: {
    ru: "Курсы и маржа",
    uk: "Курси та маржа",
    en: "AI Economics",
  },
  admin: {
    group: { ru: "Настройки", uk: "Налаштування", en: "Settings" },
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        const d = doc as {
          usdToUah?: number | null;
          elevenLabsPer1kCharsUsd?: number | null;
          textModelRates?: Array<{
            modelId?: string | null;
            inputPer1M?: number | null;
            outputPer1M?: number | null;
          }> | null;
          imageRates?: Array<{
            key?: string | null;
            priceUsd?: number | null;
          }> | null;
        };

        const textModels: Record<
          string,
          { inputPer1M: number; outputPer1M: number }
        > = {};
        for (const row of d.textModelRates ?? []) {
          const id = String(row.modelId || "").trim();
          if (!id) continue;
          textModels[id] = {
            inputPer1M: Number(row.inputPer1M ?? 0),
            outputPer1M: Number(row.outputPer1M ?? 0),
          };
        }

        const imagePerCallUsd: Record<string, number> = {};
        for (const row of d.imageRates ?? []) {
          const key = String(row.key || "").trim();
          if (!key) continue;
          imagePerCallUsd[key] = Number(row.priceUsd ?? 0);
        }

        saveAiRatesConfig({
          usdToUah: typeof d.usdToUah === "number" ? d.usdToUah : undefined,
          elevenLabsPer1kCharsUsd:
            typeof d.elevenLabsPer1kCharsUsd === "number"
              ? d.elevenLabsPer1kCharsUsd
              : undefined,
          textModels:
            Object.keys(textModels).length > 0 ? textModels : undefined,
          imagePerCallUsd:
            Object.keys(imagePerCallUsd).length > 0
              ? imagePerCallUsd
              : undefined,
        });
      },
    ],
  },
  fields: [
    {
      type: "ui",
      name: "economicsDivider",
      admin: {
        components: {
          Field:
            "engine/components/admin/SectionDivider#AiEconomicsDivider",
        },
      },
    },
    {
      type: "ui",
      name: "ratesRefresh",
      admin: {
        components: {
          Field: "engine/components/admin/AiRatesRefreshButton",
        },
      },
    },
    {
      name: "lastSyncedAt",
      type: "date",
      label: {
        ru: "Последнее автообновление",
        uk: "Останнє автооновлення",
        en: "Last Auto-sync",
      },
      admin: {
        readOnly: true,
        date: { pickerAppearance: "dayAndTime", displayFormat: "yyyy-MM-dd HH:mm" },
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "usdToUah",
          type: "number",
          label: {
            ru: "Курс USD → UAH (₴)",
            uk: "Курс USD → UAH (₴)",
            en: "USD to UAH Rate",
          },
          defaultValue: 41.5,
          min: 1,
          max: 500,
          required: true,
          admin: {
            step: 0.1,
            width: "50%",
          },
        },
        {
          name: "elevenLabsPer1kCharsUsd",
          type: "number",
          label: {
            ru: "ElevenLabs ($ за 1000 символов)",
            uk: "ElevenLabs ($ за 1000 символів)",
            en: "ElevenLabs (USD / 1k chars)",
          },
          defaultValue: 0.3,
          min: 0,
          max: 50,
          required: true,
          admin: {
            step: 0.01,
            width: "50%",
          },
        },
      ],
    },
    {
      name: "textModelRates",
      type: "array",
      label: {
        ru: "Тарифы текстовых и Vision-моделей ($ за 1M токенов)",
        uk: "Тарифи текстових та Vision-моделей ($ за 1M токенів)",
        en: "Text & Vision Model Rates (USD / 1M tokens)",
      },
      labels: {
        singular: { ru: "Модель", uk: "Модель", en: "Model" },
        plural: { ru: "Модели", uk: "Моделі", en: "Models" },
      },
      admin: {
        initCollapsed: false,
        components: {
          RowLabel: "engine/components/admin/FirstFieldRowLabel",
        },
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "modelId",
              type: "text",
              required: true,
              label: { ru: "ID модели", uk: "ID моделі", en: "Model ID" },
              admin: {
                width: "44%",
                placeholder: "gpt-6.2-astra или default",
              },
            },
            {
              name: "inputPer1M",
              type: "number",
              required: true,
              min: 0,
              max: 500,
              label: {
                ru: "Input ($ / 1M)",
                uk: "Input ($ / 1M)",
                en: "Input ($ / 1M)",
              },
              admin: { step: 0.01, width: "28%" },
            },
            {
              name: "outputPer1M",
              type: "number",
              required: true,
              min: 0,
              max: 500,
              label: {
                ru: "Output ($ / 1M)",
                uk: "Output ($ / 1M)",
                en: "Output ($ / 1M)",
              },
              admin: { step: 0.01, width: "28%" },
            },
          ],
        },
      ],
    },
    {
      name: "imageRates",
      type: "array",
      label: {
        ru: "Стоимость генерации изображений ($ за 1 картинку)",
        uk: "Вартість генерації зображень ($ за 1 зображення)",
        en: "Image Generation Rates (USD / image)",
      },
      labels: {
        singular: { ru: "Пресет", uk: "Пресет", en: "Preset" },
        plural: { ru: "Пресеты", uk: "Пресети", en: "Presets" },
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
              name: "key",
              type: "text",
              required: true,
              label: {
                ru: "Ключ (quality:size)",
                uk: "Ключ (quality:size)",
                en: "Key (quality:size)",
              },
              admin: {
                width: "60%",
                placeholder: "medium:1536x1024 или default",
              },
            },
            {
              name: "priceUsd",
              type: "number",
              required: true,
              min: 0,
              max: 10,
              label: { ru: "Цена ($)", uk: "Ціна ($)", en: "Price (USD)" },
              admin: { step: 0.001, width: "40%" },
            },
          ],
        },
      ],
    },
  ],
};
