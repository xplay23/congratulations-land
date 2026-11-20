"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import { openCookieSettings } from "@/components/CookieConsent";
import { SERVICE_CATALOG } from "@/lib/site-content";

export function SiteFooter() {
  const { lang, l } = useLanguage();
  const isUk = lang === "uk";

  const footerServices = SERVICE_CATALOG.filter(
    (item) => item.slug !== "novyj-rik" && item.slug !== "multfilm-pro-dytynu"
  );

  return (
    <footer className="mt-16 border-t border-amber-200/15 bg-[#080c18]/90">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Link href={l("/")} className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff8f0] p-1.5 shadow-md">
                <img
                  src="/assets/video-gift.svg"
                  alt="VideoVitannya"
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="font-serif-book text-xl font-bold text-amber-100">
                VideoVitannya
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-300">
              {isUk
                ? "Для тих, хто дарує трохи більше, ніж подарунок. Іменні казки PDF та відеопривітання."
                : "Для тех, кто дарит чуть больше, чем подарок. Именные сказки PDF и видеопоздравления."}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              {isUk ? "Послуги" : "Услуги"}
            </div>
            <ul className="space-y-2 text-slate-300">
              {footerServices.map((svc) => (
                <li key={svc.slug}>
                  <Link
                    href={l(`/${svc.slug}`)}
                    className="transition hover:text-amber-200"
                  >
                    {svc.label[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              {isUk ? "Сервіс" : "Сервис"}
            </div>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href={l("/tsiny")} className="transition hover:text-amber-200">
                  {isUk ? "Ціни" : "Цены"}
                </Link>
              </li>
              <li>
                <Link href={l("/my-orders")} className="transition hover:text-amber-200">
                  {isUk ? "Мої замовлення" : "Мои заказы"}
                </Link>
              </li>
              <li>
                <Link href={l("/pro-nas")} className="transition hover:text-amber-200">
                  {isUk ? "Про нас" : "О нас"}
                </Link>
              </li>
              <li>
                <Link href={l("/blog")} className="transition hover:text-amber-200">
                  {isUk ? "Блог" : "Блог"}
                </Link>
              </li>
              <li>
                <Link href={l("/kontakty")} className="transition hover:text-amber-200">
                  {isUk ? "Контакти" : "Контакты"}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              {isUk ? "Важливе" : "Информация"}
            </div>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href={l("/oferta")} className="transition hover:text-amber-200">
                  {isUk ? "Публічна оферта" : "Публичная оферта"}
                </Link>
              </li>
              <li>
                <Link
                  href={l("/konfidentsiynist")}
                  className="transition hover:text-amber-200"
                >
                  {isUk ? "Конфіденційність" : "Конфиденциальность"}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openCookieSettings()}
                  className="text-left transition hover:text-amber-200"
                >
                  {isUk ? "Налаштування cookies" : "Настройки cookies"}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 VideoVitannya</span>
          <span>
            {isUk
              ? "Особисті історії. Справжні емоції."
              : "Личные истории. Настоящие эмоции."}
          </span>
          <span>
            {isUk ? "Зроблено для України" : "Сделано для Украины"}
          </span>
        </div>
      </div>
    </footer>
  );
}
