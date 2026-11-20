"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Video,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { usePricing } from "@/components/PricingContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqSection } from "@/components/FaqSection";
import { ArticleCards } from "@/components/ArticleCards";
import { StorybookShowcaseReader } from "@/components/StorybookShowcaseReader";
import { VideoShowcasePlayer } from "@/components/VideoShowcasePlayer";
import {
  BLOG_ARTICLES,
  getServiceLandingBySlug,
  type ServiceLandingItem,
} from "@/lib/site-content";

export function ServiceLandingView({ item }: { item: ServiceLandingItem }) {
  const { lang, l } = useLanguage();
  const { pricing, getStorybookPrice, getServicePrice } = usePricing();
  const isUk = lang === "uk";

  const svcConfig = item.serviceId ? pricing.services[item.serviceId] : undefined;
  const isLiveOrderable = Boolean(
    item.constructorHref && (svcConfig?.enabled ?? true) && !(svcConfig?.comingSoon ?? false)
  );
  const priceUah = item.serviceId
    ? getServicePrice(item.serviceId, item.serviceId === "storybook" ? { pageCount: 6 } : undefined)
    : item.fallbackPriceUah ?? null;
  const sbLongPrice = getStorybookPrice(8);

  const relatedItems = item.relatedSlugs
    .map((slug) => getServiceLandingBySlug(slug))
    .filter((entry): entry is ServiceLandingItem => Boolean(entry));

  return (
    <div className="space-y-14 pb-12">
      <div>
        <Breadcrumbs items={[{ label: item.label }]} />

        {/* Service Hero */}
        <section className="overflow-hidden rounded-3xl border border-amber-200/20 bg-gradient-to-br from-[#141f3f] via-[#101831] to-[#0b1020] p-6 shadow-2xl sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  {svcConfig?.badgeLabel?.[lang] || item.tag[lang]}
                </span>
                {priceUah !== null && (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-200">
                    {item.serviceId === "storybook"
                      ? isUk
                        ? `від ${priceUah} ₴ (8 стор. — ${sbLongPrice} ₴)`
                        : `от ${priceUah} ₴ (8 стр. — ${sbLongPrice} ₴)`
                      : `${priceUah} ₴`}
                  </span>
                )}
              </div>

              <h1 className="font-serif-book text-3xl font-bold leading-tight text-amber-50 sm:text-4xl lg:text-5xl">
                {item.h1[lang]}
              </h1>

              <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
                {item.intro[lang]}
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                {isLiveOrderable && item.constructorHref ? (
                  <>
                    <Link
                      href={l(item.constructorHref)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3.5 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 transition hover:brightness-105"
                    >
                      {item.serviceId === "storybook" ? (
                        <BookOpen className="h-4 w-4" />
                      ) : (
                        <Video className="h-4 w-4" />
                      )}
                      {isUk ? "Замовити зараз" : "Заказать сейчас"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    {item.showcaseKind && (
                      <a
                        href="#demo"
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200/30 bg-white/5 px-5 py-3.5 text-sm font-semibold text-amber-100 transition hover:bg-white/10"
                      >
                        {isUk ? "Дивитись приклад" : "Смотреть пример"}
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-200">
                      <Clock className="h-4 w-4" />
                      {isUk
                        ? "Формат готується до запуску"
                        : "Формат готовится к запуску"}
                    </span>
                    <Link
                      href={l(item.slug === "multfilm-pro-dytynu" ? "/create/storybook" : "/create/video")}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      {item.slug === "multfilm-pro-dytynu"
                        ? isUk
                          ? "Замовити іменну казку PDF"
                          : "Заказать именную сказку PDF"
                        : isUk
                          ? "Замовити відео від Миколая"
                          : "Заказать видео от Николая"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>

              <p className="text-xs text-slate-400">{item.heroFootnote[lang]}</p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0b1020] shadow-xl">
              <img
                src={item.previewImage}
                alt={item.label[lang]}
                className="aspect-[4/3] w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020]/90 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-xs">
                <span className="rounded-lg bg-black/70 px-2.5 py-1 font-medium text-amber-100 backdrop-blur-xs">
                  {item.previewIsConcept
                    ? isUk
                      ? "Концепт атмосфери"
                      : "Концепт атмосферы"
                    : isUk
                      ? "Приклад готового результату"
                      : "Пример готового результата"}
                </span>
                {svcConfig?.features?.[lang]?.[0] && (
                  <span className="hidden rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 backdrop-blur-xs sm:inline">
                    <CheckCircle2 className="mr-1 inline h-3 w-3" />
                    {isUk ? "Прев’ю до оплати" : "Превью до оплаты"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Live Demo Showcase */}
      {item.showcaseKind === "storybook" && (
        <section id="demo" className="scroll-mt-24">
          <StorybookShowcaseReader />
        </section>
      )}
      {item.showcaseKind === "video" && (
        <section id="demo" className="scroll-mt-24">
          <VideoShowcasePlayer />
        </section>
      )}

      {/* Detailed Content Sections */}
      <div className="space-y-8">
        {item.sections.map((section) => {
          if (section.steps) {
            const stepsList = section.steps[lang];
            return (
              <section key={section.title.uk} className="space-y-4">
                <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
                  {section.title[lang]}
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {stepsList.map((stepText, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/10 bg-[#121a30]/80 p-5 space-y-2"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-200">
                        {idx + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-slate-200">
                        {stepText}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          return (
            <section
              key={section.title.uk}
              className="rounded-2xl border border-white/10 bg-[#121a30]/75 p-6 sm:p-8 space-y-3"
            >
              <h2 className="font-serif-book text-xl font-bold text-amber-50 sm:text-2xl">
                {section.title[lang]}
              </h2>
              <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
                {section.includePriceNote && priceUah !== null && (
                  <strong className="mr-1.5 text-amber-200">
                    {isUk ? `Від ${priceUah} грн.` : `От ${priceUah} грн.`}
                  </strong>
                )}
                {section.text?.[lang]}
              </p>
              {section.priceLink && (
                <Link
                  href={l("/tsiny")}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-amber-200"
                >
                  {isUk ? "Переглянути всі ціни" : "Посмотреть все цены"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </section>
          );
        })}
      </div>

      {/* Service FAQ */}
      <FaqSection items={item.faq} />

      {/* Related Services */}
      {relatedItems.length > 0 && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif-book text-2xl font-bold text-amber-50">
              {isUk ? "Інші привітання та подарунки" : "Другие поздравления и подарки"}
            </h2>
            <Link
              href={l("/tsiny")}
              className="inline-flex items-center gap-1 text-sm font-semibold text-amber-300 hover:text-amber-200"
            >
              {isUk ? "Усі ціни" : "Все цены"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {relatedItems.map((rel) => {
              const relSvc = rel.serviceId
                ? pricing.services[rel.serviceId]
                : undefined;
              const relPrice = rel.serviceId
                ? getServicePrice(rel.serviceId)
                : rel.fallbackPriceUah ?? null;
              const relOrderable = Boolean(
                rel.constructorHref &&
                  (relSvc?.enabled ?? true) &&
                  !(relSvc?.comingSoon ?? false)
              );

              return (
                <div
                  key={rel.slug}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#121a30]/85 shadow-xl"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                    <img
                      src={rel.previewImage}
                      alt={rel.label[lang]}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121a30] via-transparent to-transparent" />
                    {relPrice !== null && (
                      <span className="absolute bottom-2.5 right-3 rounded-lg bg-[#0b1020]/85 px-2.5 py-1 text-xs font-bold text-amber-200">
                        {isUk ? `від ${relPrice} ₴` : `от ${relPrice} ₴`}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
                    <div className="space-y-1.5">
                      <h3 className="font-serif-book text-lg font-bold text-white">
                        {rel.label[lang]}
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-300">
                        {rel.short[lang]}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={l(`/${rel.slug}`)}
                        className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                      >
                        {isUk ? "Детальніше" : "Подробнее"}
                      </Link>
                      {relOrderable && rel.constructorHref ? (
                        <Link
                          href={l(rel.constructorHref)}
                          className="inline-flex items-center justify-center gap-1 rounded-xl bg-amber-400 px-3 py-2.5 text-xs font-bold text-[#0b1020] transition hover:bg-amber-300"
                        >
                          {isUk ? "Замовити" : "Заказать"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-xl border border-amber-300/20 bg-amber-400/5 px-3 py-2.5 text-[11px] font-medium text-amber-200">
                          {isUk ? "Скоро запуск" : "Скоро запуск"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Blog Articles */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif-book text-2xl font-bold text-amber-50">
            {isUk ? "Ідеї для вашого привітання" : "Идеи для вашего поздравления"}
          </h2>
          <Link
            href={l("/blog")}
            className="inline-flex items-center gap-1 text-sm font-semibold text-amber-300 hover:text-amber-200"
          >
            {isUk ? "Усі статті" : "Все статьи"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ArticleCards articles={BLOG_ARTICLES} />
      </section>
    </div>
  );
}
