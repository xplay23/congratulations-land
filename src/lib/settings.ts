import { getPayload } from "@engine/lib/payload";
import {
  getAiRatesCacheVersion,
  getLimitsCacheVersion,
  getPricingCacheVersion,
} from "./cms-cache";
import {
  DEFAULT_AI_RATES_CONFIG,
  DEFAULT_PLATFORM_LIMITS,
  DEFAULT_PRICING_CONFIG,
  SERVICE_ORDER,
  getStorybookPriceFromConfig,
} from "./pricing-defaults";
import type {
  AiRatesConfig,
  PlatformLimitsConfig,
  PricingConfig,
  ServiceId,
  ServicePricingItem,
} from "./types";

const CACHE_TTL_MS = 30_000;

const KNOWN_SERVICE_IDS = new Set<ServiceId>(SERVICE_ORDER);

let pricingCache: { value: PricingConfig; version: number; expiresAt: number } | null = null;
let pricingInFlight: Promise<PricingConfig> | null = null;

let limitsCache: { value: PlatformLimitsConfig; version: number; expiresAt: number } | null = null;
let limitsInFlight: Promise<PlatformLimitsConfig> | null = null;

let aiRatesCache: { value: AiRatesConfig; version: number; expiresAt: number } | null = null;
let aiRatesInFlight: Promise<AiRatesConfig> | null = null;

function envNumber(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

function sanitizePositiveInt(val: unknown, fallback: number, min = 1, max = 100000): number {
  const n = Math.round(Number(val));
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return n;
}

function sanitizePositiveFloat(val: unknown, fallback: number, min = 0.0001, max = 10000): number {
  const n = Number(val);
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return n;
}

function cleanStageLabel(raw: string): string {
  return raw
    .replace(/\s*\((?:Етап|Этап|Stage)\s*\d+[^)]*\)/gi, "")
    .replace(/^(?:Етап|Этап|Stage)\s*\d+\s*[•·-]\s*/gi, "")
    .trim();
}

function pickLocalizedString(val: unknown, lang: "uk" | "ru"): string | undefined {
  if (typeof val === "string") return val.trim() || undefined;
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const primary = obj[lang];
    const fallback = obj[lang === "uk" ? "ru" : "uk"];
    if (typeof primary === "string" && primary.trim()) return primary.trim();
    if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
  }
  return undefined;
}

function pickLocalizedFeatures(val: unknown, lang: "uk" | "ru"): string[] | undefined {
  const arr = Array.isArray(val)
    ? val
    : val && typeof val === "object"
      ? ((val as Record<string, unknown>)[lang] ??
          (val as Record<string, unknown>)[lang === "uk" ? "ru" : "uk"])
      : undefined;
  if (!Array.isArray(arr)) return undefined;
  const out = arr
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const text = (item as Record<string, unknown>).text;
        return typeof text === "string" ? text.trim() : "";
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 8);
  return out.length > 0 ? out : undefined;
}

function sanitizeBilingualText(
  inc: { uk?: unknown; ru?: unknown } | undefined,
  def: { uk: string; ru: string },
  maxLen = 400
): { uk: string; ru: string } {
  const uk =
    typeof inc?.uk === "string" && inc.uk.trim()
      ? cleanStageLabel(inc.uk).slice(0, maxLen) || def.uk
      : def.uk;
  const ru =
    typeof inc?.ru === "string" && inc.ru.trim()
      ? cleanStageLabel(inc.ru).slice(0, maxLen) || def.ru
      : def.ru;
  return { uk, ru };
}

function sanitizeFeatures(
  inc: { uk?: unknown; ru?: unknown } | undefined,
  def?: { uk: string[]; ru: string[] }
): { uk: string[]; ru: string[] } | undefined {
  if (!inc && !def) return undefined;
  const parseList = (val: unknown, fallback: string[]): string[] => {
    if (!Array.isArray(val)) return fallback;
    const cleaned = val
      .map((s) => (typeof s === "string" ? s.trim().slice(0, 200) : ""))
      .filter(Boolean)
      .slice(0, 8);
    return cleaned.length > 0 ? cleaned : fallback;
  };
  return {
    uk: parseList(inc?.uk, def?.uk || []),
    ru: parseList(inc?.ru, def?.ru || []),
  };
}

