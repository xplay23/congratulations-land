import fs from "node:fs";
import path from "node:path";
import { getPayload } from "@engine/lib/payload";
import {
  getStorybookConfigCacheVersion,
  invalidateStorybookConfigCache,
} from "@/lib/cms-cache";
import { getCmsAiConfig } from "@/lib/cms-ai-config";
import type { CompanionGender, LayoutMode } from "@/lib/types";
import {
  buildStaticStorybookRuntimeConfig,
  normalizeStorybookIconName,
  toPublicStorybookConfig,
  type LocalizedPair,
  type StorybookAgeGroupConfig,
  type StorybookFamilyRelationConfig,
  type StorybookLayoutConfig,
  type StorybookMediumPreset,
  type StorybookPageVolumeConfig,
  type StorybookPetSpeciesConfig,
  type StorybookPresetConfig,
  type StorybookPublicConfig,
  type StorybookRuntimeConfig,
  type StorybookStyleConfig,
  type StorybookSwatchConfig,
  type StorybookToneConfig,
  type StorybookToyPresetConfig,
  type StorybookWorldOrPlotConfig,
} from "./config-shared";

export {
  buildStaticStorybookPublicConfig,
  buildStaticStorybookRuntimeConfig,
  DEFAULT_STORYBOOK_PROMPTS,
  MEDIUM_TRANSLATION_DEFAULTS,
  NEGATIVE_RULES_DEFAULTS,
  normalizeStorybookIconName,
  resolveMediumTranslationRule,
  resolveNegativeRules,
  STORYBOOK_STYLE_TEST_SCENES,
  toPublicStorybookConfig,
} from "./config-shared";

export type {
  LocalizedPair,
  StorybookAgeGroupConfig,
  StorybookFamilyRelationConfig,
  StorybookLayoutConfig,
  StorybookMediumPreset,
  StorybookPageVolumeConfig,
  StorybookPdfConfig,
  StorybookPetSpeciesConfig,
  StorybookPipelinePrompts,
  StorybookPresetConfig,
  StorybookPublicConfig,
  StorybookPublicStyle,
  StorybookRuntimeConfig,
  StorybookStyleConfig,
  StorybookSwatchConfig,
  StorybookToneConfig,
  StorybookToyPresetConfig,
  StorybookWorldOrPlotConfig,
} from "./config-shared";

const CACHE_TTL_MS = 30_000;
let cachedRuntime: {
  value: StorybookRuntimeConfig;
  version: number;
  expiresAt: number;
} | null = null;
let inFlight: Promise<StorybookRuntimeConfig> | null = null;

export function clearStorybookConfigCache(): void {
  cachedRuntime = null;
  invalidateStorybookConfigCache();
}

function asStr(val: unknown, fallback = ""): string {
  return typeof val === "string" && val.trim() ? val.trim() : fallback;
}

function asBool(val: unknown, fallback: boolean): boolean {
  return typeof val === "boolean" ? val : fallback;
}

function asNum(val: unknown, fallback: number): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function asLocalizedPair(val: unknown, fallback: LocalizedPair): LocalizedPair {
  if (typeof val === "string" && val.trim()) {
    return { uk: val.trim(), ru: val.trim() };
  }
  if (val && typeof val === "object") {
    const rec = val as Record<string, unknown>;
    const uk = asStr(rec.uk) || asStr(rec.ru) || fallback.uk;
    const ru = asStr(rec.ru) || asStr(rec.uk) || fallback.ru;
    return { uk, ru };
  }
  return fallback;
}

function asOptionalLocalizedPair(val: unknown): LocalizedPair | undefined {
  if (typeof val === "string" && val.trim()) {
    return { uk: val.trim(), ru: val.trim() };
  }
  if (val && typeof val === "object") {
    const rec = val as Record<string, unknown>;
    const uk = asStr(rec.uk);
    const ru = asStr(rec.ru);
    if (!uk && !ru) return undefined;
    return { uk: uk || ru, ru: ru || uk };
  }
  return undefined;
}

