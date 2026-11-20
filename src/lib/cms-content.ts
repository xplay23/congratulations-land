import { getPayload } from "@engine/lib/payload";
import { getCmsContentCacheVersion } from "@/lib/cms-cache";
import { lexicalToHtmlString } from "@/lib/lexical-render";
import { DEFAULT_PRICING_CONFIG } from "@/lib/pricing-defaults";
import {
  BLOG_ARTICLES,
  BLOG_HUBS,
  DEMO_STORYBOOKS,
  DEMO_VIDEOS,
  SERVICE_CATALOG,
  type DemoStorybookItem,
  type DemoVideoItem,
} from "@/lib/site-content";
import type { ArtStyle, Lang, LayoutMode, ServiceId } from "@/lib/types";

export interface CmsPricingTier {
  key: string;
  label: string;
  priceUah: number;
  isPopular?: boolean;
}

export interface CmsServiceSection {
  title: string;
  text?: string;
  steps?: string[];
  includePriceNote?: boolean;
  priceLink?: boolean;
}

export interface CmsReviewItem {
  id: string;
  reviewType: "text" | "instagram";
  authorName: string;
  authorLocation: string;
  quote: string;
  rating: number;
  photoUrl?: string;
  instagramUrl?: string;
  instagramEmbedHtml?: string;
  instagramScreenshotUrl?: string;
  serviceSlug?: string;
  publishedDate?: string;
}

export type CmsBlock =
  | {
      id: string;
      blockType: "hero";
      badge?: string;
      heading: string;
      subtitle?: string;
      showQuickPicker: boolean;
    }
  | {
      id: string;
      blockType: "live-demos";
      eyebrow?: string;
      heading?: string;
      defaultTab: "video" | "storybook";
    }
  | {
      id: string;
      blockType: "services-catalog";
      heading?: string;
      subtitle?: string;
      showUpcoming: boolean;
    }
  | {
      id: string;
      blockType: "pricing-table";
      includedHeading?: string;
      includedSubtitle?: string;
      includedBullets: string[];
    }
  | {
      id: string;
      blockType: "steps";
      heading?: string;
      columns: 3 | 4;
      steps: Array<{ title: string; description: string }>;
    }
  | {
      id: string;
      blockType: "privacy-trust";
      title: string;
      text: string;
      href: string;
    }
  | {
      id: string;
      blockType: "reviews";
      eyebrow?: string;
      heading?: string;
      mode: "all" | "selected";
      limit: number;
      reviews: CmsReviewItem[];
    }
  | {
      id: string;
      blockType: "faq";
      heading?: string;
      subtitle?: string;
      layout: "accordion" | "all-open";
      items: Array<{ question: string; answer: string }>;
    }
  | {
      id: string;
      blockType: "text";
      heading?: string;
      contentHtml: string;
      showCookieSettingsButton: boolean;
    }
  | {
      id: string;
      blockType: "blog-grid";
      heading?: string;
      viewAllLabel?: string;
      limit: number;
    }
  | {
      id: string;
      blockType: "cta";
      heading: string;
      subtitle?: string;
      buttonLabel: string;
      buttonHref: string;
    }
  | {
      id: string;
      blockType: "spacer";
      size: "sm" | "md" | "lg";
    }
  | {
      id: string;
      blockType: "banner";
      content: string;
      style: "info" | "success" | "warning" | "promo";
      ctaLabel?: string;
      ctaUrl?: string;
      dismissible: boolean;
      spacing?: string;
    }
  | {
      id: string;
      blockType: "features";
      heading?: string;
      style: "cards" | "list" | "icons-only";
      columns: 2 | 3 | 4;
      useBackground: boolean;
      items: Array<{
        title: string;
        description?: string;
        imageUrl?: string;
        icon?: string;
        iconColor?: string;
      }>;
      spacing?: string;
    }
  | {
      id: string;
      blockType: "icon-list";
      heading?: string;
      columns: 1 | 2;
      useBackground: boolean;
      items: Array<{ text: string; icon?: string; iconColor?: string }>;
      spacing?: string;
    }
  | {
      id: string;
      blockType: "logos";
      heading?: string;
      grayscale: boolean;
      items: Array<{ label?: string; logoUrl: string; url?: string }>;
      spacing?: string;
    }
  | {
      id: string;
      blockType: "stats";
      heading?: string;
      items: Array<{ value: string; label: string; description?: string }>;
      spacing?: string;
    }
  | {
      id: string;
      blockType: "text-image";
      heading?: string;
      contentHtml: string;
      imageUrl: string;
      imagePosition: "left" | "right";
      ctaLabel?: string;
      ctaUrl?: string;
      spacing?: string;
    }
  | {
      id: string;
      blockType: "video";
      heading?: string;
      embedUrl?: string;
      fileUrl?: string;
      aspectRatio: "16:9" | "4:3" | "1:1";
      autoplay: boolean;
      caption?: string;
      spacing?: string;
    }
  | {
      id: string;
      blockType: "manifesto";
      heading: string;
      contentHtml: string;
      background: "default" | "dark" | "primary";
      alignment: "left" | "center";
      spacing?: string;
    }
  | {
      id: string;
      blockType: "pricing-cards";
      heading?: string;
      subheading?: string;
      items: Array<{
        name: string;
        price: string;
        period?: string;
        description?: string;
        features: Array<{ text: string; included: boolean }>;
        ctaLabel: string;
        ctaUrl: string;
        highlighted: boolean;
      }>;
      spacing?: string;
    }
  | {
      id: string;
      blockType: "payment-logos";
      heading?: string;
      align: "left" | "center" | "right";
      items: Array<{ preset: string; label: string }>;
      spacing?: string;
    };

export interface CmsServiceItem {
  id: string;
  slug: string;
  serviceKey: ServiceId | "custom";
  status: "active" | "coming_soon" | "hidden";
  sortOrder: number;
  ctaOrderUrl?: string;
  showcaseKind: "video" | "storybook" | "none";
  coverImageUrl: string;
  previewIsConcept: boolean;
  basePriceUah: number;
  pricingTiers: CmsPricingTier[];
  title: string;
  label: string;
  badge: string;
  shortDescription: string;
  ctaLabel: string;
  features: string[];
  h1: string;
  intro: string;
  heroFootnote: string;
  sections: CmsServiceSection[];
  extraBlocks: CmsBlock[];
  relatedSlugs: string[];
  seoTitle: string;
  seoDescription: string;
}

