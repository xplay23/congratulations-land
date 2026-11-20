import type { Lang } from "./types";

const UNLOCALIZED_PREFIXES = [
  "/api",
  "/_next",
  "/admin",
  "/assets",
  "/samples",
  "/media",
];

const UNLOCALIZED_EXACT = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

/**
 * Strips leading `/ru` or `/uk` locale prefix from a URL pathname.
 */
export function stripLocalePrefix(pathname: string): string {
  const clean = pathname.replace(/^\/(ru|uk)(?=\/|$)/, "");
  return clean || "/";
}

/**
 * Resolves active locale from a URL pathname (`ru` for `/ru` or `/ru/...`, otherwise `uk`).
 */
export function getLocaleFromPathname(pathname: string): Lang {
  return pathname === "/ru" || pathname.startsWith("/ru/") ? "ru" : "uk";
}

/**
 * Returns true for API, static asset, and internal admin routes that never take a locale prefix.
 */
export function isUnlocalizedPath(pathname: string): boolean {
  if (UNLOCALIZED_EXACT.has(pathname)) return true;
  if (
    UNLOCALIZED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

/**
 * Converts an internal href to the target locale URL while preserving query strings and hashes.
 * Ukrainian stays unprefixed at root; Russian uses `/ru/...`.
 */
export function localizeHref(href: string, lang: Lang): string {
  if (!href || !href.startsWith("/") || href.startsWith("//")) {
    return href;
  }

  const hashIdx = href.indexOf("#");
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : "";
  const beforeHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href;

  const queryIdx = beforeHash.indexOf("?");
  const query = queryIdx >= 0 ? beforeHash.slice(queryIdx) : "";
  const rawPath = queryIdx >= 0 ? beforeHash.slice(0, queryIdx) : beforeHash;

  const cleanPath = stripLocalePrefix(rawPath || "/");
  if (isUnlocalizedPath(cleanPath)) {
    return `${cleanPath}${query}${hash}`;
  }

  if (lang === "ru") {
    const localizedPath = cleanPath === "/" ? "/ru" : `/ru${cleanPath}`;
    return `${localizedPath}${query}${hash}`;
  }

  return `${cleanPath}${query}${hash}`;
}
