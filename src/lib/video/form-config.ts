import type { Lang } from "@/lib/types";

export interface PublicGenderField {
  id?: string;
  blockType: "genderField";
  fieldKey: string;
  label: string;
  required: boolean;
  boyLabel: string;
  boyHint: string;
  girlLabel: string;
  girlHint: string;
}

export interface PublicTextField {
  id?: string;
  blockType: "textField";
  fieldKey: string;
  label: string;
  placeholder?: string;
  required: boolean;
  minLength: number;
  maxLength: number;
  width: "half" | "full";
  enableVocative?: boolean;
  vocativeFieldKey?: string;
  vocativeLabel?: string;
  vocativePlaceholder?: string;
  vocativeMaxLength?: number;
}

export interface PublicAgeStepperField {
  id?: string;
  blockType: "ageStepperField";
  fieldKey: string;
  label: string;
  minAge: number;
  maxAge: number;
  defaultAge: number;
  allowOmit: boolean;
  omitLabel: string;
}

export interface PublicPraisePreset {
  presetId: string;
  icon: "bike" | "book" | "home" | "palette" | "heart" | "sparkles";
  title: string;
  desc: string;
  phraseBoy: string;
  phraseGirl: string;
}

export interface PublicPraisePresetsField {
  id?: string;
  blockType: "praisePresetsField";
  fieldKey: string;
  label: string;
  required: boolean;
  minLength: number;
  maxLength: number;
  optimalMin: number;
  optimalMax: number;
  allowCustom: boolean;
  showSpokenPreview: boolean;
  spokenPreviewTemplate: string;
  presets: PublicPraisePreset[];
}

export interface PublicPhotoUploadField {
  id?: string;
  blockType: "photoUploadField";
  fieldKey: string;
  label: string;
  required: boolean;
  requireConsent: boolean;
  autoDeleteAfterRender: boolean;
  showOverlayMockup: boolean;
  mockupShotKey?: string;
  mockupOverlayId?: string;
  consentText: string;
  privacyNote: string;
}

export interface PublicSelectCardOption {
  value: string;
  label: string;
  desc?: string;
  spokenBoy?: string;
  spokenGirl?: string;
}

export interface PublicSelectCardsField {
  id?: string;
  blockType: "selectCardsField";
  fieldKey: string;
  label: string;
  required: boolean;
  allowCustom: boolean;
  options: PublicSelectCardOption[];
}

export type PublicVideoFormField =
  | PublicGenderField
  | PublicTextField
  | PublicAgeStepperField
  | PublicPraisePresetsField
  | PublicPhotoUploadField
  | PublicSelectCardsField;

export interface PublicOverlayMockup {
  photoFieldKey: string;
  frameUrl: string;
  cx: number;
  cy: number;
  width: number;
  height: number;
  borderRadius: number;
  rotation: number;
  framePreset: "antique_book" | "polaroid" | "gold_frame" | "none";
  captionFieldKey?: string;
  captionColor: string;
  captionOffsetY: number;
}

export interface PublicVideoTemplateConfig {
  id: number;
  slug: string;
  title: string;
  cardBadge: string;
  cardTitle: string;
  cardDescription: string;
  cardPreviewUrl: string;
  parentAdviceTitle: string;
  parentAdviceText: string;
  formFields: PublicVideoFormField[];
  overlayMockups: Record<string, PublicOverlayMockup>;
}

export interface DynamicValidationResult {
  ok: true;
  normalizedFields: Record<string, string>;
  normalizedUploads: Record<string, string>;
}

export interface DynamicValidationError {
  ok: false;
  fieldKey: string;
  error: string;
}