export interface CmsServiceVariationItem {
  id: string;
  variationSlug: string;
  serviceSlug: string;
  enabled: boolean;
  isDefault: boolean;
  sortOrder: number;
  priceOverrideUah?: number | null;
  title: string;
  shortBadge: string;
  description: string;
  posterUrl: string;
  demoVideoUrl: string;
  pipelineTemplateId: string;
  elevenLabsVoiceIdOverride?: string;
  line03Uk?: string;
  line03Ru?: string;
  line04bUk?: string;
  line04bRu?: string;
  line07Uk?: string;
  line07Ru?: string;
}

export interface CmsBlogCategoryItem {
  id: string;
  slug: string;
  label: string;
  title: string;
  h1: string;
  description: string;
  targetServiceSlug?: string;
}

export interface CmsBlogPostItem {
  id: string;
  slug: string;
  hubSlug: string;
  hubLabel: string;
  title: string;
  excerpt: string;
  lead: string;
  contentHtml: string;
  sectionsFallback?: Array<{ title: string; text: string }>;
  publishedAt: string;
  readTime: string;
  coverImageUrl?: string;
  authorName?: string;
  authorRole?: string;
  tags: string[];
  ctaServiceSlug?: string;
  seoTitle: string;
  seoDescription: string;
}

export interface CmsPageItem {
  id: string;
  slug: string;
  status: "published" | "draft";
  title: string;
  eyebrow?: string;
  h1: string;
  subtitle?: string;
  sections: CmsBlock[];
  seoTitle: string;
  seoDescription: string;
}

export interface CmsHomeTemplateData {
  sections: CmsBlock[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface CmsNavItem {
  label: string;
  href: string;
  icon: "none" | "video" | "book" | "orders" | "sparkles";
  serviceKey?: ServiceId | "none";
  openInNewTab?: boolean;
  children?: CmsNavItem[];
}

export interface CmsFooterColumn {
  heading: string;
  links: Array<{ label: string; href: string; openInNewTab?: boolean }>;
}

export interface CmsSocialLink {
  platform: string;
  label?: string;
  url: string;
}

export interface CmsSiteShell {
  siteName: string;
  tagline: string;
  logoUrl: string;
  showSiteNameWithLogo: boolean;
  contactEmail?: string;
  contactPhone?: string;
  footerTextHtml: string;
  copyrightTextHtml: string;
  socialLinks: CmsSocialLink[];
  headerItems: CmsNavItem[];
  footerColumns: CmsFooterColumn[];
  footerLegalLinks: Array<{ label: string; href: string }>;
}

// ── Simple short-lived in-memory cache invalidated by Payload hooks ──────────

interface CacheEntry<T> {
  version: number;
  expiresAt: number;
  value: T;
}

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, CacheEntry<unknown>>();

async function withCache<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const version = getCmsContentCacheVersion();
  const now = Date.now();
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.version === version && hit.expiresAt > now) {
    return hit.value;
  }
  const value = await loader();
  cache.set(key, { version, expiresAt: now + CACHE_TTL_MS, value });
  return value;
}

function resolveMediaUrl(val: unknown, fallback = ""): string {
  if (val && typeof val === "object") {
    const url = (val as { url?: unknown }).url;
    if (typeof url === "string" && url.trim()) return url.trim();
  }
  return fallback;
}

function relSlug(val: unknown): string | undefined {
  if (val && typeof val === "object") {
    const slug = (val as { slug?: unknown }).slug;
    if (typeof slug === "string" && slug.trim()) return slug.trim();
  }
  return undefined;
}

function asString(val: unknown, fallback = ""): string {
  return typeof val === "string" && val.trim() ? val.trim() : fallback;
}

function mapReviewDoc(doc: Record<string, unknown>): CmsReviewItem {
  const reviewType = doc.reviewType === "instagram" ? "instagram" : "text";
  return {
    id: String(doc.id ?? ""),
    reviewType,
    authorName: asString(doc.authorName),
    authorLocation: asString(doc.authorLocation),
    quote: asString(doc.quote),
    rating: Math.max(1, Math.min(5, Number(doc.rating ?? 5))),
    photoUrl: resolveMediaUrl(doc.photo) || undefined,
    instagramUrl: asString(doc.instagramUrl) || undefined,
    instagramEmbedHtml: asString(doc.instagramEmbedHtml) || undefined,
    instagramScreenshotUrl:
      resolveMediaUrl(doc.instagramScreenshot) || undefined,
    serviceSlug: relSlug(doc.service),
    publishedDate: asString(doc.publishedDate) || undefined,
  };
}

