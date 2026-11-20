import { getAppState, setAppState } from "./db";
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

const KEY_PRICING = "pricing_config";
const KEY_LIMITS = "platform_limits";
const KEY_AI_RATES = "ai_rates_config";

function envNumber(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

function buildBaselinePricing(): PricingConfig {
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

export function getPricingConfig(): PricingConfig {
  const baseline = buildBaselinePricing();
  const raw = getAppState(KEY_PRICING);
  if (!raw) return baseline;

  try {
    const parsed = JSON.parse(raw) as Partial<PricingConfig>;
    const mergedServices = { ...baseline.services } as Record<ServiceId, ServicePricingItem>;

    for (const id of SERVICE_ORDER) {
      const def = baseline.services[id];
      const inc = parsed.services?.[id];
      if (!inc) continue;

      const tiers: Record<string, number> | undefined = def.tiers ? { ...def.tiers } : undefined;
      if (tiers && inc.tiers) {
        for (const [tk, tv] of Object.entries(inc.tiers)) {
          tiers[tk] = sanitizePositiveInt(tv, tiers[tk] ?? def.basePriceUah, 1, 50000);
        }
      } else if (inc.tiers) {
        const extraTiers: Record<string, number> = {};
        for (const [tk, tv] of Object.entries(inc.tiers)) {
          extraTiers[tk] = sanitizePositiveInt(tv, def.basePriceUah, 1, 50000);
        }
        Object.assign(def, { tiers: extraTiers });
      }

      const basePriceUah = sanitizePositiveInt(inc.basePriceUah, def.basePriceUah, 1, 50000);
      if (id === "storybook" && tiers) {
        tiers["4"] = sanitizePositiveInt(inc.tiers?.["4"], basePriceUah, 1, 50000);
        tiers["6"] = sanitizePositiveInt(inc.tiers?.["6"], basePriceUah, 1, 50000);
        tiers["8"] = sanitizePositiveInt(inc.tiers?.["8"], tiers["8"] ?? basePriceUah + 50, 1, 50000);
      }

      mergedServices[id] = {
        ...def,
        enabled: typeof inc.enabled === "boolean" ? inc.enabled : def.enabled,
        comingSoon: typeof inc.comingSoon === "boolean" ? inc.comingSoon : def.comingSoon,
        title: sanitizeBilingualText(inc.title, def.title, 160),
        description: sanitizeBilingualText(inc.description, def.description, 500),
        badgeLabel: def.badgeLabel
          ? sanitizeBilingualText(inc.badgeLabel, def.badgeLabel, 80)
          : undefined,
        ctaLabel: def.ctaLabel
          ? sanitizeBilingualText(inc.ctaLabel, def.ctaLabel, 80)
          : undefined,
        features: sanitizeFeatures(inc.features, def.features),
        basePriceUah,
        tiers,
      };
    }

    return {
      currency: "UAH",
      services: mergedServices,
      updatedAt: parsed.updatedAt || baseline.updatedAt,
    };
  } catch {
    return baseline;
  }
}

export function savePricingConfig(input: Partial<PricingConfig>): PricingConfig {
  const current = getPricingConfig();
  const nextServices = { ...current.services } as Record<ServiceId, ServicePricingItem>;

  for (const id of SERVICE_ORDER) {
    const cur = current.services[id];
    const inc = input.services?.[id];
    if (!inc) continue;

    const basePriceUah = sanitizePositiveInt(inc.basePriceUah, cur.basePriceUah, 1, 50000);
    let tiers: Record<string, number> | undefined = cur.tiers ? { ...cur.tiers } : undefined;
    if (inc.tiers) {
      tiers = tiers || {};
      for (const [k, v] of Object.entries(inc.tiers)) {
        tiers[k] = sanitizePositiveInt(v, tiers[k] ?? basePriceUah, 1, 50000);
      }
    }

    nextServices[id] = {
      ...cur,
      enabled: typeof inc.enabled === "boolean" ? inc.enabled : cur.enabled,
      comingSoon: typeof inc.comingSoon === "boolean" ? inc.comingSoon : cur.comingSoon,
      title: sanitizeBilingualText(inc.title, cur.title, 160),
      description: sanitizeBilingualText(inc.description, cur.description, 500),
      badgeLabel: cur.badgeLabel
        ? sanitizeBilingualText(inc.badgeLabel, cur.badgeLabel, 80)
        : undefined,
      ctaLabel: cur.ctaLabel
        ? sanitizeBilingualText(inc.ctaLabel, cur.ctaLabel, 80)
        : undefined,
      features: sanitizeFeatures(inc.features, cur.features),
      basePriceUah: id === "storybook" && tiers?.["6"] ? tiers["6"] : basePriceUah,
      tiers,
    };
  }

  const saved: PricingConfig = {
    currency: "UAH",
    services: nextServices,
    updatedAt: new Date().toISOString(),
  };
  setAppState(KEY_PRICING, JSON.stringify(saved));
  return saved;
}

export function getDynamicPriceKopiykas(
  productType: "storybook" | "video",
  pageCount?: number
): number {
  const cfg = getPricingConfig();
  const uah =
    productType === "storybook"
      ? getStorybookPriceFromConfig(cfg, pageCount)
      : cfg.services.video.basePriceUah;
  return Math.round(uah * 100);
}

export function getPlatformLimits(): PlatformLimitsConfig {
  const baseline: PlatformLimitsConfig = {
    maxPreviewOrdersPerSession: envNumber("MAX_PREVIEW_ORDERS_PER_SESSION", DEFAULT_PLATFORM_LIMITS.maxPreviewOrdersPerSession),
    maxAiEditsPerBook: envNumber("MAX_AI_EDITS_PER_BOOK", DEFAULT_PLATFORM_LIMITS.maxAiEditsPerBook),
    maxAiEditsPerVideo: DEFAULT_PLATFORM_LIMITS.maxAiEditsPerVideo,
    orderRetentionDays: envNumber("ORDER_RETENTION_DAYS", DEFAULT_PLATFORM_LIMITS.orderRetentionDays),
    updatedAt: DEFAULT_PLATFORM_LIMITS.updatedAt,
  };

  const raw = getAppState(KEY_LIMITS);
  if (!raw) return baseline;

  try {
    const parsed = JSON.parse(raw) as Partial<PlatformLimitsConfig>;
    return {
      maxPreviewOrdersPerSession: sanitizePositiveInt(
        parsed.maxPreviewOrdersPerSession,
        baseline.maxPreviewOrdersPerSession,
        1,
        100
      ),
      maxAiEditsPerBook: sanitizePositiveInt(
        parsed.maxAiEditsPerBook,
        baseline.maxAiEditsPerBook,
        0,
        20
      ),
      maxAiEditsPerVideo: sanitizePositiveInt(
        parsed.maxAiEditsPerVideo,
        baseline.maxAiEditsPerVideo,
        0,
        20
      ),
      orderRetentionDays: sanitizePositiveInt(
        parsed.orderRetentionDays,
        baseline.orderRetentionDays,
        1,
        365
      ),
      updatedAt: parsed.updatedAt || baseline.updatedAt,
    };
  } catch {
    return baseline;
  }
}

export function savePlatformLimits(input: Partial<PlatformLimitsConfig>): PlatformLimitsConfig {
  const cur = getPlatformLimits();
  const saved: PlatformLimitsConfig = {
    maxPreviewOrdersPerSession: sanitizePositiveInt(
      input.maxPreviewOrdersPerSession,
      cur.maxPreviewOrdersPerSession,
      1,
      100
    ),
    maxAiEditsPerBook: sanitizePositiveInt(
      input.maxAiEditsPerBook,
      cur.maxAiEditsPerBook,
      0,
      20
    ),
    maxAiEditsPerVideo: sanitizePositiveInt(
      input.maxAiEditsPerVideo,
      cur.maxAiEditsPerVideo,
      0,
      20
    ),
    orderRetentionDays: sanitizePositiveInt(
      input.orderRetentionDays,
      cur.orderRetentionDays,
      1,
      365
    ),
    updatedAt: new Date().toISOString(),
  };
  setAppState(KEY_LIMITS, JSON.stringify(saved));
  return saved;
}

export function getAiRatesConfig(): AiRatesConfig {
  const raw = getAppState(KEY_AI_RATES);
  if (!raw) return DEFAULT_AI_RATES_CONFIG;

  try {
    const parsed = JSON.parse(raw) as Partial<AiRatesConfig>;
    const textModels = { ...DEFAULT_AI_RATES_CONFIG.textModels };
    if (parsed.textModels) {
      for (const [model, rates] of Object.entries(parsed.textModels)) {
        const def = textModels[model] || textModels.default;
        textModels[model] = {
          inputPer1M: sanitizePositiveFloat(rates?.inputPer1M, def.inputPer1M, 0, 500),
          outputPer1M: sanitizePositiveFloat(rates?.outputPer1M, def.outputPer1M, 0, 500),
        };
      }
    }

    const imagePerCallUsd = { ...DEFAULT_AI_RATES_CONFIG.imagePerCallUsd };
    if (parsed.imagePerCallUsd) {
      for (const [k, v] of Object.entries(parsed.imagePerCallUsd)) {
        imagePerCallUsd[k] = sanitizePositiveFloat(v, imagePerCallUsd[k] ?? 0.045, 0, 10);
      }
    }

    return {
      usdToUah: sanitizePositiveFloat(parsed.usdToUah, DEFAULT_AI_RATES_CONFIG.usdToUah, 1, 500),
      textModels,
      imagePerCallUsd,
      elevenLabsPer1kCharsUsd: sanitizePositiveFloat(
        parsed.elevenLabsPer1kCharsUsd,
        DEFAULT_AI_RATES_CONFIG.elevenLabsPer1kCharsUsd,
        0,
        50
      ),
      updatedAt: parsed.updatedAt || DEFAULT_AI_RATES_CONFIG.updatedAt,
    };
  } catch {
    return DEFAULT_AI_RATES_CONFIG;
  }
}

export function saveAiRatesConfig(input: Partial<AiRatesConfig>): AiRatesConfig {
  const cur = getAiRatesConfig();
  const textModels = { ...cur.textModels };
  if (input.textModels) {
    for (const [model, rates] of Object.entries(input.textModels)) {
      const def = textModels[model] || textModels.default;
      textModels[model] = {
        inputPer1M: sanitizePositiveFloat(rates?.inputPer1M, def.inputPer1M, 0, 500),
        outputPer1M: sanitizePositiveFloat(rates?.outputPer1M, def.outputPer1M, 0, 500),
      };
    }
  }

  const imagePerCallUsd = { ...cur.imagePerCallUsd };
  if (input.imagePerCallUsd) {
    for (const [k, v] of Object.entries(input.imagePerCallUsd)) {
      imagePerCallUsd[k] = sanitizePositiveFloat(v, imagePerCallUsd[k] ?? 0.045, 0, 10);
    }
  }

  const saved: AiRatesConfig = {
    usdToUah: sanitizePositiveFloat(input.usdToUah, cur.usdToUah, 1, 500),
    textModels,
    imagePerCallUsd,
    elevenLabsPer1kCharsUsd: sanitizePositiveFloat(
      input.elevenLabsPer1kCharsUsd,
      cur.elevenLabsPer1kCharsUsd,
      0,
      50
    ),
    updatedAt: new Date().toISOString(),
  };
  setAppState(KEY_AI_RATES, JSON.stringify(saved));
  return saved;
}