export function validateDynamicVideoSubmission(opts: {
  formFields: PublicVideoFormField[];
  fields: Record<string, string>;
  uploads: Record<string, string>;
  parentalConsent: boolean;
  lang: Lang;
}): DynamicValidationResult | DynamicValidationError {
  const { formFields, fields, uploads, parentalConsent, lang } = opts;
  const isUk = lang === "uk";
  const normalizedFields: Record<string, string> = {};
  const normalizedUploads: Record<string, string> = {};

  for (const [k, v] of Object.entries(fields)) {
    normalizedFields[k] = typeof v === "string" ? v.trim() : String(v ?? "").trim();
  }
  for (const [k, v] of Object.entries(uploads)) {
    const clean = typeof v === "string" ? v.trim() : "";
    if (clean) normalizedUploads[k] = clean;
  }

  for (const block of formFields) {
    if (block.blockType === "genderField") {
      const val = normalizedFields[block.fieldKey];
      if (block.required && val !== "boy" && val !== "girl") {
        return {
          ok: false,
          fieldKey: block.fieldKey,
          error: isUk
            ? "Оберіть стать дитини (хлопчик або дівчинка)."
            : "Выберите пол ребёнка (мальчик или девочка).",
        };
      }
    } else if (block.blockType === "textField") {
      const val = normalizedFields[block.fieldKey] || "";
      if (block.required && !val) {
        return {
          ok: false,
          fieldKey: block.fieldKey,
          error: isUk
            ? `Заповніть поле «${block.label}».`
            : `Заполните поле «${block.label}».`,
        };
      }
      if (val && (val.length < block.minLength || val.length > block.maxLength)) {
        return {
          ok: false,
          fieldKey: block.fieldKey,
          error: isUk
            ? `Поле «${block.label}» має містити від ${block.minLength} до ${block.maxLength} символів.`
            : `Поле «${block.label}» должно содержать от ${block.minLength} до ${block.maxLength} символов.`,
        };
      }
      if (block.enableVocative && block.vocativeFieldKey) {
        const vocVal = normalizedFields[block.vocativeFieldKey] || "";
        const maxV = block.vocativeMaxLength || 25;
        if (vocVal.length > maxV) {
          normalizedFields[block.vocativeFieldKey] = vocVal.slice(0, maxV);
        }
      }
    } else if (block.blockType === "praisePresetsField") {
      const val = normalizedFields[block.fieldKey] || "";
      if (block.required && !val) {
        return {
          ok: false,
          fieldKey: block.fieldKey,
          error: isUk
            ? `Заповніть поле «${block.label}».`
            : `Заполните поле «${block.label}».`,
        };
      }
      if (val && (val.length < block.minLength || val.length > block.maxLength)) {
        return {
          ok: false,
          fieldKey: block.fieldKey,
          error: isUk
            ? `Текст має містити від ${block.minLength} до ${block.maxLength} символів (оптимально ${block.optimalMin}–${block.optimalMax}).`
            : `Текст должен содержать от ${block.minLength} до ${block.maxLength} символов (оптимально ${block.optimalMin}–${block.optimalMax}).`,
        };
      }
    } else if (block.blockType === "photoUploadField") {
      const uploadId = normalizedUploads[block.fieldKey] || "";
      if (block.required && !uploadId) {
        return {
          ok: false,
          fieldKey: block.fieldKey,
          error: isUk
            ? `Завантажте фото для «${block.label}».`
            : `Загрузите фото для «${block.label}».`,
        };
      }
      if (uploadId && block.requireConsent && !parentalConsent) {
        return {
          ok: false,
          fieldKey: "consent",
          error: isUk
            ? "Підтвердіть згоду батьків на тимчасову обробку фото."
            : "Подтвердите согласие родителей на временную обработку фото.",
        };
      }
    } else if (block.blockType === "selectCardsField") {
      const val = normalizedFields[block.fieldKey] || "";
      if (block.required && !val) {
        return {
          ok: false,
          fieldKey: block.fieldKey,
          error: isUk
            ? `Оберіть варіант у полі «${block.label}».`
            : `Выберите вариант в поле «${block.label}».`,
        };
      }
    }
  }

  return { ok: true, normalizedFields, normalizedUploads };
}
