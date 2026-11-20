import { revalidatePath } from "next/cache";

let cacheVersion = 0;
let pricingCacheVersion = 0;
let limitsCacheVersion = 0;
let aiRatesCacheVersion = 0;

export function getCmsContentCacheVersion(): number {
  return cacheVersion;
}

export function getPricingCacheVersion(): number {
  return pricingCacheVersion;
}

export function getLimitsCacheVersion(): number {
  return limitsCacheVersion;
}

export function getAiRatesCacheVersion(): number {
  return aiRatesCacheVersion;
}

export function invalidatePricingCache(): void {
  pricingCacheVersion += 1;
}

export function invalidateLimitsCache(): void {
  limitsCacheVersion += 1;
}

export function invalidateAiRatesCache(): void {
  aiRatesCacheVersion += 1;
}

export function invalidateCmsContentCache(paths: string[] = []): void {
  cacheVersion += 1;
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch {
      // Safe no-op outside Next.js request lifecycle (e.g., CLI seed scripts)
    }
  }
}
