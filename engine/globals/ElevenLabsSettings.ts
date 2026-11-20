import type { GlobalConfig } from "payload";
import { invalidateModelsCache } from "@/app/api/ai/models/route";
import { invalidateCmsAiConfigCache } from "@/lib/cms-ai-config";

export const ElevenLabsSettings: GlobalConfig = {
  slug: "elevenlabs-settings",
  label: { ru: "ElevenLabs", uk: "ElevenLabs", en: "ElevenLabs" },
  admin: {
    group: { ru: "Настройки", uk: "Налаштування", en: "Settings" },
  },
  hooks: {
    afterChange: [
      () => {
        invalidateModelsCache();
        invalidateCmsAiConfigCache();
      },
    ],
  },
  fields: [
    {
      type: "ui",
      name: "connectionDivider",
      admin: {
        components: {
          Field:
            "engine/components/admin/SectionDivider#ElevenLabsConnectionDivider",
        },
      },
    },
    {
      name: "apiKey",
      type: "text",
      label: "ElevenLabs API Key",
      admin: {
        components: {
          Field: "engine/components/admin/SecretKeyField#ElevenLabsApiKeyField",
        },
      },
      access: {
        read: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: "modelId",
      type: "text",
      label: { ru: "Модель ElevenLabs", uk: "Модель ElevenLabs", en: "ElevenLabs Model" },
      defaultValue: "eleven_v4",
      admin: {
        components: {
          Field: "engine/components/admin/HiddenModelField/ElevenLabsModel",
        },
      },
    },
    {
      name: "voiceId",
      type: "text",
      label: {
        ru: "Голос по умолчанию (Voice ID)",
        uk: "Голос за замовчуванням (Voice ID)",
        en: "Default Voice ID",
      },
      defaultValue: "NOpBlnGInO9m6vDvFkFC",
      admin: {
        description: {
          ru: "Выберите голос из списка вашего аккаунта ElevenLabs или введите произвольный Voice ID вручную.",
          uk: "Оберіть голос зі списку вашого акаунта ElevenLabs або введіть довільний Voice ID вручну.",
          en: "Pick a voice from your ElevenLabs account or enter any Voice ID manually.",
        },
        components: {
          Field: "engine/components/admin/ElevenLabsVoiceField#ElevenLabsVoiceField",
        },
      },
    },
    {
      type: "ui",
      name: "voiceSettingsDivider",
      admin: {
        components: {
          Field:
            "engine/components/admin/SectionDivider#ElevenLabsVoiceSettingsDivider",
        },
      },
    },
    {
      name: "stability",
      type: "number",
      label: {
        ru: "Стабильность голоса (Voice Stability)",
        uk: "Стабільність голосу (Voice Stability)",
        en: "Voice Stability",
      },
      defaultValue: 0.5,
      min: 0,
      max: 1,
      admin: {
        step: 0.01,
        description: {
          ru: "Ниже — более эмоциональная и живая интонация; выше — более ровное, предсказуемое звучание (рекомендуется 0.45–0.65).",
          uk: "Нижче — більш емоційна й жива інтонація; вище — більш рівне, передбачуване звучання (рекомендовано 0.45–0.65).",
          en: "Lower = more expressive; higher = more consistent (recommended 0.45–0.65).",
        },
        components: {
          Field: "engine/components/admin/RangeNumberField#RangeNumberField",
        },
      },
    },
    {
      name: "similarityBoost",
      type: "number",
      label: {
        ru: "Схожесть тембра (Similarity Boost)",
        uk: "Схожість тембру (Similarity Boost)",
        en: "Similarity Boost",
      },
      defaultValue: 0.78,
      min: 0,
      max: 1,
      admin: {
        step: 0.01,
        description: {
          ru: "Насколько близко синтезированная речь держится к оригинальному тембру голоса (рекомендуется 0.70–0.85).",
          uk: "Наскільки близько синтезоване мовлення тримається оригінального тембру голосу (рекомендовано 0.70–0.85).",
          en: "How closely output matches the original voice timbre (recommended 0.70–0.85).",
        },
        components: {
          Field: "engine/components/admin/RangeNumberField#RangeNumberField",
        },
      },
    },
  ],
};