function mapRawBlocks(
  rawBlocks: unknown,
  allReviews: CmsReviewItem[]
): CmsBlock[] {
  if (!Array.isArray(rawBlocks)) return [];
  const out: CmsBlock[] = [];

  for (let idx = 0; idx < rawBlocks.length; idx++) {
    const raw = rawBlocks[idx] as Record<string, unknown> | null;
    if (!raw || typeof raw !== "object") continue;
    const blockType = String(raw.blockType || "");
    const id = String(raw.id || `${blockType}-${idx}`);

    switch (blockType) {
      case "hero":
        out.push({
          id,
          blockType: "hero",
          badge: asString(raw.badge) || undefined,
          heading: asString(raw.heading),
          subtitle: asString(raw.subtitle) || undefined,
          showQuickPicker: raw.showQuickPicker !== false,
        });
        break;
      case "live-demos":
        out.push({
          id,
          blockType: "live-demos",
          eyebrow: asString(raw.eyebrow) || undefined,
          heading: asString(raw.heading) || undefined,
          defaultTab: raw.defaultTab === "storybook" ? "storybook" : "video",
        });
        break;
      case "services-catalog":
        out.push({
          id,
          blockType: "services-catalog",
          heading: asString(raw.heading) || undefined,
          subtitle: asString(raw.subtitle) || undefined,
          showUpcoming: raw.showUpcoming !== false,
        });
        break;
      case "pricing-table":
        out.push({
          id,
          blockType: "pricing-table",
          includedHeading: asString(raw.includedHeading) || undefined,
          includedSubtitle: asString(raw.includedSubtitle) || undefined,
          includedBullets: Array.isArray(raw.includedBullets)
            ? (raw.includedBullets as Array<Record<string, unknown>>)
                .map((b) => asString(b.text))
                .filter(Boolean)
            : [],
        });
        break;
      case "steps":
        out.push({
          id,
          blockType: "steps",
          heading: asString(raw.heading) || undefined,
          columns: raw.columns === "3" ? 3 : 4,
          steps: Array.isArray(raw.steps)
            ? (raw.steps as Array<Record<string, unknown>>)
                .map((s) => ({
                  title: asString(s.title),
                  description: asString(s.description),
                }))
                .filter((s) => s.title || s.description)
            : [],
        });
        break;
      case "privacy-trust":
        out.push({
          id,
          blockType: "privacy-trust",
          title: asString(raw.title),
          text: asString(raw.text),
          href: asString(raw.href, "/konfidentsiynist"),
        });
        break;
      case "reviews": {
        const mode = raw.mode === "selected" ? "selected" : "all";
        const limit = Math.max(1, Math.min(24, Number(raw.limit ?? 4)));
        let resolvedReviews: CmsReviewItem[] = [];
        if (mode === "selected" && Array.isArray(raw.selectedReviews)) {
          for (const entry of raw.selectedReviews) {
            if (entry && typeof entry === "object") {
              const mapped = mapReviewDoc(entry as Record<string, unknown>);
              if (mapped.authorName || mapped.instagramUrl) {
                resolvedReviews.push(mapped);
              }
            } else if (entry !== null && entry !== undefined) {
              const found = allReviews.find((r) => r.id === String(entry));
              if (found) resolvedReviews.push(found);
            }
          }
        } else {
          resolvedReviews = allReviews.slice(0, limit);
        }
        out.push({
          id,
          blockType: "reviews",
          eyebrow: asString(raw.eyebrow) || undefined,
          heading: asString(raw.heading) || undefined,
          mode,
          limit,
          reviews: resolvedReviews,
        });
        break;
      }
      case "faq":
        out.push({
          id,
          blockType: "faq",
          heading: asString(raw.heading) || undefined,
          subtitle: asString(raw.subtitle) || undefined,
          layout: raw.layout === "all-open" ? "all-open" : "accordion",
          items: Array.isArray(raw.items)
            ? (raw.items as Array<Record<string, unknown>>)
                .map((it) => ({
                  question: asString(it.question),
                  answer: asString(it.answer),
                }))
                .filter((it) => it.question && it.answer)
            : [],
        });
        break;
      case "text":
        out.push({
          id,
          blockType: "text",
          heading: asString(raw.heading) || undefined,
          contentHtml: lexicalToHtmlString(raw.content),
          showCookieSettingsButton: Boolean(raw.showCookieSettingsButton),
        });
        break;
      case "blog-grid":
        out.push({
          id,
          blockType: "blog-grid",
          heading: asString(raw.heading) || undefined,
          viewAllLabel: asString(raw.viewAllLabel) || undefined,
          limit: Math.max(1, Math.min(12, Number(raw.limit ?? 3))),
        });
        break;
      case "cta":
        out.push({
          id,
          blockType: "cta",
          heading: asString(raw.heading),
          subtitle: asString(raw.subtitle) || undefined,
          buttonLabel: asString(raw.buttonLabel),
          buttonHref: asString(raw.buttonHref, "#gifts"),
        });
        break;
      case "spacer":
        out.push({
          id,
          blockType: "spacer",
          size:
            raw.size === "sm" || raw.size === "lg" ? raw.size : "md",
        });
        break;

      case "banner": {
        const cta = (raw.ctaButton as Record<string, unknown> | undefined) ?? {};
        const style = asString(raw.style, "promo");
        out.push({
          id,
          blockType: "banner",
          content: asString(raw.content),
          style:
            style === "info" || style === "success" || style === "warning"
              ? style
              : "promo",
          ctaLabel: cta.enabled ? asString(cta.label) || undefined : undefined,
          ctaUrl: cta.enabled ? asString(cta.url) || undefined : undefined,
          dismissible: Boolean(raw.dismissible),
          spacing: asString(raw.spacing) || undefined,
        });
        break;
      }

      case "features": {
        const style = asString(raw.style, "cards");
        const cols = Number(raw.columns ?? 3);
        out.push({
          id,
          blockType: "features",
          heading: asString(raw.heading) || undefined,
          style: style === "list" || style === "icons-only" ? style : "cards",
          columns: cols === 2 || cols === 4 ? cols : 3,
          useBackground: raw.useBackground !== false,
          items: Array.isArray(raw.items)
            ? (raw.items as Array<Record<string, unknown>>)
                .map((it) => ({
                  title: asString(it.title),
                  description: asString(it.description) || undefined,
                  imageUrl: resolveMediaUrl(it.image) || undefined,
                  icon: asString(it.icon) || undefined,
                  iconColor: asString(it.iconColor) || undefined,
                }))
                .filter((it) => it.title)
            : [],
          spacing: asString(raw.spacing) || undefined,
        });
        break;
      }

      case "icon-list":
        out.push({
          id,
          blockType: "icon-list",
          heading: asString(raw.heading) || undefined,
          columns: Number(raw.columns) === 2 ? 2 : 1,
          useBackground: Boolean(raw.useBackground),
          items: Array.isArray(raw.items)
            ? (raw.items as Array<Record<string, unknown>>)
                .map((it) => ({
                  text: asString(it.text),
                  icon: asString(it.icon) || undefined,
                  iconColor: asString(it.iconColor) || undefined,
                }))
                .filter((it) => it.text)
            : [],
          spacing: asString(raw.spacing) || undefined,
        });
        break;

      case "logos":
        out.push({
          id,
          blockType: "logos",
          heading: asString(raw.heading) || undefined,
          grayscale: raw.grayscale !== false,
          items: Array.isArray(raw.items)
            ? (raw.items as Array<Record<string, unknown>>)
                .map((it) => ({
                  label: asString(it.label) || undefined,
                  logoUrl: resolveMediaUrl(it.logo),
                  url: asString(it.url) || undefined,
                }))
                .filter((it) => it.logoUrl)
            : [],
          spacing: asString(raw.spacing) || undefined,
        });
        break;

      case "stats":
        out.push({
          id,
          blockType: "stats",
          heading: asString(raw.heading) || undefined,
          items: Array.isArray(raw.items)
            ? (raw.items as Array<Record<string, unknown>>)
                .map((it) => ({
                  value: asString(it.value),
                  label: asString(it.label),
                  description: asString(it.description) || undefined,
                }))
                .filter((it) => it.value && it.label)
            : [],
          spacing: asString(raw.spacing) || undefined,
        });
        break;

      case "text-image": {
        const cta = (raw.ctaButton as Record<string, unknown> | undefined) ?? {};
        out.push({
          id,
          blockType: "text-image",
          heading: asString(raw.heading) || undefined,
          contentHtml: lexicalToHtmlString(raw.content),
          imageUrl: resolveMediaUrl(raw.image),
          imagePosition: raw.imagePosition === "left" ? "left" : "right",
          ctaLabel: cta.enabled ? asString(cta.label) || undefined : undefined,
          ctaUrl: cta.enabled ? asString(cta.url) || undefined : undefined,
          spacing: asString(raw.spacing) || undefined,
        });
        break;
      }

      case "video": {
        const source = asString(raw.source, "youtube");
        const rawUrl = asString(raw.url);
        let embedUrl: string | undefined;
        if (source === "youtube" && rawUrl) {
          const m =
            rawUrl.match(
              /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
            ) || rawUrl.match(/^([a-zA-Z0-9_-]{11})$/);
          embedUrl = `https://www.youtube-nocookie.com/embed/${m ? m[1] : rawUrl}`;
        } else if (source === "vimeo" && rawUrl) {
          const m = rawUrl.match(/vimeo\.com\/(\d+)/);
          embedUrl = `https://player.vimeo.com/video/${m ? m[1] : rawUrl}`;
        }
        const ar = asString(raw.aspectRatio, "16:9");
        out.push({
          id,
          blockType: "video",
          heading: asString(raw.heading) || undefined,
          embedUrl,
          fileUrl:
            source === "upload" ? resolveMediaUrl(raw.file) || undefined : undefined,
          aspectRatio: ar === "4:3" || ar === "1:1" ? ar : "16:9",
          autoplay: Boolean(raw.autoplay),
          caption: asString(raw.caption) || undefined,
          spacing: asString(raw.spacing) || undefined,
        });
        break;
      }

      case "manifesto": {
        const bg = asString(raw.background, "dark");
        out.push({
          id,
          blockType: "manifesto",
          heading: asString(raw.heading),
          contentHtml: lexicalToHtmlString(raw.content),
          background: bg === "default" || bg === "primary" ? bg : "dark",
          alignment: raw.alignment === "center" ? "center" : "left",
          spacing: asString(raw.spacing) || undefined,
        });
        break;
      }

      case "pricing-cards":
        out.push({
          id,
          blockType: "pricing-cards",
          heading: asString(raw.heading) || undefined,
          subheading: asString(raw.subheading) || undefined,
          items: Array.isArray(raw.items)
            ? (raw.items as Array<Record<string, unknown>>)
                .map((it) => ({
                  name: asString(it.name),
                  price: asString(it.price),
                  period: asString(it.period) || undefined,
                  description: asString(it.description) || undefined,
                  features: Array.isArray(it.features)
                    ? (it.features as Array<Record<string, unknown>>)
                        .map((f) => ({
                          text: asString(f.text),
                          included: f.included !== false,
                        }))
                        .filter((f) => f.text)
                    : [],
                  ctaLabel: asString(it.ctaLabel),
                  ctaUrl: asString(it.ctaUrl, "#"),
                  highlighted: Boolean(it.highlighted),
                }))
                .filter((it) => it.name && it.price)
            : [],
          spacing: asString(raw.spacing) || undefined,
        });
        break;

      case "payment-logos": {
        const align = asString(raw.align, "left");
        out.push({
          id,
          blockType: "payment-logos",
          heading: asString(raw.heading) || undefined,
          align: align === "center" || align === "right" ? align : "left",
          items: Array.isArray(raw.items)
            ? (raw.items as Array<Record<string, unknown>>)
                .map((it) => ({
                  preset: asString(it.preset, "custom"),
                  label: asString(it.label),
                }))
                .filter((it) => it.preset !== "custom" || it.label)
            : [],
          spacing: asString(raw.spacing) || undefined,
        });
        break;
      }
    }
  }

  return out;
}