function resolveMediaUrl(mediaVal: unknown, fallbackUrl = ""): string {
  if (mediaVal && typeof mediaVal === "object") {
    const rec = mediaVal as Record<string, unknown>;
    const filename = asStr(rec.filename);
    if (filename) {
      return `/media/${encodeURIComponent(path.basename(filename))}`;
    }
    const url = asStr(rec.url);
    if (url) return url;
  }
  return asStr(fallbackUrl);
}

function resolveLocalMediaFilePath(mediaVal: unknown): string | undefined {
  if (!mediaVal || typeof mediaVal !== "object") return undefined;
  const rec = mediaVal as Record<string, unknown>;
  const filename = asStr(rec.filename);
  if (!filename) return undefined;
  const safeBase = path.basename(filename);
  const candidate = path.resolve(process.cwd(), "public", "media", safeBase);
  if (fs.existsSync(candidate)) return candidate;
  return undefined;
}

function normalizeMediumPreset(raw: unknown): StorybookMediumPreset {
  if (
    raw === "2d_illustration" ||
    raw === "3d_animation" ||
    raw === "claymation_stopmotion" ||
    raw === "custom"
  ) {
    return raw;
  }
  return "2d_illustration";
}

function normalizeImpliedGender(raw: unknown): CompanionGender | "ask" {
  if (raw === "male" || raw === "female") return raw;
  return "ask";
}

