import type { MetadataRoute } from "next";
import { localizeHref } from "@/lib/locale";
import {
  BLOG_ARTICLES,
  BLOG_HUBS,
  LEGAL_PAGES,
  SERVICE_CATALOG,
} from "@/lib/site-content";

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "https://videovitannya.com.ua"
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const routes = [
    "/",
    "/tsiny",
    ...SERVICE_CATALOG.map((item) => `/${item.slug}`),
    ...Object.keys(LEGAL_PAGES).map((slug) => `/${slug}`),
    "/blog",
    ...BLOG_HUBS.map((hub) => `/blog/${hub.slug}`),
    ...BLOG_ARTICLES.map((article) => `/blog/${article.hub}/${article.slug}`),
  ];

  const entries: MetadataRoute.Sitemap = [];
  for (const route of routes) {
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