// ── Fallback mappers from static site-content.ts ─────────────────────────────

function fallbackServices(locale: Lang): CmsServiceItem[] {
  return SERVICE_CATALOG.map((item, idx) => {
    const pCfg = item.serviceId
      ? DEFAULT_PRICING_CONFIG.services[item.serviceId]
      : undefined;
    const tiers: CmsPricingTier[] = [];
    if (pCfg?.tiers) {
      for (const [k, v] of Object.entries(pCfg.tiers)) {
        tiers.push({
          key: k,
          label:
            item.serviceId === "storybook"
              ? locale === "uk"
                ? `${k} стор.`
                : `${k} стр.`
              : k,
          priceUah: v,
          isPopular: k === "6",
        });
      }
    }
    const status: CmsServiceItem["status"] =
      pCfg?.enabled === true
        ? "active"
        : item.comingSoonDefault || pCfg?.comingSoon
          ? "coming_soon"
          : "active";
    const extraBlocks: CmsBlock[] =
      item.faq.length > 0
        ? [
            {
              id: `${item.slug}-faq`,
              blockType: "faq",
              layout: "accordion",
              items: item.faq.map((f) => ({
                question: f.q[locale],
                answer: f.a[locale],
              })),
            },
          ]
        : [];
    return {
      id: item.slug,
      slug: item.slug,
      serviceKey: item.serviceId ?? "custom",
      status,
      sortOrder: (idx + 1) * 10,
      ctaOrderUrl: item.constructorHref,
      showcaseKind: item.showcaseKind ?? "none",
      coverImageUrl: item.previewImage,
      previewIsConcept: Boolean(item.previewIsConcept),
      basePriceUah: pCfg?.basePriceUah ?? item.fallbackPriceUah ?? 0,
      pricingTiers: tiers,
      title: pCfg?.title[locale] || item.label[locale],
      label: item.label[locale],
      badge: pCfg?.badgeLabel?.[locale] || item.tag[locale],
      shortDescription: pCfg?.description[locale] || item.short[locale],
      ctaLabel:
        pCfg?.ctaLabel?.[locale] ||
        (locale === "uk" ? "Замовити" : "Заказать"),
      features: pCfg?.features?.[locale] || [],
      h1: item.h1[locale],
      intro: item.intro[locale],
      heroFootnote: item.heroFootnote[locale],
      sections: item.sections.map((s) => ({
        title: s.title[locale],
        text: s.text?.[locale],
        steps: s.steps?.[locale],
        includePriceNote: s.includePriceNote,
        priceLink: s.priceLink,
      })),
      extraBlocks,
      relatedSlugs: item.relatedSlugs,
      seoTitle: item.seoTitle[locale],
      seoDescription: item.seoDescription[locale],
    };
  });
}

function fallbackCategories(locale: Lang): CmsBlogCategoryItem[] {
  return BLOG_HUBS.map((h) => ({
    id: h.slug,
    slug: h.slug,
    label: h.label[locale],
    title: h.title[locale],
    h1: h.h1[locale],
    description: h.description[locale],
    targetServiceSlug: h.targetServiceSlug,
  }));
}

function fallbackPosts(locale: Lang): CmsBlogPostItem[] {
  return BLOG_ARTICLES.map((a) => {
    const hub = BLOG_HUBS.find((h) => h.slug === a.hub);
    return {
      id: a.slug,
      slug: a.slug,
      hubSlug: a.hub,
      hubLabel: hub?.label[locale] || a.hub,
      title: a.title[locale],
      excerpt: a.description[locale],
      lead: a.lead[locale],
      contentHtml: "",
      sectionsFallback: a.sections.map((s) => ({
        title: s.title[locale],
        text: s.text[locale],
      })),
      publishedAt: a.updatedAt,
      readTime: a.readTime[locale],
      tags: [],
      ctaServiceSlug: a.ctaServiceSlug,
      seoTitle: `${a.title[locale]} | VideoVitannya`,
      seoDescription: a.description[locale],
    };
  });
}

