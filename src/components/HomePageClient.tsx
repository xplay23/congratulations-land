"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Video,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { usePricing } from "@/components/PricingContext";
import { StorybookShowcaseReader } from "@/components/StorybookShowcaseReader";
import { VideoShowcasePlayer } from "@/components/VideoShowcasePlayer";
import { FaqSection } from "@/components/FaqSection";
import { ArticleCards } from "@/components/ArticleCards";
import { UI_TEXT } from "@/lib/i18n";
import {
  BLOG_ARTICLES,
  HOME_FAQ,
  SERVICE_CATALOG,
  getServiceLandingById,
} from "@/lib/site-content";
import type {
  CmsBlogPostItem,
  CmsReviewItem,
  CmsShowcasesBundle,
} from "@/lib/cms-content";
import type { ServiceId } from "@/lib/types";

export function HomePageClient({
  showcases,
  reviews = [],
  articles,
}: {
  showcases?: CmsShowcasesBundle;
  reviews?: CmsReviewItem[];
  articles?: CmsBlogPostItem[];
}) {
  const router = useRouter();
  const { lang, l } = useLanguage();
  const { pricing, getStorybookPrice, getVideoPrice } = usePricing();
  const t = UI_TEXT[lang];
  const isUk = lang === "uk";

  const sbSvc = pricing.services.storybook;
  const vidSvc = pricing.services.video;
  const sbEnabled = sbSvc?.enabled ?? true;
  const vidEnabled = vidSvc?.enabled ?? true;
  const sbBasePrice = getStorybookPrice(6);
  const sbLongPrice = getStorybookPrice(8);
  const videoPrice = getVideoPrice();

  const extraEnabledServices = (
    ["photo_animation", "song", "postcard"] as ServiceId[]
  )
    .map((id) => pricing.services[id])
    .filter((svc) => Boolean(svc?.enabled));

  const upcomingHiddenServices = (
    ["photo_animation", "song", "postcard"] as ServiceId[]
  )
    .filter((id) => !(pricing.services[id]?.enabled ?? false))
    .map((id) => getServiceLandingById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const visibleCount =
    (sbEnabled ? 1 : 0) + (vidEnabled ? 1 : 0) + extraEnabledServices.length;

  const [quickService, setQuickService] = useState<string>(
    vidEnabled ? "video" : "storybook"
  );
  const [demoTab, setDemoTab] = useState<"video" | "storybook">("video");

  const quickLanding = SERVICE_CATALOG.find(
    (s) => (s.serviceId || s.slug) === quickService
  );
  const quickTargetHref =
    quickLanding?.constructorHref || `/${quickLanding?.slug || "kazka"}`;

  return (
    <div className="space-y-16 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-200/20 bg-gradient-to-br from-[#141f3f] via-[#101831] to-[#0b1020] p-7 shadow-2xl sm:p-12">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-200">
            <Sparkles className="h-3.5 w-3.5" />
            {isUk ? "Україна • UA / RU • Plata by mono" : "Украина • UA / RU • Plata by mono"}
          </div>
          <h1 className="font-serif-book text-3xl font-bold leading-tight text-amber-50 sm:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="text-base leading-relaxed text-slate-300 sm:text-lg">{t.heroSub}</p>

          {/* Quick Service Picker + Direct CTAs */}
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
                  {isUk ? "Пісня з іменем (скоро)" : "Песня с именем (скоро)"}
                </option>
                <option value="postcard">
                  {isUk
                    ? "День народження / Листівка (скоро)"
                    : "День рождения / Открытка (скоро)"}
                </option>
              </select>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 transition hover:brightness-105"
              >
                {quickLanding?.constructorHref
                  ? isUk
                    ? "Замовити"
                    : "Заказать"
                  : isUk
                    ? "Детальніше"
                    : "Подробнее"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {(sbEnabled || vidEnabled) && (
              <div className="flex flex-wrap gap-3 pt-1">
                {vidEnabled && (
                  <Link
                    href={l("/create/video")}
                    className="site-button inline-flex items-center gap-2 rounded-xl border border-amber-300/35 bg-amber-400/15 px-5 py-2.5 text-xs font-bold text-amber-100 transition hover:bg-amber-400/25"
                  >
                    <Video className="h-4 w-4 text-amber-300" />
                    {t.ctaVideo}
                  </Link>
                )}
                {sbEnabled && (
                  <Link
                    href={l("/create/storybook")}
                    className="site-button inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    <BookOpen className="h-4 w-4 text-amber-300" />
                    {t.ctaStorybook}
                  </Link>
                )}
                <a
                  href="#live-demos"
                  className="site-button inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:text-amber-200"
                >
                  <PlayCircle className="h-4 w-4 text-sky-300" />
                  {isUk ? "Живі приклади робіт" : "Живые примеры работ"}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Live Demos ("Товар лицом") */}
      <section id="live-demos" className="space-y-5 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              {isUk ? "Живі приклади готових замовлень" : "Живые примеры готовых заказов"}
            </span>
            <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
              {isUk
                ? "Подивіться й послухайте перед замовленням"
                : "Посмотрите и послушайте перед заказом"}
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

      {/* Services Grid */}
      <section id="gifts" className="space-y-6 scroll-mt-24">
        <div className="space-y-2">
          <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
            {isUk
              ? "Особистий подарунок. Для кожної вашої людини."
              : "Личный подарок. Для каждого дорогого человека."}
          </h2>
          <p className="max-w-2xl text-sm text-slate-300">
            {isUk
              ? "Оберіть привітання, у якому прозвучить ім’я та ваші слова. Можна переглянути детальний опис або одразу перейти у конструктор."
              : "Выберите поздравление, в котором прозвучит имя и ваши слова. Можно изучить подробное описание или сразу перейти в конструктор."}
          </p>
        </div>

        {visibleCount === 0 ? (
          <div className="rounded-2xl border border-amber-300/20 bg-[#121a30]/90 p-8 text-center text-sm text-slate-300">
            {isUk
              ? "Сервіси тимчасово недоступні для нових замовлень. Будь ласка, завітайте пізніше."
              : "Сервисы временно недоступны для новых заказов. Пожалуйста, загляните позже."}
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              visibleCount === 1 ? "max-w-xl mx-auto" : "md:grid-cols-2"
            }`}
          >
            {/* Video Greeting Card */}
            {vidEnabled && vidSvc && (
              <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#121a30]/90 shadow-xl transition duration-200 hover:border-amber-300/45 hover:bg-[#151f38] hover:shadow-2xl hover:shadow-amber-500/10">
                <Link
                  href={l("/svyatyj-mykolaj")}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900"
                >
                  <img
                    src="/samples/nicholas_preview.jpg"
                    alt="Video greeting sample"
                    className="h-full w-full object-cover object-top scale-[1.01] transform-gpu will-change-transform transition-transform duration-300 ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121a30] via-[#121a30]/15 to-transparent" />
                  <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-sky-400/20 px-3 py-1 text-xs font-semibold text-sky-200 backdrop-blur-xs">
                      <Video className="h-4 w-4" />
                      {vidSvc.badgeLabel?.[lang] ||
                        (isUk ? "Персональне відео • HD" : "Персональное видео • HD")}
                    </span>
                    <span className="rounded-lg bg-[#0b1020]/80 px-2.5 py-1 text-lg font-bold text-amber-200">
                      {videoPrice} ₴
                    </span>
                  </div>
                </Link>
                <div className="flex flex-1 flex-col justify-between p-7 pt-4">
                  <div className="space-y-4">
                    <h3 className="font-serif-book text-2xl font-bold text-white">
                      {vidSvc.title[lang]}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-300">
                      {vidSvc.description[lang]}
                    </p>
                    {vidSvc.features?.[lang]?.length ? (
                      <ul className="space-y-2 text-xs text-slate-300">
                        {vidSvc.features[lang].map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <Link
                      href={l("/svyatyj-mykolaj")}
                      className="site-button inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                    >
                      {isUk ? "Детальніше" : "Подробнее"}
                    </Link>
                    <Link
                      href={l("/create/video")}
                      className="site-button inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-[#0b1020] transition hover:bg-amber-300"
                    >
                      {isUk ? "Замовити" : "Заказать"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Storybook Card */}
            {sbEnabled && sbSvc && (
              <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#121a30]/90 shadow-xl transition duration-200 hover:border-amber-300/45 hover:bg-[#151f38] hover:shadow-2xl hover:shadow-amber-500/10">
                <Link
                  href={l("/kazka")}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900"
                >
                  <img
                    src="/samples/storybooks/uk/cover.jpg"
                    alt="Storybook sample"
                    className="h-full w-full object-cover object-center scale-[1.01] transform-gpu will-change-transform transition-transform duration-300 ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121a30] via-[#121a30]/15 to-transparent" />
                  <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200 backdrop-blur-xs">
                      <BookOpen className="h-4 w-4" />
                      {sbSvc.badgeLabel?.[lang] ||
                        (isUk ? "Іменна книга • PDF" : "Именная книга • PDF")}
                    </span>
                    <div className="rounded-lg bg-[#0b1020]/85 px-2.5 py-1 text-right">
                      <div className="text-lg font-bold leading-tight text-amber-200">
                        {sbBasePrice} ₴
                      </div>
                      <div className="text-[10px] text-slate-300">
                        {isUk
                          ? `4–6 стор. · 8 стор. — ${sbLongPrice} ₴`
                          : `4–6 стр. · 8 стр. — ${sbLongPrice} ₴`}
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="flex flex-1 flex-col justify-between p-7 pt-4">
                  <div className="space-y-4">
                    <h3 className="font-serif-book text-2xl font-bold text-white">
                      {sbSvc.title[lang]}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-300">
                      {sbSvc.description[lang]}
                    </p>
                    {sbSvc.features?.[lang]?.length ? (
                      <ul className="space-y-2 text-xs text-slate-300">
                        {sbSvc.features[lang].map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <Link
                      href={l("/kazka")}
                      className="site-button inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                    >
                      {isUk ? "Детальніше" : "Подробнее"}
                    </Link>
                    <Link
                      href={l("/create/storybook")}
                      className="site-button inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-[#0b1020] transition hover:bg-amber-300"
                    >
                      {isUk ? "Замовити" : "Заказать"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Services when enabled in Admin */}
            {extraEnabledServices.map((svc) => {
              const landing = getServiceLandingById(svc.id);
              const detailHref = landing ? `/${landing.slug}` : "/tsiny";
              return (
                <div
                  key={svc.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#121a30]/90 shadow-xl"
                >
                  {landing?.previewImage && (
                    <Link
                      href={l(detailHref)}
                      className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900"
                    >
                      <img
                        src={landing.previewImage}
                        alt={svc.title[lang]}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121a30] via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200 backdrop-blur-xs">
                          <Sparkles className="h-3.5 w-3.5" />
                          {svc.badgeLabel?.[lang] || (isUk ? "Скоро" : "Скоро")}
                        </span>
                        <span className="rounded-lg bg-[#0b1020]/80 px-2.5 py-1 text-lg font-bold text-amber-200">
                          {svc.basePriceUah} ₴
                        </span>
                      </div>
                    </Link>
                  )}

                  <div className="flex flex-1 flex-col justify-between p-7 pt-5">
                    <div className="space-y-4">
                      <h3 className="font-serif-book text-2xl font-bold text-white">
                        {svc.title[lang]}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-300">
                        {svc.description[lang]}
                      </p>
                      {svc.features?.[lang]?.length ? (
                        <ul className="space-y-2 text-xs text-slate-300">
                          {svc.features[lang].map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <Link
                        href={l(detailHref)}
                        className="site-button inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                      >
                        {isUk ? "Детальніше" : "Подробнее"}
                      </Link>
                      {svc.comingSoon || !landing?.constructorHref ? (
                        <span className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300/20 bg-amber-400/5 px-4 py-3 text-xs font-semibold text-amber-200">
                          <Clock className="h-3.5 w-3.5" />
                          {isUk ? "Скоро запуск" : "Скоро запуск"}
                        </span>
                      ) : (
                        <Link
                          href={l(landing.constructorHref)}
                          className="site-button inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-[#0b1020] transition hover:bg-amber-300"
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

        {/* Upcoming service pages teaser when disabled on storefront */}
        {upcomingHiddenServices.length > 0 && (
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
              {upcomingHiddenServices.map((item) => (
                <Link
                  key={item.slug}
                  href={l(`/${item.slug}`)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-amber-300/35 hover:bg-white/[0.06]"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {item.label[lang]}
                    </div>
                    <div className="text-[11px] text-slate-400">{item.tag[lang]}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-amber-300" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Funnel & Privacy */}
      <section className="space-y-5">
        <h2 className="font-serif-book text-2xl font-bold text-amber-100 sm:text-3xl">
          {t.howItWorks}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.steps.map((s) => (
            <div
              key={s.title}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-2"
            >
              <div className="text-sm font-bold text-amber-300">{s.title}</div>
              <p className="text-xs leading-relaxed text-slate-300">{s.desc}</p>
            </div>
          ))}
        </div>

        <Link
          href={l("/konfidentsiynist")}
          className="group flex items-start justify-between gap-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-5 text-xs text-slate-300 transition hover:border-emerald-400/45 hover:bg-emerald-500/10"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div className="space-y-1">
              <strong className="block text-sm text-emerald-200">
                {isUk
                  ? "Особисте залишається особистим"
                  : "Личное остаётся личным"}
              </strong>
              <p className="leading-relaxed">
                {isUk
                  ? "Усі завантажені фото очищуються від EXIF/GPS-метаданих перед обробкою, а вихідні знімки автоматично видаляються з сервера одразу після створення книжкового образу героя або відео."
                  : "Все загруженные фото очищаются от EXIF/GPS-метаданных перед обработкой, а исходные снимки автоматически удаляются с сервера сразу после создания книжного образа героя или видео."}
              </p>
            </div>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-emerald-300 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* SEO / Editorial Overview Block */}
      <section className="rounded-2xl border border-white/10 bg-[#121a30]/70 p-6 sm:p-8 space-y-3">
        <h2 className="font-serif-book text-xl font-bold text-amber-50 sm:text-2xl">
          {isUk
            ? "Персональні відео привітання та казки на замовлення: для кого і коли"
            : "Персональные видеопоздравления и сказки на заказ: для кого и когда"}
        </h2>
        <p className="text-sm leading-relaxed text-slate-300">
          {isUk
            ? "Персональне привітання або книга на замовлення чудово підходять там, де звичайної листівки замало. Святий Миколай звернеться до дитини чи дорослого по імені й покаже фото у Книзі добрих справ. Ілюстрована казка PDF перетворить дитину на головного героя власної пригоди. Ви самі задаєте деталі — ім’я, досягнення чи сюжет і стиль ілюстрацій — а перед оплатою завжди бачите реальне прев’ю."
            : "Персональное видеопоздравление или сказка на заказ идеально подходят там, где обычной открытки недостаточно. Святой Николай обратится к ребёнку или взрослому по имени и покажет фото в Книге добрых дел. Иллюстрированная сказка PDF сделает ребёнка главным героем настоящего приключения. Вы сами задаёте детали — имя, достижение или сюжет и стиль иллюстраций — и всегда видите реальное превью до оплаты."}
        </p>
      </section>

      {/* Parent Reviews (CMS) */}
      {reviews.length > 0 && (
        <section className="space-y-5">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              {isUk ? "Живі враження батьків" : "Живые впечатления родителей"}
            </span>
            <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
              {isUk ? "Відгуки про VideoVitannya" : "Отзывы о VideoVitannya"}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {reviews.slice(0, 4).map((rev) => (
              <div
                key={rev.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#121a30]/80 p-5 space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-0.5 text-amber-300">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="h-3.5 w-3.5 fill-amber-300 text-amber-300"
                      />
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-200">
                    «{rev.quote}»
                  </p>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="text-xs font-semibold text-white">
                    {rev.authorName}
                  </div>
                  {rev.authorLocation && (
                    <div className="text-[11px] text-slate-400">
                      {rev.authorLocation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Home FAQ */}
      <FaqSection items={HOME_FAQ} />

      {/* Blog Teaser */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-3xl">
            {isUk
              ? "Трохи натхнення для теплих слів"
              : "Немного вдохновения для тёплых слов"}
          </h2>
          <Link
            href={l("/blog")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-amber-200"
          >
            {isUk ? "Усі матеріали" : "Все материалы"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ArticleCards
          articles={articles && articles.length > 0 ? articles : BLOG_ARTICLES}
        />
      </section>

      {/* Closing CTA */}
      <section className="rounded-3xl border border-amber-300/25 bg-gradient-to-r from-[#19264d] via-[#141f3f] to-[#1b1f3b] p-8 text-center shadow-2xl sm:p-12 space-y-4">
        <h2 className="font-serif-book text-2xl font-bold text-amber-50 sm:text-4xl">
          {isUk
            ? "Зробіть звичайну мить особливою."
            : "Сделайте обычный момент особенным."}
        </h2>
        <p className="mx-auto max-w-xl text-sm text-slate-300 sm:text-base">
          {isUk
            ? "Замовте персональне відео привітання або казку з іменем для людини, яка вам дорога."
            : "Закажите персональное видеопоздравление или сказку с именем для человека, который вам дорог."}
        </p>
        <div className="pt-2">
          <a
            href="#gifts"
            className="site-button inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3.5 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 transition hover:brightness-105"
          >
            {isUk ? "Обрати привітання" : "Выбрать поздравление"}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
