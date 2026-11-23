"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Instagram,
  Minus,
  PlayCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Video,
  X,
} from "lucide-react";
import { resolveSpacingClass } from "@engine/lib/blocks/spacing";
import { useLanguage } from "@/components/LanguageContext";
import { usePricing } from "@/components/PricingContext";
import { openCookieSettings } from "@/components/CookieConsent";
import { StorybookShowcaseReader } from "@/components/StorybookShowcaseReader";
import { VideoShowcasePlayer } from "@/components/VideoShowcasePlayer";
import { ArticleCards } from "@/components/ArticleCards";
import { UI_TEXT } from "@/lib/i18n";
import type {
  CmsBlock,
  CmsBlogPostItem,
  CmsReviewItem,
  CmsServiceItem,
  CmsShowcasesBundle,
} from "@/lib/cms-content";

function toInstagramEmbedUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  const m = rawUrl.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) return null;
  return `https://www.instagram.com/${m[1].toLowerCase()}/${m[2]}/embed/captioned/`;
}

function HeroBlockView({
  block,
  services,
}: {
  block: Extract<CmsBlock, { blockType: "hero" }>;
  services: CmsServiceItem[];
}) {
  const router = useRouter();
  const { lang, l } = useLanguage();
  const { pricing, getStorybookPrice, getVideoPrice } = usePricing();
  const isUk = lang === "uk";

  const vidEnabled = pricing.services.video?.enabled ?? true;
  const sbEnabled = pricing.services.storybook?.enabled ?? true;
  const videoPrice = getVideoPrice();
  const sbBasePrice = getStorybookPrice(6);

  const [quickService, setQuickService] = useState<string>(
    vidEnabled ? "video" : "storybook"
  );

  const quickMatch = services.find(
    (s) => (s.serviceKey !== "custom" ? s.serviceKey : s.slug) === quickService
  );
  const quickTargetHref =
    quickMatch?.ctaOrderUrl || `/${quickMatch?.slug || "kazka"}`;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-200/20 bg-gradient-to-br from-[#141f3f] via-[#101831] to-[#0b1020] p-7 shadow-2xl sm:p-12">
      <div className="max-w-3xl space-y-5">
        {block.badge && (
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-200">
            <Sparkles className="h-3.5 w-3.5" />
            {block.badge}
          </div>
        )}
        <h1 className="font-serif-book text-3xl font-bold leading-tight text-amber-50 sm:text-5xl">
          {block.heading}
        </h1>
        {block.subtitle && (
          <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
            {block.subtitle}
          </p>
        )}

        {block.showQuickPicker && (
          <div className="space-y-3 pt-1">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                router.push(l(quickTargetHref));
              }}
              className="flex flex-col gap-2 sm:flex-row sm:max-w-xl"
            >
              <label htmlFor="hero-service-select" className="sr-only">
                {isUk ? "Оберіть подарунок" : "Выберите подарок"}
              </label>
              <select
                id="hero-service-select"
                value={quickService}
                onChange={(e) => setQuickService(e.target.value)}
                className="flex-1 rounded-xl border border-amber-300/35 bg-[#0b1020]/90 px-4 py-3 text-sm font-medium text-amber-50 focus:border-amber-300 focus:outline-none"
              >
                {vidEnabled && (
                  <option value="video">
                    {isUk
                      ? `Відео від Святого Миколая — ${videoPrice} ₴`
                      : `Видео от Святого Николая — ${videoPrice} ₴`}
                  </option>
                )}
                {sbEnabled && (
                  <option value="storybook">
                    {isUk
                      ? `Іменна казка PDF — від ${sbBasePrice} ₴`
                      : `Именная сказка PDF — от ${sbBasePrice} ₴`}
                  </option>
                )}
                <option value="photo_animation">
                  {isUk ? "Оживлення фото (скоро)" : "Оживление фото (скоро)"}
                </option>
                <option value="song">
                  {isUk ? "Іменна пісня (скоро)" : "Именная песня (скоро)"}
                </option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 transition hover:brightness-105"
              >
                {isUk ? "Перейти" : "Перейти"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {vidEnabled && (
                <Link
                  href={l("/create/video")}
                  className="site-button inline-flex items-center gap-2 rounded-xl border border-amber-300/35 bg-amber-400/15 px-4 py-2.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/25"
                >
                  <Video className="h-4 w-4 text-amber-300" />
                  {isUk ? "Замовити відео від Миколая" : "Заказать видео от Николая"}
                </Link>
              )}
              {sbEnabled && (
                <Link
                  href={l("/create/storybook")}
                  className="site-button inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  <BookOpen className="h-4 w-4 text-amber-300" />
                  {isUk ? "Створити іменну казку" : "Создать именную сказку"}
                </Link>
              )}
              <a
                href="#live-demos"
                className="site-button inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
              >
                <PlayCircle className="h-4 w-4 text-sky-300" />
                {isUk ? "Дивитись приклади" : "Смотреть примеры"}
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function LiveDemosBlockView({
  block,
  showcases,
}: {
  block: Extract<CmsBlock, { blockType: "live-demos" }>;
  showcases?: CmsShowcasesBundle;
}) {
  const { lang } = useLanguage();
  const isUk = lang === "uk";
  const [demoTab, setDemoTab] = useState<"video" | "storybook">(
    block.defaultTab
  );

  return (
    <section id="live-demos" className="space-y-5 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          {block.eyebrow && (
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              {block.eyebrow}
            </span>
          )}
          <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
            {block.heading ||
              (isUk
                ? "Подивіться й послухайте перед замовленням"
                : "Посмотрите и послушайте перед заказом")}
          </h2>
        </div>

        <div className="inline-flex rounded-xl border border-white/15 bg-[#121a30] p-1">
          <button
            type="button"
            onClick={() => setDemoTab("video")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              demoTab === "video"
                ? "bg-amber-400 text-[#0b1020]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Video className="h-4 w-4" />
            {isUk ? "Відео від Миколая" : "Видео от Николая"}
          </button>
          <button
            type="button"
            onClick={() => setDemoTab("storybook")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              demoTab === "storybook"
                ? "bg-amber-400 text-[#0b1020]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            {isUk ? "Готова казка PDF" : "Готовая сказка PDF"}
          </button>
        </div>
      </div>

      {demoTab === "video" ? (
        <VideoShowcasePlayer videos={showcases?.videos} />
      ) : (
        <StorybookShowcaseReader storybooks={showcases?.storybooks} />
      )}
    </section>
  );
}

function ServicesCatalogBlockView({
  block,
  services,
}: {
  block: Extract<CmsBlock, { blockType: "services-catalog" }>;
  services: CmsServiceItem[];
}) {
  const { lang, l } = useLanguage();
  const { getServicePrice, getStorybookPrice } = usePricing();
  const isUk = lang === "uk";

  const activeServices = services.filter(
    (s) => s.status === "active" && s.ctaOrderUrl
  );
  const upcomingServices = services.filter(
    (s) => s.status === "coming_soon" && s.serviceKey !== "custom"
  );

  return (
    <section id="gifts" className="space-y-6 scroll-mt-24">
      <div className="space-y-2">
        <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
          {block.heading ||
            (isUk
              ? "Особистий подарунок. Для кожної вашої людини."
              : "Личный подарок. Для каждого дорогого человека.")}
        </h2>
        {block.subtitle && (
          <p className="max-w-2xl text-sm text-slate-300">{block.subtitle}</p>
        )}
      </div>

      {activeServices.length === 0 ? (
        <div className="rounded-2xl border border-amber-300/20 bg-[#121a30]/90 p-8 text-center text-sm text-slate-300">
          {isUk
            ? "Сервіси тимчасово недоступні для нових замовлень. Будь ласка, завітайте пізніше."
            : "Сервисы временно недоступны для новых заказов. Пожалуйста, загляните позже."}
        </div>
      ) : (
        <div
          className={`grid gap-6 ${
            activeServices.length === 1 ? "max-w-xl mx-auto" : "md:grid-cols-2"
          }`}
        >
          {activeServices.map((svc) => {
            const isSb = svc.serviceKey === "storybook";
            const price =
              svc.serviceKey !== "custom"
                ? getServicePrice(
                    svc.serviceKey,
                    isSb ? { pageCount: 6 } : undefined
                  )
                : svc.basePriceUah;
            const sbLong = isSb ? getStorybookPrice(8) : null;

            return (
              <div
                key={svc.slug}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#121a30]/90 shadow-xl transition duration-200 hover:border-amber-300/45 hover:bg-[#151f38] hover:shadow-2xl hover:shadow-amber-500/10"
              >
                <Link
                  href={l(`/${svc.slug}`)}
                  className="relative block aspect-[16/9] w-full overflow-hidden bg-slate-900"
                >
                  <img
                    src={svc.coverImageUrl}
                    alt={svc.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121a30] via-transparent to-transparent" />
                  {svc.badge && (
                    <span className="absolute left-4 top-4 rounded-full border border-amber-300/35 bg-[#0b1020]/85 px-3 py-1 text-xs font-semibold text-amber-200 backdrop-blur-xs">
                      {svc.badge}
                    </span>
                  )}
                  {price > 0 && (
                    <span className="absolute bottom-3 right-4 rounded-xl bg-[#0b1020]/90 px-3 py-1.5 text-sm font-bold text-amber-200 shadow-md">
                      {isSb
                        ? isUk
                          ? `від ${price} ₴`
                          : `от ${price} ₴`
                        : `${price} ₴`}
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col justify-between space-y-5 p-6">
                  <div className="space-y-3">
                    <Link
                      href={l(`/${svc.slug}`)}
                      className="block font-serif-book text-2xl font-bold text-white transition hover:text-amber-200"
                    >
                      {svc.title}
                    </Link>
                    <p className="text-sm leading-relaxed text-slate-300">
                      {svc.shortDescription}
                    </p>
                    {isSb && sbLong && (
                      <div className="text-xs font-medium text-emerald-300">
                        {isUk
                          ? `4–6 стор. — ${price} ₴ · 8 стор. — ${sbLong} ₴`
                          : `4–6 стр. — ${price} ₴ · 8 стр. — ${sbLong} ₴`}
                      </div>
                    )}
                    {svc.features.length > 0 && (
                      <ul className="space-y-1.5 pt-1 text-xs text-slate-300">
                        {svc.features.slice(0, 3).map((feat) => (
                          <li key={feat} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Link
                      href={l(`/${svc.slug}`)}
                      className="site-button inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                    >
                      {isUk ? "Детальніше" : "Подробнее"}
                    </Link>
                    {svc.ctaOrderUrl && (
                      <Link
                        href={l(svc.ctaOrderUrl)}
                        className="site-button inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-3 text-xs font-bold text-[#0b1020] shadow-md shadow-amber-500/20 transition hover:brightness-105"
                      >
                        {isUk ? "Замовити" : "Заказать"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {block.showUpcoming && upcomingServices.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#121a30]/55 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              {isUk
                ? "Нові формати подарунків (незабаром)"
                : "Новые форматы подарков (скоро)"}
            </span>
            <Link
              href={l("/tsiny")}
              className="text-xs font-semibold text-slate-300 hover:text-amber-200"
            >
              {isUk ? "Тарифи та формати →" : "Тарифы и форматы →"}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {upcomingServices.map((item) => (
              <Link
                key={item.slug}
                href={l(`/${item.slug}`)}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-amber-300/35 hover:bg-white/[0.06]"
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-400">{item.badge}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-amber-300" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function PricingTableBlockView({
  block,
  services,
}: {
  block: Extract<CmsBlock, { blockType: "pricing-table" }>;
  services: CmsServiceItem[];
}) {
  const { lang, l } = useLanguage();
  const { pricing, getStorybookPrice, getServicePrice } = usePricing();
  const isUk = lang === "uk";

  const sbBasePrice = getStorybookPrice(6);
  const sbLongPrice = getStorybookPrice(8);

  const pricedServices = services.filter(
    (item) =>
      item.status !== "hidden" &&
      (item.serviceKey !== "custom" || item.basePriceUah > 0)
  );

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121a30]/85 shadow-xl">
        <div className="hidden grid-cols-[1.6fr_0.8fr_1fr] border-b border-white/10 bg-white/[0.03] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-amber-300 md:grid">
          <span>{isUk ? "Подарунок" : "Подарок"}</span>
          <span>{isUk ? "Вартість" : "Стоимость"}</span>
          <span className="text-right">{isUk ? "Дії" : "Действия"}</span>
        </div>

        <div className="divide-y divide-white/10">
          {pricedServices.map((item) => {
            const svcKey =
              item.serviceKey !== "custom" ? item.serviceKey : undefined;
            const svc = svcKey ? pricing.services[svcKey] : undefined;
            const isOrderable = Boolean(
              item.ctaOrderUrl &&
                item.status === "active" &&
                (svc ? svc.enabled && !svc.comingSoon : true)
            );
            const priceUah = svcKey
              ? getServicePrice(
                  svcKey,
                  svcKey === "storybook" ? { pageCount: 6 } : undefined
                )
              : item.basePriceUah;

            return (
              <div
                key={item.slug}
                className="grid gap-4 px-6 py-5 md:grid-cols-[1.6fr_0.8fr_1fr] md:items-center"
              >
                <div className="space-y-1">
                  <Link
                    href={l(`/${item.slug}`)}
                    className="font-serif-book text-lg font-bold text-white transition hover:text-amber-200"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs leading-relaxed text-slate-300">
                    {svcKey === "storybook"
                      ? isUk
                        ? `4–6 сторінок — ${sbBasePrice} ₴ · 8 сторінок — ${sbLongPrice} ₴`
                        : `4–6 страниц — ${sbBasePrice} ₴ · 8 страниц — ${sbLongPrice} ₴`
                      : item.shortDescription}
                  </p>
                </div>

                <div className="text-xl font-bold text-amber-200">
                  {svcKey === "storybook"
                    ? isUk
                      ? `від ${sbBasePrice} ₴`
                      : `от ${sbBasePrice} ₴`
                    : `${priceUah} ₴`}
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Link
                    href={l(`/${item.slug}`)}
                    className="site-button inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    {isUk ? "Детальніше" : "Подробнее"}
                  </Link>
                  {isOrderable && item.ctaOrderUrl ? (
                    <Link
                      href={l(item.ctaOrderUrl)}
                      className="site-button inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-[#0b1020] transition hover:bg-amber-300"
                    >
                      {isUk ? "Замовити" : "Заказать"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/20 bg-amber-400/5 px-3.5 py-2.5 text-xs font-medium text-amber-200">
                      <Clock className="h-3.5 w-3.5" />
                      {isUk ? "Скоро запуск" : "Скоро запуск"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {block.includedBullets.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-[#121a30]/75 p-6 sm:p-8 space-y-4">
          <div className="space-y-1">
            <h2 className="font-serif-book text-2xl font-bold text-amber-50">
              {block.includedHeading ||
                (isUk ? "Що входить у ціну" : "Что входит в цену")}
            </h2>
            {block.includedSubtitle && (
              <p className="text-sm text-slate-400">{block.includedSubtitle}</p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {block.includedBullets.map((bullet) => (
              <div
                key={bullet}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium text-slate-200"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewCard({ rev }: { rev: CmsReviewItem }) {
  const { lang } = useLanguage();
  const isUk = lang === "uk";

  if (rev.reviewType === "instagram") {
    const embedUrl = toInstagramEmbedUrl(rev.instagramUrl);
    return (
      <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-pink-400/25 bg-[#121a30]/85 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-pink-200">
            <Instagram className="h-3.5 w-3.5" />
            {rev.authorName || "Instagram"}
          </span>
          {rev.instagramUrl && (
            <a
              href={rev.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200"
            >
              {isUk ? "Відкрити" : "Открыть"}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {rev.instagramScreenshotUrl ? (
          <a
            href={rev.instagramUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-xl border border-white/10"
          >
            <img
              src={rev.instagramScreenshotUrl}
              alt={rev.authorName}
              className="aspect-[4/5] w-full object-cover"
            />
          </a>
        ) : embedUrl ? (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white">
            <iframe
              src={embedUrl}
              title={`Instagram review ${rev.authorName}`}
              className="h-[340px] w-full border-0"
              loading="lazy"
            />
          </div>
        ) : null}

        {rev.quote && (
          <p className="text-xs leading-relaxed text-slate-200">
            «{rev.quote}»
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#121a30]/80 p-5 space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-0.5 text-amber-300">
          {Array.from({ length: rev.rating }).map((_, idx) => (
            <Star
              key={idx}
              className="h-3.5 w-3.5 fill-amber-300 text-amber-300"
            />
          ))}
        </div>
        {rev.photoUrl && (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <img
              src={rev.photoUrl}
              alt={rev.authorName}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        )}
        {rev.quote && (
          <p className="text-xs leading-relaxed text-slate-200">
            «{rev.quote}»
          </p>
        )}
      </div>
      <div className="border-t border-white/10 pt-3">
        <div className="text-xs font-semibold text-white">{rev.authorName}</div>
        {rev.authorLocation && (
          <div className="text-[11px] text-slate-400">{rev.authorLocation}</div>
        )}
      </div>
    </div>
  );
}

function FaqBlockView({
  block,
}: {
  block: Extract<CmsBlock, { blockType: "faq" }>;
}) {
  const { lang } = useLanguage();
  const isUk = lang === "uk";
  if (!block.items.length) return null;

  const heading =
    block.heading || (isUk ? "Питання та відповіді" : "Вопросы и ответы");
  const sub =
    block.subtitle ||
    (isUk ? "Щоб обрати подарунок було легко." : "Чтобы выбрать подарок было легко.");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: block.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
          {heading}
        </h2>
        <p className="text-sm text-slate-400">{sub}</p>
      </div>

      <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#121a30]/75">
        {block.items.map((item) => (
          <details
            key={item.question}
            open={block.layout === "all-open" ? true : undefined}
            className="group p-5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-white transition hover:text-amber-200 sm:text-base">
              <span>{item.question}</span>
              <Plus className="h-5 w-5 shrink-0 text-amber-300 transition-transform duration-200 group-open:rotate-45" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {item.answer}
            </p>
          </details>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </section>
  );
}

type DynamicIcon = React.ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;

function BlockIcon({
  name,
  color,
  size = 20,
}: {
  name?: string;
  color?: string;
  size?: number;
}) {
  if (!name) return null;
  const Icon = (LucideIcons as unknown as Record<string, DynamicIcon | undefined>)[
    name
  ];
  if (!Icon) return null;
  return (
    <span
      className="flex shrink-0 text-amber-300"
      style={color ? { color } : undefined}
    >
      <Icon size={size} strokeWidth={1.8} />
    </span>
  );
}

const PROSE_CLASS =
  "space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base [&_h2]:mt-5 [&_h2]:font-serif-book [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-amber-100 [&_h3]:mt-4 [&_h3]:font-semibold [&_h3]:text-white [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-white [&_a]:text-amber-300 [&_a]:underline";

function resolveHref(l: (p: string) => string, href: string): string {
  if (href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return href;
  }
  return l(href);
}

function BannerBlockView({
  block,
}: {
  block: Extract<CmsBlock, { blockType: "banner" }>;
}) {
  const { l } = useLanguage();
  const storageKey = `banner-dismissed-${block.id}`;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (block.dismissible && localStorage.getItem(storageKey) === "dismissed") {
      setVisible(false);
    }
  }, [block.dismissible, storageKey]);

  if (!visible) return null;

  const styles: Record<string, string> = {
    info: "border-sky-400/30 bg-sky-500/10 text-sky-100",
    success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
    warning: "border-amber-400/40 bg-amber-500/15 text-amber-100",
    promo:
      "border-amber-300/40 bg-gradient-to-r from-amber-400/20 via-amber-300/10 to-amber-400/20 text-amber-50",
  };

  return (
    <div
      className={`relative flex flex-wrap items-center justify-center gap-3 rounded-2xl border px-5 py-3 text-sm font-medium ${styles[block.style]}`}
    >
      <span>{block.content}</span>
      {block.ctaLabel && block.ctaUrl && (
        <a
          href={resolveHref(l, block.ctaUrl)}
          className="font-bold underline hover:no-underline"
        >
          {block.ctaLabel}
        </a>
      )}
      {block.dismissible && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            localStorage.setItem(storageKey, "dismissed");
            setVisible(false);
          }}
          className="icon-button absolute right-3 top-1/2 -translate-y-1/2 opacity-70 transition hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function RenderBlocks({
  blocks,
  services = [],
  showcases,
  articles = [],
}: {
  blocks: CmsBlock[];
  services?: CmsServiceItem[];
  showcases?: CmsShowcasesBundle;
  articles?: CmsBlogPostItem[];
}) {
  const { lang, l } = useLanguage();
  const isUk = lang === "uk";
  const t = UI_TEXT[lang];

  if (!blocks.length) return null;

  return (
    <div className="space-y-12">
      {blocks.map((block) => {
        switch (block.blockType) {
          case "hero":
            return (
              <HeroBlockView key={block.id} block={block} services={services} />
            );

          case "live-demos":
            return (
              <LiveDemosBlockView
                key={block.id}
                block={block}
                showcases={showcases}
              />
            );

          case "services-catalog":
            return (
              <ServicesCatalogBlockView
                key={block.id}
                block={block}
                services={services}
              />
            );

          case "pricing-table":
            return (
              <PricingTableBlockView
                key={block.id}
                block={block}
                services={services}
              />
            );

          case "steps": {
            const list =
              block.steps.length > 0
                ? block.steps
                : t.steps.map((s) => ({ title: s.title, description: s.desc }));
            return (
              <section key={block.id} className="space-y-5">
                <h2 className="font-serif-book text-2xl font-bold text-amber-100 sm:text-3xl">
                  {block.heading || t.howItWorks}
                </h2>
                <div
                  className={`grid gap-4 sm:grid-cols-2 ${
                    block.columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
                  }`}
                >
                  {list.map((s) => (
                    <div
                      key={s.title}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-2"
                    >
                      <div className="text-sm font-bold text-amber-300">
                        {s.title}
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300">
                        {s.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          case "privacy-trust":
            return (
              <Link
                key={block.id}
                href={l(block.href || "/konfidentsiynist")}
                className="group flex items-start justify-between gap-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-5 text-xs text-slate-300 transition hover:border-emerald-400/45 hover:bg-emerald-500/10"
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div className="space-y-1">
                    <strong className="block text-sm text-emerald-200">
                      {block.title}
                    </strong>
                    <p className="leading-relaxed">{block.text}</p>
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-emerald-300 transition-transform group-hover:translate-x-1" />
              </Link>
            );

          case "reviews":
            if (!block.reviews.length) return null;
            return (
              <section key={block.id} className="space-y-5">
                <div className="space-y-1.5">
                  {block.eyebrow && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                      {block.eyebrow}
                    </span>
                  )}
                  <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
                    {block.heading ||
                      (isUk
                        ? "Відгуки про VideoVitannya"
                        : "Отзывы о VideoVitannya")}
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {block.reviews.map((rev) => (
                    <ReviewCard key={rev.id} rev={rev} />
                  ))}
                </div>
              </section>
            );

          case "faq":
            return <FaqBlockView key={block.id} block={block} />;

          case "text":
            return (
              <section
                key={block.id}
                className="rounded-2xl border border-white/10 bg-[#121a30]/75 p-6 sm:p-8 space-y-4"
              >
                {block.heading && (
                  <h2 className="font-serif-book text-xl font-bold text-amber-50 sm:text-2xl">
                    {block.heading}
                  </h2>
                )}
                {block.contentHtml && (
                  <div
                    className="space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base [&_h2]:mt-5 [&_h2]:font-serif-book [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-amber-100 [&_h3]:mt-4 [&_h3]:font-semibold [&_h3]:text-white [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-white [&_a]:text-amber-300 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: block.contentHtml }}
                  />
                )}
                {block.showCookieSettingsButton && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => openCookieSettings()}
                      className="rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/20"
                    >
                      {isUk ? "Налаштування cookies" : "Настройки cookies"}
                    </button>
                  </div>
                )}
              </section>
            );

          case "blog-grid": {
            const list = articles.slice(0, block.limit);
            if (!list.length) return null;
            return (
              <section key={block.id} className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
                    {block.heading ||
                      (isUk
                        ? "Трохи натхнення для теплих слів"
                        : "Немного вдохновения для тёплых слов")}
                  </h2>
                  <Link
                    href={l("/blog")}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-amber-200"
                  >
                    {block.viewAllLabel ||
                      (isUk ? "Усі матеріали" : "Все материалы")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <ArticleCards articles={list} />
              </section>
            );
          }

          case "cta": {
            const href = block.buttonHref.startsWith("#")
              ? block.buttonHref
              : block.buttonHref.startsWith("http")
                ? block.buttonHref
                : l(block.buttonHref);
            return (
              <section
                key={block.id}
                className="rounded-3xl border border-amber-300/25 bg-gradient-to-r from-[#19264d] via-[#141f3f] to-[#1b1f3b] p-8 text-center shadow-2xl sm:p-12 space-y-4"
              >
                <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-4xl">
                  {block.heading}
                </h2>
                {block.subtitle && (
                  <p className="mx-auto max-w-xl text-sm text-slate-300 sm:text-base">
                    {block.subtitle}
                  </p>
                )}
                <div className="pt-2">
                  <a
                    href={href}
                    className="site-button inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3.5 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 transition hover:brightness-105"
                  >
                    {block.buttonLabel}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </section>
            );
          }

          case "banner":
            return <BannerBlockView key={block.id} block={block} />;

          case "features": {
            if (!block.items.length) return null;
            const colClass =
              block.columns === 2
                ? "sm:grid-cols-2"
                : block.columns === 4
                  ? "sm:grid-cols-2 lg:grid-cols-4"
                  : "sm:grid-cols-2 lg:grid-cols-3";
            return (
              <section
                key={block.id}
                className={`space-y-6 ${resolveSpacingClass(block.spacing)}`}
              >
                {block.heading && (
                  <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
                    {block.heading}
                  </h2>
                )}
                {block.style === "list" ? (
                  <ul className="space-y-4">
                    {block.items.map((it) => (
                      <li key={it.title} className="flex items-start gap-4">
                        {it.imageUrl ? (
                          <img
                            src={it.imageUrl}
                            alt={it.title}
                            className="h-12 w-12 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <BlockIcon name={it.icon} color={it.iconColor} size={24} />
                        )}
                        <div className="space-y-1">
                          <div className="text-base font-semibold text-white">
                            {it.title}
                          </div>
                          {it.description && (
                            <p className="text-sm leading-relaxed text-slate-300">
                              {it.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={`grid gap-4 ${colClass}`}>
                    {block.items.map((it) => (
                      <div
                        key={it.title}
                        className={`space-y-3 ${
                          block.useBackground
                            ? "rounded-2xl border border-white/10 bg-[#121a30]/80 p-5"
                            : ""
                        }`}
                      >
                        {it.imageUrl ? (
                          <img
                            src={it.imageUrl}
                            alt={it.title}
                            className="aspect-[4/3] w-full rounded-xl object-cover"
                          />
                        ) : (
                          <BlockIcon name={it.icon} color={it.iconColor} size={28} />
                        )}
                        <div className="text-base font-semibold text-white">
                          {it.title}
                        </div>
                        {block.style === "cards" && it.description && (
                          <p className="text-sm leading-relaxed text-slate-300">
                            {it.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          }

          case "icon-list": {
            if (!block.items.length) return null;
            return (
              <section
                key={block.id}
                className={`space-y-4 ${resolveSpacingClass(block.spacing)}`}
              >
                {block.heading && (
                  <h2 className="font-serif-book text-xl font-bold text-amber-50 sm:text-2xl">
                    {block.heading}
                  </h2>
                )}
                <div
                  className={
                    block.useBackground
                      ? "rounded-2xl border border-white/10 bg-[#121a30]/75 p-5"
                      : ""
                  }
                >
                  <ul
                    className={
                      block.columns === 2
                        ? "grid gap-x-8 gap-y-2.5 sm:grid-cols-2"
                        : "flex flex-col gap-2.5"
                    }
                  >
                    {block.items.map((it) => (
                      <li
                        key={it.text}
                        className="flex items-center gap-3 text-sm text-slate-200"
                      >
                        {it.icon ? (
                          <BlockIcon name={it.icon} color={it.iconColor} size={18} />
                        ) : (
                          <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-emerald-400" />
                        )}
                        <span>{it.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          }

          case "logos": {
            if (!block.items.length) return null;
            return (
              <section
                key={block.id}
                className={`space-y-4 ${resolveSpacingClass(block.spacing)}`}
              >
                {block.heading && (
                  <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-amber-300">
                    {block.heading}
                  </h2>
                )}
                <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
                  {block.items.map((it) => {
                    const img = (
                      <img
                        src={it.logoUrl}
                        alt={it.label || ""}
                        title={it.label}
                        className={`h-10 w-auto max-w-[160px] object-contain transition ${
                          block.grayscale
                            ? "opacity-70 grayscale hover:opacity-100 hover:grayscale-0"
                            : ""
                        }`}
                      />
                    );
                    return it.url ? (
                      <a
                        key={it.logoUrl}
                        href={it.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {img}
                      </a>
                    ) : (
                      <span key={it.logoUrl}>{img}</span>
                    );
                  })}
                </div>
              </section>
            );
          }

          case "stats": {
            if (!block.items.length) return null;
            return (
              <section
                key={block.id}
                className={`space-y-6 ${resolveSpacingClass(block.spacing)}`}
              >
                {block.heading && (
                  <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
                    {block.heading}
                  </h2>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {block.items.map((it) => (
                    <div
                      key={`${it.value}-${it.label}`}
                      className="rounded-2xl border border-white/10 bg-[#121a30]/80 p-5 text-center"
                    >
                      <div className="font-serif-book text-3xl font-bold text-amber-300 sm:text-4xl">
                        {it.value}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {it.label}
                      </div>
                      {it.description && (
                        <div className="mt-1 text-xs text-slate-400">
                          {it.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          case "text-image":
            return (
              <section
                key={block.id}
                className={`grid items-center gap-8 lg:grid-cols-2 ${resolveSpacingClass(block.spacing)}`}
              >
                <div
                  className={`space-y-4 ${
                    block.imagePosition === "left" ? "lg:order-2" : ""
                  }`}
                >
                  {block.heading && (
                    <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
                      {block.heading}
                    </h2>
                  )}
                  {block.contentHtml && (
                    <div
                      className={PROSE_CLASS}
                      dangerouslySetInnerHTML={{ __html: block.contentHtml }}
                    />
                  )}
                  {block.ctaLabel && block.ctaUrl && (
                    <a
                      href={resolveHref(l, block.ctaUrl)}
                      className="site-button inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-5 py-3 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 transition hover:brightness-105"
                    >
                      {block.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {block.imageUrl && (
                  <div
                    className={`overflow-hidden rounded-2xl border border-white/10 shadow-xl ${
                      block.imagePosition === "left" ? "lg:order-1" : ""
                    }`}
                  >
                    <img
                      src={block.imageUrl}
                      alt={block.heading || ""}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>
                )}
              </section>
            );

          case "video": {
            if (!block.embedUrl && !block.fileUrl) return null;
            const aspect =
              block.aspectRatio === "4:3"
                ? "aspect-[4/3]"
                : block.aspectRatio === "1:1"
                  ? "aspect-square"
                  : "aspect-video";
            return (
              <section
                key={block.id}
                className={`mx-auto max-w-4xl space-y-4 ${resolveSpacingClass(block.spacing)}`}
              >
                {block.heading && (
                  <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
                    {block.heading}
                  </h2>
                )}
                <div
                  className={`relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-xl ${aspect}`}
                >
                  {block.fileUrl ? (
                    <video
                      src={block.fileUrl}
                      controls
                      playsInline
                      autoPlay={block.autoplay}
                      muted={block.autoplay}
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                  ) : (
                    <iframe
                      src={`${block.embedUrl}${
                        block.autoplay
                          ? `${block.embedUrl?.includes("?") ? "&" : "?"}autoplay=1&mute=1`
                          : ""
                      }`}
                      title={block.heading || "Video"}
                      allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
                      allowFullScreen
                      loading="lazy"
                      className="absolute inset-0 h-full w-full border-0"
                    />
                  )}
                </div>
                {block.caption && (
                  <p className="text-xs text-slate-400">{block.caption}</p>
                )}
              </section>
            );
          }

          case "manifesto": {
            const bgClass =
              block.background === "primary"
                ? "border-amber-300/40 bg-gradient-to-br from-amber-400/20 to-amber-500/10"
                : block.background === "default"
                  ? "border-white/10 bg-[#121a30]/70"
                  : "border-amber-200/15 bg-gradient-to-br from-[#141f3f] via-[#101831] to-[#0b1020]";
            return (
              <section
                key={block.id}
                className={resolveSpacingClass(block.spacing)}
              >
                <div
                  className={`space-y-4 rounded-3xl border p-7 shadow-xl sm:p-12 ${bgClass} ${
                    block.alignment === "center" ? "text-center" : ""
                  }`}
                >
                  <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-4xl">
                    {block.heading}
                  </h2>
                  {block.contentHtml && (
                    <div
                      className={`${PROSE_CLASS} ${
                        block.alignment === "center" ? "mx-auto max-w-2xl" : "max-w-3xl"
                      }`}
                      dangerouslySetInnerHTML={{ __html: block.contentHtml }}
                    />
                  )}
                </div>
              </section>
            );
          }

          case "pricing-cards": {
            if (!block.items.length) return null;
            return (
              <section
                key={block.id}
                className={`space-y-6 ${resolveSpacingClass(block.spacing)}`}
              >
                {(block.heading || block.subheading) && (
                  <div className="space-y-1.5">
                    {block.heading && (
                      <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
                        {block.heading}
                      </h2>
                    )}
                    {block.subheading && (
                      <p className="text-sm text-slate-400">{block.subheading}</p>
                    )}
                  </div>
                )}
                <div
                  className={`grid gap-5 ${
                    block.items.length >= 3 ? "lg:grid-cols-3" : "sm:grid-cols-2"
                  }`}
                >
                  {block.items.map((plan) => (
                    <div
                      key={plan.name}
                      className={`flex flex-col justify-between rounded-2xl border p-6 shadow-xl ${
                        plan.highlighted
                          ? "border-amber-300/60 bg-gradient-to-b from-amber-400/10 to-[#121a30]/90 ring-1 ring-amber-300/30"
                          : "border-white/10 bg-[#121a30]/85"
                      }`}
                    >
                      <div className="space-y-4">
                        <div>
                          <div className="font-serif-book text-lg font-bold text-white">
                            {plan.name}
                          </div>
                          {plan.description && (
                            <p className="mt-1 text-xs text-slate-400">
                              {plan.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-amber-200">
                            {plan.price}
                          </span>
                          {plan.period && (
                            <span className="text-xs text-slate-400">
                              {plan.period}
                            </span>
                          )}
                        </div>
                        <ul className="space-y-2 text-sm">
                          {plan.features.map((f) => (
                            <li
                              key={f.text}
                              className={`flex items-start gap-2 ${
                                f.included ? "text-slate-200" : "text-slate-500"
                              }`}
                            >
                              {f.included ? (
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                              ) : (
                                <Minus className="mt-0.5 h-4 w-4 shrink-0" />
                              )}
                              <span>{f.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <a
                        href={resolveHref(l, plan.ctaUrl)}
                        className={`site-button mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold transition ${
                          plan.highlighted
                            ? "bg-gradient-to-r from-amber-300 to-amber-500 text-[#0b1020] shadow-lg shadow-amber-500/20 hover:brightness-105"
                            : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        {plan.ctaLabel}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          case "payment-logos": {
            if (!block.items.length) return null;
            const labelFor = (preset: string, custom: string) =>
              custom ||
              (
                {
                  "plata-by-mono": "Plata by mono",
                  visa: "Visa",
                  mastercard: "Mastercard",
                  "apple-pay": "Apple Pay",
                  "google-pay": "Google Pay",
                  monobank: "monobank",
                  privat24: "Privat24",
                } as Record<string, string>
              )[preset] ||
              preset;
            return (
              <section
                key={block.id}
                className={`space-y-3 ${resolveSpacingClass(block.spacing)}`}
              >
                {block.heading && (
                  <div
                    className={`text-xs font-semibold uppercase tracking-wider text-amber-300 ${
                      block.align === "center"
                        ? "text-center"
                        : block.align === "right"
                          ? "text-right"
                          : ""
                    }`}
                  >
                    {block.heading}
                  </div>
                )}
                <div
                  className={`flex flex-wrap gap-2.5 ${
                    block.align === "center"
                      ? "justify-center"
                      : block.align === "right"
                        ? "justify-end"
                        : ""
                  }`}
                >
                  {block.items.map((it, idx) => (
                    <span
                      key={`${it.preset}-${idx}`}
                      className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold tracking-wide text-slate-200 transition hover:border-amber-300/40 hover:text-amber-100"
                    >
                      {labelFor(it.preset, it.label)}
                    </span>
                  ))}
                </div>
              </section>
            );
          }

          case "spacer":
            return (
              <div
                key={block.id}
                className={
                  block.size === "sm"
                    ? "h-4"
                    : block.size === "lg"
                      ? "h-14"
                      : "h-8"
                }
              />
            );
        }
      })}
    </div>
  );
}