function fallbackSiteShell(locale: Lang): CmsSiteShell {
  const isUk = locale === "uk";
  const footerServices = SERVICE_CATALOG.filter(
    (item) => item.slug !== "novyj-rik" && item.slug !== "multfilm-pro-dytynu"
  );

  return {
    siteName: "VideoVitannya",
    tagline: isUk
      ? "Персоналізовані цифрові подарунки • Україна"
      : "Персонализированные цифровые подарки • Украина",
    logoUrl: "/assets/video-gift.svg",
    showSiteNameWithLogo: true,
    footerTextHtml: isUk
      ? "<p>Для тих, хто дарує трохи більше, ніж подарунок. Іменні казки PDF та відеопривітання.</p>"
      : "<p>Для тех, кто дарит чуть больше, чем подарок. Именные сказки PDF и видеопоздравления.</p>",
    copyrightTextHtml: isUk
      ? "<p>© VideoVitannya · Персональні казки PDF та відеопривітання · Україна</p>"
      : "<p>© VideoVitannya · Персональные сказки PDF и видеопоздравления · Украина</p>",
    socialLinks: [],
    headerItems: [
      { label: isUk ? "Головна" : "Главная", href: "/", icon: "none" },
      {
        label: isUk ? "Відео від Миколая" : "Видео от Николая",
        href: "/svyatyj-mykolaj",
        icon: "video",
        serviceKey: "video",
      },
      {
        label: isUk ? "Створити казку" : "Создать сказку",
        href: "/kazka",
        icon: "book",
        serviceKey: "storybook",
      },
      { label: isUk ? "Ціни" : "Цены", href: "/tsiny", icon: "none" },
      { label: "Блог", href: "/blog", icon: "none" },
      {
        label: isUk ? "Мої замовлення" : "Мои заказы",
        href: "/my-orders",
        icon: "orders",
      },
    ],
    footerColumns: [
      {
        heading: isUk ? "Послуги" : "Услуги",
        links: footerServices.map((s) => ({
          label: s.label[locale],
          href: `/${s.slug}`,
        })),
      },
      {
        heading: isUk ? "Сервіс" : "Сервис",
        links: [
          { label: isUk ? "Ціни" : "Цены", href: "/tsiny" },
          { label: isUk ? "Мої замовлення" : "Мои заказы", href: "/my-orders" },
          { label: isUk ? "Про нас" : "О нас", href: "/pro-nas" },
          { label: "Блог", href: "/blog" },
          { label: isUk ? "Контакти" : "Контакты", href: "/kontakty" },
        ],
      },
    ],
    footerLegalLinks: [
      {
        label: isUk ? "Публічна оферта" : "Публичная оферта",
        href: "/oferta",
      },
      {
        label: isUk
          ? "Політика конфіденційності"
          : "Политика конфиденциальности",
        href: "/konfidentsiynist",
      },
    ],
  };
}

// ── Public CMS Loaders ───────────────────────────────────────────────────────

export async function getCmsReviews(): Promise<CmsReviewItem[]> {
  return withCache("reviews:all", async () => {
    try {
      const payload = await getPayload();
      const res = await payload.find({
        collection: "reviews",
        sort: "sortOrder",
        limit: 50,
        depth: 1,
        overrideAccess: true,
      });

      return (res.docs as unknown as Array<Record<string, unknown>>)
        .map(mapReviewDoc)
        .filter((r) => Boolean(r.authorName || r.instagramUrl));
    } catch {
      return [];
    }
  });
}

export async function getCmsServices(locale: Lang): Promise<CmsServiceItem[]> {
  return withCache(`services:${locale}`, async () => {
    try {
      const [payload, allReviews] = await Promise.all([
        getPayload(),
        getCmsReviews(),
      ]);
      const res = await payload.find({
        collection: "services",
        locale,
        sort: "sortOrder",
        limit: 50,
        depth: 2,
        overrideAccess: true,
      });

      if (!res.docs.length) return fallbackServices(locale);

      return (res.docs as unknown as Array<Record<string, unknown>>).map(
        (doc) => {
          const slug = asString(doc.slug);
          const staticMatch = SERVICE_CATALOG.find((s) => s.slug === slug);
          const meta = (doc.meta as Record<string, unknown> | undefined) ?? {};
          const relatedRaw = Array.isArray(doc.relatedServices)
            ? doc.relatedServices
            : [];
          const relatedSlugs = relatedRaw
            .map((r) => relSlug(r))
            .filter((s): s is string => Boolean(s));

          const tiersRaw = Array.isArray(doc.pricingTiers)
            ? (doc.pricingTiers as Array<Record<string, unknown>>)
            : [];
          const pricingTiers: CmsPricingTier[] = tiersRaw
            .map((t) => ({
              key: asString(t.key),
              label: asString(t.label, asString(t.key)),
              priceUah: Number(t.priceUah ?? 0),
              isPopular: Boolean(t.isPopular),
            }))
            .filter((t) => t.key && t.priceUah > 0);

          const featuresRaw = Array.isArray(doc.features)
            ? (doc.features as Array<Record<string, unknown>>)
            : [];
          const features = featuresRaw
            .map((f) => asString(f.text))
            .filter(Boolean);

          const sectionsRaw = Array.isArray(doc.sections)
            ? (doc.sections as Array<Record<string, unknown>>)
            : [];
          const sections: CmsServiceSection[] = sectionsRaw
            .map((s) => ({
              title: asString(s.title),
              text: asString(s.text) || undefined,
              steps: Array.isArray(s.steps)
                ? (s.steps as Array<Record<string, unknown>>)
                    .map((st) => asString(st.step))
                    .filter(Boolean)
                : undefined,
              includePriceNote: Boolean(s.includePriceNote),
              priceLink: Boolean(s.priceLink),
            }))
            .filter((s) => s.title);

          const extraBlocks = mapRawBlocks(doc.extraBlocks, allReviews);

          const statusRaw = asString(doc.status, "active");
          const status: CmsServiceItem["status"] =
            statusRaw === "coming_soon" || statusRaw === "hidden"
              ? statusRaw
              : "active";

          const showcaseRaw = asString(doc.showcaseKind, "none");
          const showcaseKind: CmsServiceItem["showcaseKind"] =
            showcaseRaw === "video" || showcaseRaw === "storybook"
              ? showcaseRaw
              : "none";

          const title = asString(doc.title, staticMatch?.label[locale] || slug);
          return {
            id: String(doc.id ?? slug),
            slug,
            serviceKey: (asString(doc.serviceKey, "custom") as
              | ServiceId
              | "custom"),
            status,
            sortOrder: Number(doc.sortOrder ?? 10),
            ctaOrderUrl:
              asString(doc.ctaOrderUrl) || staticMatch?.constructorHref,
            showcaseKind,
            coverImageUrl: resolveMediaUrl(
              doc.coverImage,
              asString(
                doc.fallbackImageUrl,
                staticMatch?.previewImage || "/samples/video-nikolai/poster.jpg"
              )
            ),
            previewIsConcept: Boolean(doc.previewIsConcept),
            basePriceUah: Number(doc.basePriceUah ?? 0),
            pricingTiers,
            title,
            label: asString(doc.label, title),
            badge: asString(doc.badge, staticMatch?.tag[locale] || ""),
            shortDescription: asString(
              doc.shortDescription,
              staticMatch?.short[locale] || ""
            ),
            ctaLabel: asString(
              doc.ctaLabel,
              locale === "uk" ? "Замовити" : "Заказать"
            ),
            features,
            h1: asString(doc.h1, staticMatch?.h1[locale] || title),
            intro: asString(doc.intro, staticMatch?.intro[locale] || ""),
            heroFootnote: asString(
              doc.heroFootnote,
              staticMatch?.heroFootnote[locale] || ""
            ),
            sections:
              sections.length > 0
                ? sections
                : (staticMatch?.sections.map((s) => ({
                    title: s.title[locale],
                    text: s.text?.[locale],
                    steps: s.steps?.[locale],
                    includePriceNote: s.includePriceNote,
                    priceLink: s.priceLink,
                  })) ?? []),
            extraBlocks,
            relatedSlugs:
              relatedSlugs.length > 0
                ? relatedSlugs
                : (staticMatch?.relatedSlugs ?? []),
            seoTitle: asString(
              meta.title,
              staticMatch?.seoTitle[locale] || `${title} | VideoVitannya`
            ),
            seoDescription: asString(
              meta.description,
              staticMatch?.seoDescription[locale] ||
                asString(doc.shortDescription)
            ),
          };
        }
      );
    } catch {
      return fallbackServices(locale);
    }
  });
}

