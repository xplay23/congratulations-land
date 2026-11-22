interface ModelsCacheEntry {
  models: string[];
  source: "api" | "fallback";
  note?: string;
  expiresAt: number;
}

const modelsCache = new Map<string, ModelsCacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;

export function getCached(key: string): ModelsCacheEntry | null {
  const entry = modelsCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    modelsCache.delete(key);
    return null;
  }
  return entry;
}

export function setCached(
  key: string,
  data: { models: string[]; source: "api" | "fallback"; note?: string }
): void {
  modelsCache.set(key, { ...data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateModelsCache(): void {
  modelsCache.clear();
}