export async function getStorybookRuntimeConfig(): Promise<StorybookRuntimeConfig> {
  const version = getStorybookConfigCacheVersion();
  if (
    cachedRuntime &&
    cachedRuntime.version === version &&
    Date.now() < cachedRuntime.expiresAt
  ) {
    return cachedRuntime.value;
  }
  if (inFlight) return inFlight;

  inFlight = (async (): Promise<StorybookRuntimeConfig> => {
    const baseline = buildStaticStorybookRuntimeConfig();
    try {
      const [payload, aiConfig] = await Promise.all([
        getPayload(),
        getCmsAiConfig().catch(() => null),
      ]);

      const [stylesRes, configRaw] = await Promise.all([
        payload
          .find({
            collection: "storybook-styles" as never,
            locale: "all" as never,
            depth: 1,
            limit: 100,
            sort: "sortOrder",
          })
          .catch(() => ({ docs: [] })),
        payload
          .findGlobal({
            slug: "storybook-config" as never,
            locale: "all" as never,
            depth: 1,
          })
          .catch(() => null),
      ]);

      const legacyPrompts = aiConfig?.prompts ?? {};

      // 1. Styles
      const styleDocs = Array.isArray((stylesRes as { docs?: unknown[] }).docs)
        ? ((stylesRes as { docs: Array<Record<string, unknown>> }).docs)
        : [];

      let styles: StorybookStyleConfig[] = baseline.styles.map((s) => ({
        ...s,
        stylePrompt: legacyPrompts[`style-${s.slug}`]?.trim() || s.stylePrompt,
      }));

      if (styleDocs.length > 0) {
        const parsedStyles: StorybookStyleConfig[] = [];
        for (const doc of styleDocs) {
          const slug = asStr(doc.slug);
          if (!slug) continue;
          const fallback = baseline.styles.find((s) => s.slug === slug);
          const previewImageUrl =
            resolveMediaUrl(doc.previewImage, asStr(doc.fallbackImageUrl)) ||
            fallback?.previewImageUrl ||
            "/samples/style_watercolor.jpg";

          parsedStyles.push({
            slug,
            title: asLocalizedPair(doc.title, fallback?.title ?? { uk: slug, ru: slug }),
            description: asLocalizedPair(
              doc.description,
              fallback?.description ?? { uk: "", ru: "" }
            ),
            badge: asOptionalLocalizedPair(doc.badge),
            previewImageUrl,
            enabled: asBool(doc.enabled, true),
            isDefault: asBool(doc.isDefault, false),
            sortOrder: asNum(doc.sortOrder, fallback?.sortOrder ?? 100),
            stylePrompt:
              asStr(doc.stylePrompt) ||
              legacyPrompts[`style-${slug}`]?.trim() ||
              fallback?.stylePrompt ||
              "Warm illustrated children's picture book art style",
            mediumPreset: normalizeMediumPreset(doc.mediumPreset),
            mediumRuleOverride: asStr(doc.mediumRuleOverride) || undefined,
            negativeRulesOverride: asStr(doc.negativeRulesOverride) || undefined,
          });
        }
        if (parsedStyles.length > 0) {
          parsedStyles.sort((a, b) => a.sortOrder - b.sortOrder);
          styles = parsedStyles;
        }
      }

      const cfg = (configRaw ?? {}) as Record<string, unknown>;

      // 2. Layouts
      let layouts = baseline.layouts;
      if (Array.isArray(cfg.layouts) && cfg.layouts.length > 0) {
        const parsed: StorybookLayoutConfig[] = [];
        for (const raw of cfg.layouts as Array<Record<string, unknown>>) {
          const code: LayoutMode = raw.code === "panorama" ? "panorama" : "classic";
          if (parsed.some((l) => l.code === code)) continue;
          const fb = baseline.layouts.find((l) => l.code === code) ?? baseline.layouts[0];
          parsed.push({
            code,
            enabled: asBool(raw.enabled, true),
            isDefault: asBool(raw.isDefault, code === "classic"),
            label: asLocalizedPair(raw.label, fb.label),
            description: asLocalizedPair(raw.description, fb.description),
            badge: asOptionalLocalizedPair(raw.badge),
            previewImageUrl:
              resolveMediaUrl(raw.previewImage, asStr(raw.fallbackImageUrl)) ||
              fb.previewImageUrl,
          });
        }
        if (parsed.length > 0) layouts = parsed;
      }

      // 3. Age groups
      let ageGroups = baseline.ageGroups;
      if (Array.isArray(cfg.ageGroups) && cfg.ageGroups.length > 0) {
        const parsed: StorybookAgeGroupConfig[] = [];
        for (const raw of cfg.ageGroups as Array<Record<string, unknown>>) {
          const code = asStr(raw.code);
          if (!code) continue;
          const fb = baseline.ageGroups.find((a) => a.code === code);
          parsed.push({
            code,
            enabled: asBool(raw.enabled, true),
            isDefault: asBool(raw.isDefault, false),
            label: asLocalizedPair(raw.label, fb?.label ?? { uk: code, ru: code }),
            hint: asLocalizedPair(raw.hint, fb?.hint ?? { uk: "", ru: "" }),
            wordRange: asStr(raw.wordRange, fb?.wordRange ?? "60–90"),
            writerNote: asStr(raw.writerNote) || fb?.writerNote,
          });
        }
        if (parsed.length > 0) ageGroups = parsed;
      }

      // 4. Page volumes & preview pages count
      const previewPagesCount = Math.min(
        4,
        Math.max(1, Math.round(asNum(cfg.previewPagesCount, baseline.previewPagesCount)))
      );
      let pageVolumes = baseline.pageVolumes;
      if (Array.isArray(cfg.pageVolumes) && cfg.pageVolumes.length > 0) {
        const parsed: StorybookPageVolumeConfig[] = [];
        for (const raw of cfg.pageVolumes as Array<Record<string, unknown>>) {
          const pages = Math.round(asNum(raw.pages, 0));
          if (pages < 4 || pages > 16) continue;
          const fb = baseline.pageVolumes.find((v) => v.pages === pages);
          parsed.push({
            pages,
            enabled: asBool(raw.enabled, true),
            isDefault: asBool(raw.isDefault, false),
            readingTimeLabel: asLocalizedPair(
              raw.readingTimeLabel,
              fb?.readingTimeLabel ?? { uk: `~${pages} хв`, ru: `~${pages} мин` }
            ),
          });
        }
        if (parsed.length > 0) pageVolumes = parsed;
      }
      const defaultVolume =
        pageVolumes.find((v) => v.enabled && v.isDefault)?.pages ??
        Math.round(asNum(cfg.defaultPageCount, baseline.defaultPageCount));
      const defaultPageCount = pageVolumes.some((v) => v.pages === defaultVolume)
        ? defaultVolume
        : pageVolumes[0]?.pages ?? 6;

      // 5. Tones
      let tones = baseline.tones;
      if (Array.isArray(cfg.tones) && cfg.tones.length > 0) {
        const parsed: StorybookToneConfig[] = [];
        for (const raw of cfg.tones as Array<Record<string, unknown>>) {
          const slug = asStr(raw.slug);
          if (!slug) continue;
          const fb = baseline.tones.find((t) => t.slug === slug);
          parsed.push({
            slug,
            enabled: asBool(raw.enabled, true),
            icon: normalizeStorybookIconName(asStr(raw.icon), fb?.icon || "Sparkles"),
            label: asLocalizedPair(raw.label, fb?.label ?? { uk: slug, ru: slug }),
            subtitle: asLocalizedPair(raw.subtitle, fb?.subtitle ?? { uk: "", ru: "" }),
            promptHint: asStr(raw.promptHint) || undefined,
          });
        }
        if (parsed.length > 0) tones = parsed;
      }

      // 6. Settings (Worlds)
      let settings = baseline.settings;
      if (Array.isArray(cfg.settings) && cfg.settings.length > 0) {
        const parsed: StorybookWorldOrPlotConfig[] = [];
        for (const raw of cfg.settings as Array<Record<string, unknown>>) {
          const slug = asStr(raw.slug);
          if (!slug) continue;
          const fb = baseline.settings.find((s) => s.slug === slug);
          const title = asLocalizedPair(raw.title, fb?.title ?? { uk: slug, ru: slug });
          const previewImageUrl =
            resolveMediaUrl(raw.previewImage, asStr(raw.fallbackImageUrl)) || undefined;
          parsed.push({
            slug,
            enabled: asBool(raw.enabled, true),
            icon: normalizeStorybookIconName(asStr(raw.icon), fb?.icon || "Sparkles"),
            title,
            description: asLocalizedPair(raw.description, fb?.description ?? { uk: "", ru: "" }),
            promptValue: asLocalizedPair(raw.promptValue, fb?.promptValue ?? title),
            previewImageUrl,
          });
        }
        if (parsed.length > 0) settings = parsed;
      }

      // 7. Plots
      let plots = baseline.plots;
      if (Array.isArray(cfg.plots) && cfg.plots.length > 0) {
        const parsed: StorybookWorldOrPlotConfig[] = [];
        for (const raw of cfg.plots as Array<Record<string, unknown>>) {
          const slug = asStr(raw.slug);
          if (!slug) continue;
          const fb = baseline.plots.find((p) => p.slug === slug);
          const title = asLocalizedPair(raw.title, fb?.title ?? { uk: slug, ru: slug });
          const previewImageUrl =
            resolveMediaUrl(raw.previewImage, asStr(raw.fallbackImageUrl)) || undefined;
          parsed.push({
            slug,
            enabled: asBool(raw.enabled, true),
            icon: normalizeStorybookIconName(asStr(raw.icon), fb?.icon || "Compass"),
            title,
            description: asLocalizedPair(raw.description, fb?.description ?? { uk: "", ru: "" }),
            promptValue: asLocalizedPair(raw.promptValue, fb?.promptValue ?? title),
            previewImageUrl,
          });
        }
        if (parsed.length > 0) plots = parsed;
      }

      // 8. Presets
      let presets = baseline.presets;
      if (Array.isArray(cfg.presets) && cfg.presets.length > 0) {
        const parsed: StorybookPresetConfig[] = [];
        for (const raw of cfg.presets as Array<Record<string, unknown>>) {
          const toneSlug = asStr(raw.toneSlug);
          const settingSlug = asStr(raw.settingSlug);
          const plotSlug = asStr(raw.plotSlug);
          if (!toneSlug || !settingSlug || !plotSlug) continue;
          parsed.push({
            slug: asStr(raw.slug, `preset-${parsed.length + 1}`),
            label: asOptionalLocalizedPair(raw.label),
            toneSlug,
            settingSlug,
            plotSlug,
            styleSlug: asStr(raw.styleSlug) || undefined,
          });
        }
        if (parsed.length > 0) presets = parsed;
      }

      // 9. Appearance & Companions
      let hairSwatches = baseline.hairSwatches;
      if (Array.isArray(cfg.hairSwatches) && cfg.hairSwatches.length > 0) {
        const parsed: StorybookSwatchConfig[] = [];
        for (const raw of cfg.hairSwatches as Array<Record<string, unknown>>) {
          const slug = asStr(raw.slug);
          if (!slug) continue;
          const fb = baseline.hairSwatches.find((s) => s.slug === slug);
          parsed.push({
            slug,
            color: asStr(raw.color, fb?.color ?? "#8c5832"),
            label: asLocalizedPair(raw.label, fb?.label ?? { uk: slug, ru: slug }),
            promptEn: asStr(raw.promptEn) || fb?.promptEn,
          });
        }
        if (parsed.length > 0) hairSwatches = parsed;
      }

      let eyeSwatches = baseline.eyeSwatches;
      if (Array.isArray(cfg.eyeSwatches) && cfg.eyeSwatches.length > 0) {
        const parsed: StorybookSwatchConfig[] = [];
        for (const raw of cfg.eyeSwatches as Array<Record<string, unknown>>) {
          const slug = asStr(raw.slug);
          if (!slug) continue;
          const fb = baseline.eyeSwatches.find((s) => s.slug === slug);
          parsed.push({
            slug,
            color: asStr(raw.color, fb?.color ?? "#4f8fd6"),
            label: asLocalizedPair(raw.label, fb?.label ?? { uk: slug, ru: slug }),
            promptEn: asStr(raw.promptEn) || fb?.promptEn,
          });
        }
        if (parsed.length > 0) eyeSwatches = parsed;
      }

      let petSpecies = baseline.petSpecies;
      if (Array.isArray(cfg.petSpecies) && cfg.petSpecies.length > 0) {
        const parsed: StorybookPetSpeciesConfig[] = [];
        for (const raw of cfg.petSpecies as Array<Record<string, unknown>>) {
          const slug = asStr(raw.slug);
          if (!slug) continue;
          const fb = baseline.petSpecies.find((p) => p.slug === slug);
          parsed.push({
            slug,
            enabled: asBool(raw.enabled, true),
            label: asLocalizedPair(raw.label, fb?.label ?? { uk: slug, ru: slug }),
            promptEn: asStr(raw.promptEn, fb?.promptEn ?? slug),
          });
        }
        if (parsed.length > 0) petSpecies = parsed;
      }

      let familyRelations = baseline.familyRelations;
      if (Array.isArray(cfg.familyRelations) && cfg.familyRelations.length > 0) {
        const parsed: StorybookFamilyRelationConfig[] = [];
        for (const raw of cfg.familyRelations as Array<Record<string, unknown>>) {
          const slug = asStr(raw.slug);
          if (!slug) continue;
          const fb = baseline.familyRelations.find((f) => f.slug === slug);
          parsed.push({
            slug,
            enabled: asBool(raw.enabled, true),
            label: asLocalizedPair(raw.label, fb?.label ?? { uk: slug, ru: slug }),
            promptEn: asStr(raw.promptEn, fb?.promptEn ?? slug),
            impliedGender: normalizeImpliedGender(raw.impliedGender ?? fb?.impliedGender),
          });
        }
        if (parsed.length > 0) familyRelations = parsed;
      }

      let toyPresets = baseline.toyPresets;
      if (Array.isArray(cfg.toyPresets) && cfg.toyPresets.length > 0) {
        const parsed: StorybookToyPresetConfig[] = [];
        for (const raw of cfg.toyPresets as Array<Record<string, unknown>>) {
          const label = asOptionalLocalizedPair(raw.label);
          if (!label) continue;
          parsed.push({ label });
        }
        if (parsed.length > 0) toyPresets = parsed;
      }

      // 10. Pipeline Prompts (StorybookConfig -> legacy AIPrompts -> hardcoded defaults)
      const prompts = {
        beatsSystem:
          asStr(cfg.promptBeatsSystem) ||
          legacyPrompts["storybook-beats-system"]?.trim() ||
          baseline.prompts.beatsSystem,
        draftSystem:
          asStr(cfg.promptDraftSystem) ||
          legacyPrompts["storybook-draft-system"]?.trim() ||
          baseline.prompts.draftSystem,
        proofreadSystem:
          asStr(cfg.promptProofreadSystem) ||
          legacyPrompts["storybook-proofread-system"]?.trim() ||
          baseline.prompts.proofreadSystem,
        directorSystem:
          asStr(cfg.promptDirectorSystem) ||
          legacyPrompts["storybook-director-system"]?.trim() ||
          baseline.prompts.directorSystem,
        visionQa:
          asStr(cfg.promptVisionQa) ||
          legacyPrompts["storybook-vision-qa"]?.trim() ||
          baseline.prompts.visionQa,
      };

      // 11. PDF & Decor
      const pdf = {
        watermarkText: asLocalizedPair(cfg.pdfWatermarkText, baseline.pdf.watermarkText),
        jpegQuality: Math.min(
          98,
          Math.max(70, Math.round(asNum(cfg.pdfJpegQuality, baseline.pdf.jpegQuality)))
        ),
        decorCornerVignettePath: resolveLocalMediaFilePath(cfg.decorCornerVignette),
        decorDedicationWreathPath: resolveLocalMediaFilePath(cfg.decorDedicationWreath),
        decorChapterDividerPath: resolveLocalMediaFilePath(cfg.decorChapterDivider),
        decorCoverCornerPath: resolveLocalMediaFilePath(cfg.decorCoverCorner),
        decorCoverBackdropPath: resolveLocalMediaFilePath(cfg.decorCoverBackdrop),
      };

      const runtime: StorybookRuntimeConfig = {
        styles,
        layouts,
        ageGroups,
        previewPagesCount,
        defaultPageCount,
        pageVolumes,
        tones,
        settings,
        plots,
        presets,
        hairSwatches,
        eyeSwatches,
        petSpecies,
        familyRelations,
        toyPresets,
        prompts,
        pdf,
        cacheVersion: version,
      };

      cachedRuntime = {
        value: runtime,
        version,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
      return runtime;
    } catch (err) {
      console.warn("[storybook-config] Falling back to static config:", err);
      return baseline;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export async function getStorybookPublicConfig(): Promise<StorybookPublicConfig> {
  const runtime = await getStorybookRuntimeConfig();
  return toPublicStorybookConfig(runtime);
}

export function resolveStorybookStyle(
  config: StorybookRuntimeConfig,
  artStyleSlug: string
): StorybookStyleConfig {
  const exact = config.styles.find((s) => s.slug === artStyleSlug);
  if (exact) return exact;
  const def = config.styles.find((s) => s.enabled && s.isDefault) || config.styles[0];
  if (def) return def;
  return buildStaticStorybookRuntimeConfig().styles[0];
}