export async function getCmsServiceBySlug(
  slug: string,
  locale: Lang
): Promise<CmsServiceItem | undefined> {
  const all = await getCmsServices(locale);
  return all.find((s) => s.slug === slug);
}

export async function getCmsHomeTemplate(
  locale: Lang
): Promise<CmsHomeTemplateData> {
  return withCache(`home-template:${locale}`, async () => {
    try {
      const [payload, allReviews] = await Promise.all([
        getPayload(),
        getCmsReviews(),
      ]);
      const doc = (await payload.findGlobal({
        slug: "home-template",
        locale,
        depth: 2,
        overrideAccess: true,
      })) as unknown as Record<string, unknown>;
      const meta = (doc?.meta as Record<string, unknown> | undefined) ?? {};
      return {
        sections: mapRawBlocks(doc?.sections, allReviews),
        seoTitle: asString(meta.title) || undefined,
        seoDescription: asString(meta.description) || undefined,
      };
    } catch {
      return { sections: [] };
    }
  });
}

export async function getCmsPages(locale: Lang): Promise<CmsPageItem[]> {
  return withCache(`pages:${locale}`, async () => {
    try {
      const [payload, allReviews] = await Promise.all([
        getPayload(),
        getCmsReviews(),
      ]);
      const res = await payload.find({
        collection: "pages",
        locale,
        where: { status: { equals: "published" } },
        limit: 100,
        depth: 2,
        overrideAccess: true,
      });

      return (res.docs as unknown as Array<Record<string, unknown>>).map(
        (doc) => {
          const slug = asString(doc.slug);
          const title = asString(doc.title, slug);
          const meta = (doc.meta as Record<string, unknown> | undefined) ?? {};
          return {
            id: String(doc.id ?? slug),
            slug,
            status: doc.status === "draft" ? "draft" : "published",
            title,
            eyebrow: asString(doc.eyebrow) || undefined,
            h1: asString(doc.h1, title),
            subtitle: asString(doc.subtitle) || undefined,
            sections: mapRawBlocks(doc.sections, allReviews),
            seoTitle: asString(meta.title, `${title} | VideoVitannya`),
            seoDescription: asString(meta.description, asString(doc.subtitle)),
          };
        }
      );
    } catch {
      return [];
    }
  });
}

export async function getCmsPageBySlug(
  slug: string,
  locale: Lang
): Promise<CmsPageItem | undefined> {
  const pages = await getCmsPages(locale);
  return pages.find((p) => p.slug === slug);
}

export async function getCmsServiceVariations(
  locale: Lang,
  serviceSlug?: string
): Promise<CmsServiceVariationItem[]> {
  return withCache(`variations:${locale}:${serviceSlug || "all"}`, async () => {
    try {
      const payload = await getPayload();
      const res = await payload.find({
        collection: "service-variations",
        locale,
        sort: "sortOrder",
        limit: 50,
        depth: 1,
        overrideAccess: true,
      });

      const mapped: CmsServiceVariationItem[] = (
        res.docs as unknown as Array<Record<string, unknown>>
      ).map((doc) => ({
        id: String(doc.id),
        variationSlug: asString(doc.variationSlug),
        serviceSlug: relSlug(doc.service) || "svyatyj-mykolaj",
        enabled: doc.enabled !== false,
        isDefault: Boolean(doc.isDefault),
        sortOrder: Number(doc.sortOrder ?? 10),
        priceOverrideUah:
          typeof doc.priceOverrideUah === "number" && doc.priceOverrideUah > 0
            ? Math.round(doc.priceOverrideUah)
            : null,
        title: asString(doc.title),
        shortBadge: asString(doc.shortBadge),
        description: asString(doc.description),
        posterUrl: resolveMediaUrl(
          doc.previewImage,
          asString(doc.fallbackPosterUrl, "/samples/video-nikolai/poster.jpg")
        ),
        demoVideoUrl: resolveMediaUrl(
          doc.demoVideo,
          asString(
            doc.demoVideoUrl,
            locale === "ru"
              ? "/samples/video-nikolai/demo_video_ru.mp4"
              : "/samples/video-nikolai/demo_video_uk.mp4"
          )
        ),
        pipelineTemplateId: asString(
          doc.pipelineTemplateId,
          "st_nicholas_room"
        ),
        elevenLabsVoiceIdOverride:
          asString(doc.elevenLabsVoiceIdOverride) || undefined,
        line03Uk: asString(doc.line03Uk) || undefined,
        line03Ru: asString(doc.line03Ru) || undefined,
        line04bUk: asString(doc.line04bUk) || undefined,
        line04bRu: asString(doc.line04bRu) || undefined,
        line07Uk: asString(doc.line07Uk) || undefined,
        line07Ru: asString(doc.line07Ru) || undefined,
      }));

      return mapped.filter(
        (v) => v.enabled && (!serviceSlug || v.serviceSlug === serviceSlug)
      );
    } catch {
      return [];
    }
  });
}