export function buildBaselinePricing(): PricingConfig {
  const sbBase = envNumber("STORYBOOK_PRICE_UAH", 199);
  const sbExtra = envNumber("STORYBOOK_LONG_EXTRA_UAH", 50);
  const videoBase = envNumber("VIDEO_PRICE_UAH", 249);

  return {
    currency: "UAH",
    services: {
      ...DEFAULT_PRICING_CONFIG.services,
      storybook: {
        ...DEFAULT_PRICING_CONFIG.services.storybook,
        basePriceUah: sbBase,
        tiers: {
          "4": sbBase,
          "6": sbBase,
          "8": sbBase + sbExtra,
        },
      },
      video: {
        ...DEFAULT_PRICING_CONFIG.services.video,
        basePriceUah: videoBase,
      },
    },
    updatedAt: DEFAULT_PRICING_CONFIG.updatedAt,
  };
}

export function buildBaselinePlatformLimits(): PlatformLimitsConfig {
  return {
    maxPreviewOrdersPerSession: envNumber(
      "MAX_PREVIEW_ORDERS_PER_SESSION",
      DEFAULT_PLATFORM_LIMITS.maxPreviewOrdersPerSession
    ),
    maxAiEditsPerBook: envNumber(
      "MAX_AI_EDITS_PER_BOOK",
      DEFAULT_PLATFORM_LIMITS.maxAiEditsPerBook
    ),
    maxAiEditsPerVideo: DEFAULT_PLATFORM_LIMITS.maxAiEditsPerVideo,
    orderRetentionDays: envNumber(
      "ORDER_RETENTION_DAYS",
      DEFAULT_PLATFORM_LIMITS.orderRetentionDays
    ),
    updatedAt: DEFAULT_PLATFORM_LIMITS.updatedAt,
  };
}

