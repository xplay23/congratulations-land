import type { Metadata } from "next";
import { headers } from "next/headers";
import { localizeHref } from "./locale";
import {
  BLOG_ARTICLES,
  BLOG_HUBS,
  LEGAL_PAGES,
  getServiceLandingBySlug,
  type LegalPageItem,
} from "./site-content";
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

  const title =
    locale === "ru"
      ? "VideoVitannya — Персональные видеопоздравления и сказки PDF"
      : "VideoVitannya — Персональні відеопривітання та казки PDF";
  const description =
    locale === "ru"
      ? "Платформа персонализированных цифровых подарков для детей и взрослых: именные видео от Святого Николая и иллюстрированные сказки в PDF."
      : "Платформа персоналізованих цифрових подарунків для дітей і дорослих: іменні відео від Святого Миколая та ілюстровані казки в PDF.";

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
  const item = getServiceLandingBySlug(slug);
  if (!item) {
    return { title: "VideoVitannya" };
  }
  return {
    title: item.seoTitle[locale],
    description: item.seoDescription[locale],
    alternates: buildAlternates(`/${item.slug}`, locale),
    openGraph: {
      title: item.seoTitle[locale],
      description: item.seoDescription[locale],
      images: [item.previewImage],
    },
  };
}

export async function makeLegalMetadata(
  slug: LegalPageItem["slug"]
): Promise<Metadata> {
  const locale = await getServerLocale();
  const doc = LEGAL_PAGES[slug];
  return {
    title: doc.title[locale],
    description: doc.description[locale],
    alternates: buildAlternates(`/${doc.slug}`, locale),
  };
}

export async function makePricingMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
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

export async function makeBlogIndexMetadata(hubSlug?: string): Promise<Metadata> {
  const locale = await getServerLocale();
  if (hubSlug) {
    const hub = BLOG_HUBS.find((h) => h.slug === hubSlug);
    if (!hub) return { title: "Блог | VideoVitannya" };
    return {
      title: `${hub.title[locale]} | VideoVitannya`,
      description: hub.description[locale],
      alternates: buildAlternates(`/blog/${hub.slug}`, locale),
    };
  }
  return {
    title:
      locale === "ru"
        ? "Блог о поздравлениях: идеи, тексты, видео | VideoVitannya"
        : "Блог про привітання: ідеї, тексти, відео | VideoVitannya",
    description:
      locale === "ru"
        ? "Идеи для личных поздравлений, тексты ко Дню Святого Николая и советы по выбору подарков для детей и близких."
        : "Ідеї для особистих привітань, тексти до Дня Святого Миколая та поради щодо подарунків для дітей і близьких.",
    alternates: buildAlternates("/blog", locale),
  };
}

export async function makeBlogArticleMetadata(
  hubSlug: string,
  slug: string
): Promise<Metadata> {
  const locale = await getServerLocale();
  const article = BLOG_ARTICLES.find((a) => a.hub === hubSlug && a.slug === slug);
  if (!article) {
    return {
      title:
        locale === "ru" ? "Статья | VideoVitannya" : "Стаття | VideoVitannya",
    };
  }
  return {
    title: `${article.title[locale]} | VideoVitannya`,
    description: article.description[locale],
    alternates: buildAlternates(`/blog/${article.hub}/${article.slug}`, locale),
  };
}