export async function getCmsVariationBySlug(
  variationSlug: string
): Promise<CmsServiceVariationItem | undefined> {
  if (!variationSlug.trim()) return undefined;
  const all = await getCmsServiceVariations("uk");
  return all.find((v) => v.variationSlug === variationSlug.trim());
}

export interface CmsShowcasesBundle {
  videos: DemoVideoItem[];
  storybooks: DemoStorybookItem[];
}

export async function getCmsShowcases(
  locale: Lang
): Promise<CmsShowcasesBundle> {
  return withCache(`showcases:${locale}`, async () => {
    try {
      const payload = await getPayload();
      const res = await payload.find({
        collection: "showcases",
        locale: "all",
        sort: "sortOrder",
        limit: 40,
        depth: 1,
        overrideAccess: true,
      });

      if (!res.docs.length) {
        return { videos: DEMO_VIDEOS, storybooks: DEMO_STORYBOOKS };
      }

      const videos: DemoVideoItem[] = [];
      const storybooks: DemoStorybookItem[] = [];

      const pickBi = (val: unknown, fallbackUk = "", fallbackRu = "") => {
        if (typeof val === "string") return { uk: val, ru: val };
        if (val && typeof val === "object") {
          const obj = val as Record<string, unknown>;
          const uk = asString(obj.uk, asString(obj.ru, fallbackUk));
          const ru = asString(obj.ru, asString(obj.uk, fallbackRu));
          return { uk, ru };
        }
        return { uk: fallbackUk, ru: fallbackRu };
      };

      for (const doc of res.docs as unknown as Array<Record<string, unknown>>) {
        const kind = asString(doc.kind);
        const demoLang: Lang = doc.demoLang === "ru" ? "ru" : "uk";
        const mediaUrl = resolveMediaUrl(doc.mediaFile, asString(doc.mediaUrl));
        const posterUrl = resolveMediaUrl(
          doc.posterFile,
          asString(doc.posterUrl)
        );

        if (kind === "video" && mediaUrl) {
          videos.push({
            id: demoLang,
            lang: demoLang,
            label: pickBi(doc.label, asString(doc.slug), asString(doc.slug)),
            recipientName: asString(doc.recipientName),
            age: asString(doc.age),
            achievement: asString(doc.achievement),
            audienceNote: pickBi(doc.audienceNote),
            duration: asString(doc.duration, "~47 с"),
            videoUrl: mediaUrl,
            posterUrl: posterUrl || "/samples/video-nikolai/poster.jpg",
          });
        } else if (kind === "storybook_pdf" && mediaUrl) {
          const staticSb =
            DEMO_STORYBOOKS.find((s) => s.id === demoLang) ??
            DEMO_STORYBOOKS[0];
          const titleBi = pickBi(doc.title, staticSb.title, staticSb.title);
          const subtitleBi = pickBi(
            doc.subtitle,
            staticSb.subtitle,
            staticSb.subtitle
          );
          storybooks.push({
            id: demoLang,
            orderId: staticSb.orderId,
            lang: demoLang,
            badge: pickBi(doc.badge, staticSb.badge.uk, staticSb.badge.ru),
            title: titleBi[demoLang] || titleBi[locale],
            subtitle: subtitleBi[demoLang] || subtitleBi[locale],
            childName: asString(doc.recipientName, staticSb.childName),
            ageGroup: (asString(doc.age, staticSb.ageGroup) as
              | "2-3"
              | "4-5"
              | "6-8"),
            artStyle: (asString(doc.artStyle, staticSb.artStyle) as ArtStyle),
            layoutMode: (asString(
              doc.layoutMode,
              staticSb.layoutMode
            ) as LayoutMode),
            companionLabel:
              asString(doc.companionLabel) || staticSb.companionLabel,
            coverImage: posterUrl || staticSb.coverImage,
            pdfUrl: mediaUrl,
            pages: staticSb.pages,
          });
        }
      }

      return {
        videos: videos.length > 0 ? videos : DEMO_VIDEOS,
        storybooks: storybooks.length > 0 ? storybooks : DEMO_STORYBOOKS,
      };
    } catch {
      return { videos: DEMO_VIDEOS, storybooks: DEMO_STORYBOOKS };
    }
  });
}

export async function getCmsBlogCategories(
  locale: Lang
): Promise<CmsBlogCategoryItem[]> {
  return withCache(`blog-cats:${locale}`, async () => {
    try {
      const payload = await getPayload();
      const res = await payload.find({
        collection: "post-categories",
        locale,
        sort: "sortOrder",
        limit: 50,
        depth: 1,
        overrideAccess: true,
      });

      if (!res.docs.length) return fallbackCategories(locale);

      return (res.docs as unknown as Array<Record<string, unknown>>).map(
        (doc) => {
          const slug = asString(doc.slug);
          const label = asString(doc.label, slug);
          const title = asString(doc.title, label);
          return {
            id: String(doc.id),
            slug,
            label,
            title,
            h1: asString(doc.h1, title),
            description: asString(doc.description),
            targetServiceSlug: relSlug(doc.targetService),
          };
        }
      );
    } catch {
      return fallbackCategories(locale);
    }
  });
}

