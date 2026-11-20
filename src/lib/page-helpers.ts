import type { Metadata } from "next";
import { headers } from "next/headers";
import { localizeHref } from "./locale";
import {
  getCmsBlogCategories,
  getCmsHomeTemplate,
  getCmsPageBySlug,
  getCmsPostBySlug,
  getCmsServiceBySlug,
} from "./cms-content";
import { LEGAL_PAGES, type LegalPageItem } from "./site-content";
import type { Lang } from "./types";

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "https://videovitannya.com.ua"
  );
}

export async function getServerLocale(): Promise<Lang> {
  const h = await headers();
  return h.get("x-locale") === "ru" ? "ru" : "uk";
}

export function buildAlternates(canonicalPath: string, locale: Lang) {
  const siteUrl = getSiteUrl();
  const ukUrl = `${siteUrl}${localizeHref(canonicalPath, "uk")}`;
  const ruUrl = `${siteUrl}${localizeHref(canonicalPath, "ru")}`;

  return {
    canonical: locale === "ru" ? ruUrl : ukUrl,
    languages: {
      uk: ukUrl,
      "ru-UA": ruUrl,
      ru: ruUrl,
      "x-default": ukUrl,
    },
  };
}

export async function makeHomeMetadata(): Promise<Metadata> {
  const h = await headers();
  const locale: Lang = h.get("x-locale") === "ru" ? "ru" : "uk";
  const canonicalPath = h.get("x-canonical-path") || "/";
  const homeTpl = await getCmsHomeTemplate(locale);

  const title =
    homeTpl.seoTitle ||
    (locale === "ru"
      ? "VideoVitannya — Персональные видеопоздравления и сказки PDF"
      : "VideoVitannya — Персональні відеопривітання та казки PDF");
  const description =
    homeTpl.seoDescription ||
    (locale === "ru"
      ? "Платформа персонализированных цифровых подарков для детей и взрослых: именные видео от Святого Николая и иллюстрированные сказки в PDF."
      : "Платформа персоналізованих цифрових подарунків для дітей і дорослих: іменні відео від Святого Миколая та ілюстровані казки в PDF.");

  return {
    title,
    description,
    icons: {
      icon: "/assets/video-gift.svg",
    },
    ...(canonicalPath === "/"
      ? { alternates: buildAlternates("/", locale) }
      : {}),
  };
}

export async function makeServiceMetadata(slug: string): Promise<Metadata> {
  const locale = await getServerLocale();
  const item = await getCmsServiceBySlug(slug, locale);
  if (!item) {
    return { title: "VideoVitannya" };
  }
  return {
    title: item.seoTitle,
    description: item.seoDescription,
    alternates: buildAlternates(`/${item.slug}`, locale),
    openGraph: {
      title: item.seoTitle,
      description: item.seoDescription,
      images: [item.coverImageUrl],
    },
  };
}

export async function makeCmsPageMetadata(slug: string): Promise<Metadata> {
  const locale = await getServerLocale();
  const page = await getCmsPageBySlug(slug, locale);
  if (!page) return { title: "VideoVitannya" };
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: buildAlternates(`/${page.slug}`, locale),
  };
}

export async function makeLegalMetadata(
  slug: LegalPageItem["slug"]
): Promise<Metadata> {
  const locale = await getServerLocale();
  const page = await getCmsPageBySlug(slug, locale);
  if (page) {
    return {
      title: page.seoTitle,
      description: page.seoDescription,
      alternates: buildAlternates(`/${page.slug}`, locale),
    };
  }
  const doc = LEGAL_PAGES[slug];
  return {
    title: doc.title[locale],
    description: doc.description[locale],
    alternates: buildAlternates(`/${doc.slug}`, locale),
  };
}

export async function makePricingMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const page = await getCmsPageBySlug("tsiny", locale);
  if (page) {
    return {
      title: page.seoTitle,
      description: page.seoDescription,
      alternates: buildAlternates("/tsiny", locale),
    };
  }
  return {
    title:
      locale === "ru"
        ? "Цены на видеопоздравления от Святого Николая и именные сказки PDF | VideoVitannya"
        : "Ціни на відеопривітання від Святого Миколая та іменні казки PDF | VideoVitannya",
    description:
      locale === "ru"
        ? "Актуальные цены на персональные видеопоздравления от Святого Николая и иллюстрированные сказки PDF. Разовая оплата без подписки с превью до оплаты."
        : "Актуальні ціни на персональні відеопривітання від Святого Миколая та ілюстровані казки PDF. Разова оплата без підписки з прев’ю до оплати.",
    alternates: buildAlternates("/tsiny", locale),
  };
}

export async function makeBlogIndexMetadata(
  hubSlug?: string
): Promise<Metadata> {
  const locale = await getServerLocale();
  if (hubSlug) {
    const categories = await getCmsBlogCategories(locale);
    const hub = categories.find((h) => h.slug === hubSlug);
    if (!hub) return { title: "Блог | VideoVitannya" };
    return {
      title: `${hub.title} | VideoVitannya`,
      description: hub.description,
      alternates: buildAlternates(`/blog/${hub.slug}`, locale),
    };
  }
  return {
    title:
      locale === "ru"
        ? "Блог про поздравления и сказки | VideoVitannya"
        : "Блог про привітання та казки | VideoVitannya",
    description:
      locale === "ru"
        ? "Идеи, тёплые слова и советы для создания личных видеопоздравлений, именных сказок и подарков близким."
        : "Ідеї, теплі слова й поради для створення особистих відеопривітань, іменних казок та подарунків близьким.",
    alternates: buildAlternates("/blog", locale),
  };
}

export async function makeBlogArticleMetadata(
  hubSlug: string,
  slug: string
): Promise<Metadata> {
  const locale = await getServerLocale();
  const article = await getCmsPostBySlug(hubSlug, slug, locale);
  if (!article) return { title: "Блог | VideoVitannya" };
  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: buildAlternates(`/blog/${article.hubSlug}/${article.slug}`, locale),
    ...(article.coverImageUrl
      ? { openGraph: { images: [article.coverImageUrl] } }
      : {}),
  };
}
