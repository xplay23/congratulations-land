import { getVideoTemplateById, getVideoTemplateBySlug, type VideoTemplateDoc } from "./manifest-builder";
import { parseTimelineConfig } from "./template-schema";
import type {
  PublicOverlayMockup,
  PublicPraisePreset,
  PublicSelectCardOption,
  PublicVideoFormField,
  PublicVideoTemplateConfig,
} from "./form-config";
import type { Lang } from "@/lib/types";

function asStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNum(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function resolveMediaUrl(val: unknown, fallback: string): string {
  if (typeof val === "object" && val !== null) {
    const obj = val as { url?: unknown; filename?: unknown };
    if (typeof obj.url === "string" && obj.url.trim()) return obj.url.trim();
    if (typeof obj.filename === "string" && obj.filename.trim()) {
      return `/media/${obj.filename.trim()}`;
    }
  }
  return fallback;
}

function mapFormFields(rawFields: unknown): PublicVideoFormField[] {
  if (!Array.isArray(rawFields)) return [];
  const out: PublicVideoFormField[] = [];

  for (const item of rawFields) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const bt = asStr(raw.blockType);

    if (bt === "genderField") {
      out.push({
        id: asStr(raw.id) || undefined,
        blockType: "genderField",
        fieldKey: asStr(raw.fieldKey, "gender"),
        label: asStr(raw.label),
        required: raw.required !== false,
        boyLabel: asStr(raw.boyLabel),
        boyHint: asStr(raw.boyHint),
        girlLabel: asStr(raw.girlLabel),
        girlHint: asStr(raw.girlHint),
      });
    } else if (bt === "textField") {
      out.push({
        id: asStr(raw.id) || undefined,
        blockType: "textField",
        fieldKey: asStr(raw.fieldKey, "childName"),
        label: asStr(raw.label),
        placeholder: asStr(raw.placeholder) || undefined,
        required: raw.required !== false,
        minLength: asNum(raw.minLength, 2),
        maxLength: asNum(raw.maxLength, 15),
        width: raw.width === "full" ? "full" : "half",
        enableVocative: Boolean(raw.enableVocative),
        vocativeFieldKey: asStr(raw.vocativeFieldKey) || undefined,
        vocativeLabel: asStr(raw.vocativeLabel) || undefined,
        vocativePlaceholder: asStr(raw.vocativePlaceholder) || undefined,
        vocativeMaxLength: asNum(raw.vocativeMaxLength, 17),
      });
    } else if (bt === "ageStepperField") {
      out.push({
        id: asStr(raw.id) || undefined,
        blockType: "ageStepperField",
        fieldKey: asStr(raw.fieldKey, "age"),
        label: asStr(raw.label),
        minAge: asNum(raw.minAge, 1),
        maxAge: asNum(raw.maxAge, 14),
        defaultAge: asNum(raw.defaultAge, 6),
        allowOmit: raw.allowOmit !== false,
        omitLabel: asStr(raw.omitLabel),
      });
    } else if (bt === "praisePresetsField") {
      const presets: PublicPraisePreset[] = Array.isArray(raw.presets)
        ? (raw.presets as Array<Record<string, unknown>>).map((p) => {
            const iconRaw = asStr(p.icon, "heart");
            const icon: PublicPraisePreset["icon"] =
              iconRaw === "bike" ||
              iconRaw === "book" ||
              iconRaw === "home" ||
              iconRaw === "palette" ||
              iconRaw === "sparkles"
                ? iconRaw
                : "heart";
            return {
              presetId: asStr(p.presetId, "preset"),
              icon,
              title: asStr(p.title),
              desc: asStr(p.desc),
              phraseBoy: asStr(p.phraseBoy),
              phraseGirl: asStr(p.phraseGirl),
            };
          })
        : [];
      out.push({
        id: asStr(raw.id) || undefined,
        blockType: "praisePresetsField",
        fieldKey: asStr(raw.fieldKey, "achievement"),
        label: asStr(raw.label),
        required: raw.required !== false,
        minLength: asNum(raw.minLength, 10),
        maxLength: asNum(raw.maxLength, 90),
        optimalMin: asNum(raw.optimalMin, 25),
        optimalMax: asNum(raw.optimalMax, 75),
        allowCustom: raw.allowCustom !== false,
        showSpokenPreview: raw.showSpokenPreview !== false,
        spokenPreviewTemplate: asStr(raw.spokenPreviewTemplate, "{agePrefix} {achievement}…"),
        presets,
      });
    } else if (bt === "photoUploadField") {
      out.push({
        id: asStr(raw.id) || undefined,
        blockType: "photoUploadField",
        fieldKey: asStr(raw.fieldKey, "photo"),
        label: asStr(raw.label),
        required: raw.required !== false,
        requireConsent: raw.requireConsent !== false,
        autoDeleteAfterRender: raw.autoDeleteAfterRender !== false,
        showOverlayMockup: raw.showOverlayMockup !== false,
        mockupShotKey: asStr(raw.mockupShotKey) || undefined,
        mockupOverlayId: asStr(raw.mockupOverlayId) || undefined,
        consentText: asStr(raw.consentText),
        privacyNote: asStr(raw.privacyNote),
      });
    } else if (bt === "selectCardsField") {
      const options: PublicSelectCardOption[] = Array.isArray(raw.options)
        ? (raw.options as Array<Record<string, unknown>>).map((o) => ({
            value: asStr(o.value),
            label: asStr(o.label),
            desc: asStr(o.desc) || undefined,
            spokenBoy: asStr(o.spokenBoy) || undefined,
            spokenGirl: asStr(o.spokenGirl) || undefined,
          }))
        : [];
      out.push({
        id: asStr(raw.id) || undefined,
        blockType: "selectCardsField",
        fieldKey: asStr(raw.fieldKey),
        label: asStr(raw.label),
        required: Boolean(raw.required),
        allowCustom: Boolean(raw.allowCustom),
        options,
      });
    }
  }

  return out;
}