export async function getCmsPosts(
  locale: Lang,
  hubSlug?: string
): Promise<CmsBlogPostItem[]> {
  return withCache(`posts:${locale}:${hubSlug || "all"}`, async () => {
    try {
      const payload = await getPayload();
      const res = await payload.find({
        collection: "posts",
        locale,
        where: {
          status: { equals: "published" },
        },
        sort: "-publishedAt",
        limit: 100,
        depth: 1,
        overrideAccess: true,
      });

      if (!res.docs.length) {
        const fb = fallbackPosts(locale);
        return hubSlug ? fb.filter((p) => p.hubSlug === hubSlug) : fb;
      }

      const mapped: CmsBlogPostItem[] = (
        res.docs as unknown as Array<Record<string, unknown>>
      ).map((doc) => {
        const slug = asString(doc.slug);
        const cat = (doc.category as Record<string, unknown> | undefined) ?? {};
        const author =
          (doc.author as Record<string, unknown> | undefined) ?? {};
        const meta = (doc.meta as Record<string, unknown> | undefined) ?? {};
        const title = asString(doc.title, slug);
        const excerpt = asString(doc.excerpt);
        const contentHtml = lexicalToHtmlString(doc.content);
        const tagsRaw = Array.isArray(doc.tags)
          ? (doc.tags as Array<{ tag?: string }>)
          : [];
        const rawDate = asString(doc.publishedAt, asString(doc.updatedAt));
        const publishedAt = rawDate ? rawDate.slice(0, 10) : "2026-11-20";

        return {
          id: String(doc.id),
          slug,
          hubSlug: asString(cat.slug, "svyatyj-mykolaj"),
          hubLabel: asString(cat.label, asString(cat.slug, "Блог")),
          title,
          excerpt,
          lead: asString(doc.lead, excerpt),
          contentHtml,
          publishedAt,
          readTime: asString(
            doc.readTime,
            locale === "uk" ? "3 хв читання" : "3 мин чтения"
          ),
          coverImageUrl: resolveMediaUrl(doc.coverImage) || undefined,
          authorName: asString(author.name) || undefined,
          authorRole: asString(author.role) || undefined,
          tags: tagsRaw.map((t) => asString(t.tag)).filter(Boolean),
          ctaServiceSlug: relSlug(doc.ctaService) || relSlug(cat.targetService),
          seoTitle: asString(meta.title, `${title} | VideoVitannya`),
          seoDescription: asString(meta.description, excerpt),
        };
      });

      return hubSlug ? mapped.filter((p) => p.hubSlug === hubSlug) : mapped;
    } catch {
      const fb = fallbackPosts(locale);
      return hubSlug ? fb.filter((p) => p.hubSlug === hubSlug) : fb;
    }
  });
}

export async function getCmsPostBySlug(
  hubSlug: string,
  postSlug: string,
  locale: Lang
): Promise<CmsBlogPostItem | undefined> {
  const posts = await getCmsPosts(locale);
  return (
    posts.find((p) => p.hubSlug === hubSlug && p.slug === postSlug) ??
    posts.find((p) => p.slug === postSlug)
  );
}

function mapNavItem(item: Record<string, unknown>): CmsNavItem | null {
  const label = asString(item.label);
  const href = asString(item.href);
  if (!label || !href) return null;
  const childrenRaw = Array.isArray(item.children)
    ? (item.children as Array<Record<string, unknown>>)
    : [];
  const children = childrenRaw
    .map(mapNavItem)
    .filter((c): c is CmsNavItem => Boolean(c));
  return {
    label,
    href,
    icon: (asString(item.icon, "none") as CmsNavItem["icon"]),
    serviceKey: (asString(
      item.serviceKey,
      "none"
    ) as CmsNavItem["serviceKey"]),
    openInNewTab: Boolean(item.openInNewTab),
    ...(children.length > 0 ? { children } : {}),
  };
}

export async function getCmsSiteShell(locale: Lang): Promise<CmsSiteShell> {
  return withCache(`shell:${locale}`, async () => {
    const fb = fallbackSiteShell(locale);
    try {
      const payload = await getPayload();
      const [siteDoc, headerDoc, footerDoc] = await Promise.all([
        payload.findGlobal({
          slug: "site-settings",
          locale,
          depth: 1,
          overrideAccess: true,
        }) as unknown as Promise<Record<string, unknown>>,
        payload.findGlobal({
          slug: "header-nav",
          locale,
          depth: 0,
          overrideAccess: true,
        }) as unknown as Promise<Record<string, unknown>>,
        payload.findGlobal({
          slug: "footer-nav",
          locale,
          depth: 0,
          overrideAccess: true,
        }) as unknown as Promise<Record<string, unknown>>,
      ]);

      const headerItemsRaw = Array.isArray(headerDoc?.items)
        ? (headerDoc.items as Array<Record<string, unknown>>)
        : [];
      const headerItems = headerItemsRaw
        .map(mapNavItem)
        .filter((i): i is CmsNavItem => Boolean(i));

      const footerColsRaw = Array.isArray(footerDoc?.columns)
        ? (footerDoc.columns as Array<Record<string, unknown>>)
        : [];
      const footerColumns: CmsFooterColumn[] = footerColsRaw
        .map((col) => ({
          heading: asString(col.heading),
          links: Array.isArray(col.links)
            ? (col.links as Array<Record<string, unknown>>)
                .map((l) => ({
                  label: asString(l.label),
                  href: asString(l.href),
                  openInNewTab: Boolean(l.openInNewTab),
                }))
                .filter((l) => l.label && l.href)
            : [],
        }))
        .filter((c) => c.heading && c.links.length > 0);

      const legalRaw = Array.isArray(footerDoc?.legalLinks)
        ? (footerDoc.legalLinks as Array<Record<string, unknown>>)
        : [];
      const footerLegalLinks = legalRaw
        .map((l) => ({ label: asString(l.label), href: asString(l.href) }))
        .filter((l) => l.label && l.href);

      const socialRaw = Array.isArray(siteDoc?.socialLinks)
        ? (siteDoc.socialLinks as Array<Record<string, unknown>>)
        : [];
      const socialLinks: CmsSocialLink[] = socialRaw
        .map((s) => ({
          platform: asString(s.platform, "other"),
          label: asString(s.label) || undefined,
          url: asString(s.url),
        }))
        .filter((s) => s.url);

      const footerTextHtml =
        lexicalToHtmlString(siteDoc?.footerText) || fb.footerTextHtml;
      const copyrightTextHtml =
        lexicalToHtmlString(siteDoc?.copyrightText) || fb.copyrightTextHtml;

      return {
        siteName: asString(siteDoc?.siteName, fb.siteName),
        tagline: asString(siteDoc?.tagline, fb.tagline),
        logoUrl: resolveMediaUrl(siteDoc?.logo, fb.logoUrl),
        showSiteNameWithLogo:
          typeof siteDoc?.showSiteNameWithLogo === "boolean"
            ? siteDoc.showSiteNameWithLogo
            : fb.showSiteNameWithLogo,
        contactEmail: asString(siteDoc?.contactEmail) || undefined,
        contactPhone: asString(siteDoc?.contactPhone) || undefined,
        footerTextHtml,
        copyrightTextHtml,
        socialLinks,
        headerItems: headerItems.length > 0 ? headerItems : fb.headerItems,
        footerColumns:
          footerColumns.length > 0 ? footerColumns : fb.footerColumns,
        footerLegalLinks:
          footerLegalLinks.length > 0 ? footerLegalLinks : fb.footerLegalLinks,
      };
    } catch {
      return fb;
    }
  });
}