async function loadPricingFromPayload(): Promise<PricingConfig> {
  const baseline = buildBaselinePricing();
  try {
    const payload = await getPayload();
    const res = await payload.find({
      collection: "services",
      locale: "all",
      limit: 50,
      depth: 0,
      overrideAccess: true,
    });

    const mergedServices = { ...baseline.services } as Record<
      ServiceId,
      ServicePricingItem
    >;
    let latestUpdatedAt = baseline.updatedAt;

    for (const raw of res.docs as unknown as Array<Record<string, unknown>>) {
      const id = String(raw.serviceKey || "") as ServiceId;
      if (!KNOWN_SERVICE_IDS.has(id)) continue;

      const def = baseline.services[id];
      const status = String(raw.status || "active");
      const rawUpdatedAt =
        typeof raw.updatedAt === "string" ? raw.updatedAt : undefined;
      if (rawUpdatedAt && rawUpdatedAt > latestUpdatedAt) {
        latestUpdatedAt = rawUpdatedAt;
      }

      const tiersArr = Array.isArray(raw.pricingTiers)
        ? (raw.pricingTiers as Array<{
            key?: string | null;
            priceUah?: number | null;
          }>)
        : [];
      const incTiers: Record<string, number> = {};
      for (const tier of tiersArr) {
        const tk = String(tier.key || "").trim();
        if (tk && typeof tier.priceUah === "number" && tier.priceUah > 0) {
          incTiers[tk] = sanitizePositiveInt(tier.priceUah, def.basePriceUah, 1, 50000);
        }
      }

      let tiers: Record<string, number> | undefined = def.tiers
        ? { ...def.tiers, ...incTiers }
        : Object.keys(incTiers).length > 0
          ? incTiers
          : undefined;

      const basePriceUah = sanitizePositiveInt(
        raw.basePriceUah,
        def.basePriceUah,
        1,
        50000
      );

      if (id === "storybook" && tiers) {
        tiers["4"] = sanitizePositiveInt(incTiers["4"], basePriceUah, 1, 50000);
        tiers["6"] = sanitizePositiveInt(incTiers["6"], basePriceUah, 1, 50000);
        tiers["8"] = sanitizePositiveInt(
          incTiers["8"],
          tiers["8"] ?? basePriceUah + 50,
          1,
          50000
        );
      }

      const titleUk = pickLocalizedString(raw.title, "uk");
      const titleRu = pickLocalizedString(raw.title, "ru");
      const descUk = pickLocalizedString(raw.shortDescription, "uk");
      const descRu = pickLocalizedString(raw.shortDescription, "ru");
      const badgeUk = pickLocalizedString(raw.badge, "uk");
      const badgeRu = pickLocalizedString(raw.badge, "ru");
      const ctaUk = pickLocalizedString(raw.ctaLabel, "uk");
      const ctaRu = pickLocalizedString(raw.ctaLabel, "ru");
      const featUk = pickLocalizedFeatures(raw.features, "uk");
      const featRu = pickLocalizedFeatures(raw.features, "ru");

      mergedServices[id] = {
        ...def,
        enabled: status === "active",
        comingSoon: status === "coming_soon",
        title: sanitizeBilingualText({ uk: titleUk, ru: titleRu }, def.title, 160),
        description: sanitizeBilingualText(
          { uk: descUk, ru: descRu },
          def.description,
          500
        ),
        badgeLabel: def.badgeLabel
          ? sanitizeBilingualText(
              { uk: badgeUk, ru: badgeRu },
              def.badgeLabel,
              80
            )
          : undefined,
        ctaLabel: def.ctaLabel
          ? sanitizeBilingualText({ uk: ctaUk, ru: ctaRu }, def.ctaLabel, 80)
          : undefined,
        features: sanitizeFeatures(
          featUk || featRu ? { uk: featUk, ru: featRu } : undefined,
          def.features
        ),
        basePriceUah: id === "storybook" && tiers?.["6"] ? tiers["6"] : basePriceUah,
        tiers,
      };
    }

    return {
      currency: "UAH",
      services: mergedServices,
      updatedAt: latestUpdatedAt,
    };
  } catch (err) {
    console.warn("[settings] Failed to load pricing from Payload, using baseline:", err);
    return baseline;
  }
}

export async function getPricingConfig(): Promise<PricingConfig> {
  const version = getPricingCacheVersion();
  const now = Date.now();
  if (
    pricingCache &&
    pricingCache.version === version &&
    pricingCache.expiresAt > now
  ) {
    return pricingCache.value;
  }

  if (!pricingInFlight) {
    pricingInFlight = loadPricingFromPayload()
      .then((value) => {
        pricingCache = {
          value,
          version: getPricingCacheVersion(),
          expiresAt: Date.now() + CACHE_TTL_MS,
        };
        return value;
      })
      .finally(() => {
        pricingInFlight = null;
      });
  }

  return pricingInFlight;
}

export async function getDynamicPriceKopiykas(
  productType: "storybook" | "video",
  pageCount?: number
): Promise<number> {
  const cfg = await getPricingConfig();
  const uah =
    productType === "storybook"
      ? getStorybookPriceFromConfig(cfg, pageCount)
      : cfg.services.video.basePriceUah;
  return Math.round(uah * 100);
}

async function loadPlatformLimitsFromPayload(): Promise<PlatformLimitsConfig> {
  const baseline = buildBaselinePlatformLimits();
  try {
    const payload = await getPayload();
    const doc = (await payload.findGlobal({
      slug: "platform-limits",
      depth: 0,
      overrideAccess: true,
    })) as unknown as Record<string, unknown> | null;

    if (!doc) return baseline;

    return {
      maxPreviewOrdersPerSession: sanitizePositiveInt(
        doc.maxPreviewOrdersPerSession,
        baseline.maxPreviewOrdersPerSession,
        1,
        100
      ),
      maxAiEditsPerBook: sanitizePositiveInt(
        doc.maxAiEditsPerBook,
        baseline.maxAiEditsPerBook,
        0,
        20
      ),
      maxAiEditsPerVideo: sanitizePositiveInt(
        doc.maxAiEditsPerVideo,
        baseline.maxAiEditsPerVideo,
        0,
        20
      ),
      orderRetentionDays: sanitizePositiveInt(
        doc.orderRetentionDays,
        baseline.orderRetentionDays,
        1,
        365
      ),
      updatedAt:
        typeof doc.updatedAt === "string" ? doc.updatedAt : baseline.updatedAt,
    };
  } catch (err) {
    console.warn("[settings] Failed to load platform-limits from Payload, using baseline:", err);
    return baseline;
  }
}

