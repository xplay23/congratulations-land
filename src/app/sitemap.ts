import type { MetadataRoute } from "next";
import { localizeHref } from "@/lib/locale";
import {
  getCmsBlogCategories,
  getCmsPages,
  getCmsPosts,
  getCmsServices,
} from "@/lib/cms-content";
import { LEGAL_PAGES } from "@/lib/site-content";

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "https://videovitannya.com.ua"
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [services, pages, categories, posts] = await Promise.all([
    getCmsServices("uk"),
    getCmsPages("uk"),
    getCmsBlogCategories("uk"),
    getCmsPosts("uk"),
  ]);

  const pageRoutes =
    pages.length > 0
      ? pages.map((p) => `/${p.slug}`)
      : ["/tsiny", ...Object.keys(LEGAL_PAGES).map((slug) => `/${slug}`)];

  const routeSet = new Set<string>([
    "/",
    ...pageRoutes,
    ...services
      .filter((s) => s.status !== "hidden")
      .map((item) => `/${item.slug}`),
    "/blog",
    ...categories.map((hub) => `/blog/${hub.slug}`),
    ...posts.map((article) => `/blog/${article.hubSlug}/${article.slug}`),
  ]);

  const entries: MetadataRoute.Sitemap = [];
  for (const route of routeSet) {
    const ukUrl = `${siteUrl}${localizeHref(route, "uk")}`;
    const ruUrl = `${siteUrl}${localizeHref(route, "ru")}`;
    const languages = {
      uk: ukUrl,
      "ru-UA": ruUrl,
      ru: ruUrl,
      "x-default": ukUrl,
    };

    entries.push({
      url: ukUrl,
      changeFrequency: route === "/" ? "daily" : "weekly",
      priority: route === "/" ? 1 : 0.8,
      alternates: { languages },
    });
    entries.push({
      url: ruUrl,
      changeFrequency: route === "/" ? "daily" : "weekly",
      priority: route === "/" ? 0.9 : 0.7,
      alternates: { languages },
    });
  }

  return entries;
}
