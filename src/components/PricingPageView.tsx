"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { usePricing } from "@/components/PricingContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqSection } from "@/components/FaqSection";
import { PRICE_FAQ } from "@/lib/site-content";
import type { CmsServiceItem } from "@/lib/cms-content";

export function PricingPageView({
  services,
}: {
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
    <div className="space-y-12 pb-12">
      <div>
        <Breadcrumbs items={[{ label: isUk ? "Ціни" : "Цены" }]} />

        <header className="space-y-3 rounded-3xl border border-amber-200/20 bg-gradient-to-br from-[#141f3f] to-[#0b1020] p-6 sm:p-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            {isUk ? "Лише те, що ви обрали" : "Только то, что вы выбрали"}
          </span>
          <h1 className="font-serif-book text-3xl font-bold text-amber-50 sm:text-4xl">
            {isUk
              ? "Ціни на іменні казки, відео привітання та майбутні формати"
              : "Цены на именные сказки, видеопоздравления и будущие форматы"}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {isUk
              ? "У таблиці вказано разову вартість одного замовлення без підписок. Спочатку ви переглядаєте прев’ю, і лише потім оплачуєте через Plata by mono."
              : "В таблице указана разовая стоимость одного заказа без подписок. Сначала вы смотрите превью, и только потом оплачиваете через Plata by mono."}
          </p>
        </header>
      </div>

      {/* Pricing Table */}
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

      {/* What's included */}
      <section className="rounded-2xl border border-white/10 bg-[#121a30]/75 p-6 sm:p-8 space-y-4">
        <div className="space-y-1">
          <h2 className="font-serif-book text-2xl font-bold text-amber-50">
            {isUk ? "Що входить у ціну" : "Что входит в цену"}
          </h2>
          <p className="text-sm text-slate-400">
            {isUk
              ? "Один разовий платіж за готовий персональний подарунок."
              : "Один разовый платёж за готовый персональный подарок."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            isUk
              ? "Повна версія без водяного знака"
              : "Полная версия без водяного знака",
            isUk
              ? "Зручна доставка на Email і в Telegram"
              : "Удобная доставка на Email и в Telegram",
            isUk
              ? "Зберігання файлів у кабінеті 30 днів"
              : "Хранение файлов в кабинете 30 дней",
          ].map((bullet) => (
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

      <FaqSection items={PRICE_FAQ} />
    </div>
  );
}