export async function getPlatformLimits(): Promise<PlatformLimitsConfig> {
  const version = getLimitsCacheVersion();
  const now = Date.now();
  if (
    limitsCache &&
    limitsCache.version === version &&
    limitsCache.expiresAt > now
  ) {
    return limitsCache.value;
  }

  if (!limitsInFlight) {
    limitsInFlight = loadPlatformLimitsFromPayload()
      .then((value) => {
        limitsCache = {
          value,
          version: getLimitsCacheVersion(),
          expiresAt: Date.now() + CACHE_TTL_MS,
        };
        return value;
      })
      .finally(() => {
        limitsInFlight = null;
      });
  }

  return limitsInFlight;
}

async function loadAiRatesFromPayload(): Promise<AiRatesConfig> {
  try {
    const payload = await getPayload();
    const doc = (await payload.findGlobal({
      slug: "ai-economics",
      depth: 0,
      overrideAccess: true,
    })) as unknown as {
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
      updatedAt?: string | null;
    } | null;

    if (!doc) return DEFAULT_AI_RATES_CONFIG;

    const textModels = { ...DEFAULT_AI_RATES_CONFIG.textModels };
    for (const row of doc.textModelRates ?? []) {
      const model = String(row.modelId || "").trim();
      if (!model) continue;
      const def = textModels[model] || textModels.default;
      textModels[model] = {
        inputPer1M: sanitizePositiveFloat(row.inputPer1M, def.inputPer1M, 0, 500),
        outputPer1M: sanitizePositiveFloat(row.outputPer1M, def.outputPer1M, 0, 500),
      };
    }

    const imagePerCallUsd = { ...DEFAULT_AI_RATES_CONFIG.imagePerCallUsd };
    for (const row of doc.imageRates ?? []) {
      const key = String(row.key || "").trim();
      if (!key) continue;
      imagePerCallUsd[key] = sanitizePositiveFloat(
        row.priceUsd,
        imagePerCallUsd[key] ?? 0.045,
        0,
        10
      );
    }

    return {
      usdToUah: sanitizePositiveFloat(
        doc.usdToUah,
        DEFAULT_AI_RATES_CONFIG.usdToUah,
        1,
        500
      ),
      textModels,
      imagePerCallUsd,
      elevenLabsPer1kCharsUsd: sanitizePositiveFloat(
        doc.elevenLabsPer1kCharsUsd,
        DEFAULT_AI_RATES_CONFIG.elevenLabsPer1kCharsUsd,
        0,
        50
      ),
      updatedAt: doc.updatedAt || DEFAULT_AI_RATES_CONFIG.updatedAt,
    };
  } catch (err) {
    console.warn("[settings] Failed to load ai-economics from Payload, using defaults:", err);
    return DEFAULT_AI_RATES_CONFIG;
  }
}

export async function getAiRatesConfig(): Promise<AiRatesConfig> {
  const version = getAiRatesCacheVersion();
  const now = Date.now();
  if (
    aiRatesCache &&
    aiRatesCache.version === version &&
    aiRatesCache.expiresAt > now
  ) {
    return aiRatesCache.value;
  }

  if (!aiRatesInFlight) {
    aiRatesInFlight = loadAiRatesFromPayload()
      .then((value) => {
        aiRatesCache = {
          value,
          version: getAiRatesCacheVersion(),
          expiresAt: Date.now() + CACHE_TTL_MS,
        };
        return value;
      })
      .finally(() => {
        aiRatesInFlight = null;
      });
  }

  return aiRatesInFlight;
}
