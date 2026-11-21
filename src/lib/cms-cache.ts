import { revalidatePath } from "next/cache";

interface CacheVersions {
  content: number;
  pricing: number;
  limits: number;
  aiRates: number;
  aiConfig: number;
  storybookConfig: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __videovitannyaCacheVersions: CacheVersions | undefined;
}

function getVersions(): CacheVersions {
  if (!globalThis.__videovitannyaCacheVersions) {
    globalThis.__videovitannyaCacheVersions = {
      content: 0,
      pricing: 0,
      limits: 0,
      aiRates: 0,
      aiConfig: 0,
      storybookConfig: 0,
    };
  }
  if (typeof globalThis.__videovitannyaCacheVersions.storybookConfig !== "number") {
    globalThis.__videovitannyaCacheVersions.storybookConfig = 0;
  }
  return globalThis.__videovitannyaCacheVersions;
}

export function getCmsContentCacheVersion(): number {
  return getVersions().content;
}

export function getPricingCacheVersion(): number {
  return getVersions().pricing;
}

export function getLimitsCacheVersion(): number {
  return getVersions().limits;
}

export function getAiRatesCacheVersion(): number {
  return getVersions().aiRates;
}

export function getAiConfigCacheVersion(): number {
  return getVersions().aiConfig;
}

export function getStorybookConfigCacheVersion(): number {
  return getVersions().storybookConfig;
}

export function invalidatePricingCache(): void {
  getVersions().pricing += 1;
}

export function invalidateLimitsCache(): void {
  getVersions().limits += 1;
}

export function invalidateAiRatesCache(): void {
  getVersions().aiRates += 1;
}

export function invalidateAiConfigCache(): void {
  getVersions().aiConfig += 1;
}

export function invalidateStorybookConfigCache(): void {
  getVersions().storybookConfig += 1;
}

export function invalidateCmsContentCache(paths: string[] = []): void {
  getVersions().content += 1;
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch {
      // Safe no-op outside Next.js request lifecycle (e.g., CLI seed scripts)
    }
  }
}