export function mapTemplateDocToPublicConfig(
  doc: VideoTemplateDoc
): PublicVideoTemplateConfig {
  const formFields = mapFormFields(doc.formFields);
  const timeline = parseTimelineConfig(doc.timelineConfig);
  const overlayMockups: Record<string, PublicOverlayMockup> = {};

  for (const field of formFields) {
    if (field.blockType !== "photoUploadField" || !field.showOverlayMockup) {
      continue;
    }
    const targetShotKey = field.mockupShotKey || "04b";
    const shot = timeline.shots.find(
      (s) => s.key === targetShotKey || s.id === targetShotKey
    );
    const ov =
      shot?.overlays?.find((o) => o.id === field.mockupOverlayId) ||
      shot?.overlays?.find((o) => o.photoFieldKey === field.fieldKey) ||
      shot?.overlays?.[0];

    if (shot && ov) {
      overlayMockups[field.fieldKey] = {
        photoFieldKey: field.fieldKey,
        frameUrl: `/api/config/video-template-frame?templateSlug=${encodeURIComponent(
          doc.slug
        )}&shotKey=${encodeURIComponent(shot.key)}`,
        cx: ov.cx,
        cy: ov.cy,
        width: ov.width,
        height: ov.height,
        borderRadius: ov.borderRadius,
        rotation: ov.rotation ?? 0,
        framePreset: ov.framePreset,
        captionFieldKey: ov.captionFieldKey,
        captionColor: ov.caption?.color || "#442610",
        captionOffsetY: ov.caption?.offsetY ?? 18,
      };
    }
  }

  const firstShot = timeline.shots[0];
  const firstShotFallbackUrl =
    firstShot && Number(firstShot.videoAssetId) > 0
      ? `/api/config/video-template-frame?templateSlug=${encodeURIComponent(doc.slug)}&shotKey=first`
      : "/samples/nicholas_preview.jpg";

  return {
    id: Number(doc.id),
    slug: doc.slug,
    title: doc.title,
    cardBadge: doc.cardBadge || "",
    cardTitle: doc.cardTitle || doc.title,
    cardDescription: doc.cardDescription || "",
    cardPreviewUrl: resolveMediaUrl(
      doc.cardPreviewImage,
      doc.cardPreviewFallbackUrl?.trim() || firstShotFallbackUrl
    ),
    parentAdviceTitle: doc.parentAdviceTitle || "",
    parentAdviceText: doc.parentAdviceText || "",
    formFields,
    overlayMockups,
  };
}

export async function getPublicVideoTemplateConfig(
  idOrSlug: number | string,
  locale: Lang
): Promise<PublicVideoTemplateConfig | null> {
  const doc =
    typeof idOrSlug === "number" || /^\d+$/.test(String(idOrSlug))
      ? await getVideoTemplateById(Number(idOrSlug), locale)
      : await getVideoTemplateBySlug(String(idOrSlug), locale);

  if (!doc || doc.enabled === false) return null;
  return mapTemplateDocToPublicConfig(doc);
}
