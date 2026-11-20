import { revalidatePath } from "next/cache";

let cacheVersion = 0;

export function getCmsContentCacheVersion(): number {
  return cacheVersion;
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
