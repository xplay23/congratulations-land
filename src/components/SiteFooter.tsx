"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import { openCookieSettings } from "@/components/CookieConsent";
import { SERVICE_CATALOG } from "@/lib/site-content";
import type { CmsSiteShell } from "@/lib/cms-content";

export function SiteFooter({ shell }: { shell?: CmsSiteShell }) {
  const { lang, l } = useLanguage();
  const isUk = lang === "uk";

  const footerServices = SERVICE_CATALOG.filter(
    (item) => item.slug !== "novyj-rik" && item.slug !== "multfilm-pro-dytynu"
  );

  const columns: CmsSiteShell["footerColumns"] =
    shell?.footerColumns && shell.footerColumns.length > 0
      ? shell.footerColumns
      : [
          {
            heading: isUk ? "Послуги" : "Услуги",
            links: footerServices.map((svc) => ({
              label: svc.label[lang],
              href: `/${svc.slug}`,
            })),
          },
          {
            heading: isUk ? "Сервіс" : "Сервис",
            links: [
              { label: isUk ? "Ціни" : "Цены", href: "/tsiny" },
              {
                label: isUk ? "Мої замовлення" : "Мои заказы",
                href: "/my-orders",
              },
              { label: isUk ? "Про нас" : "О нас", href: "/pro-nas" },
              { label: "Блог", href: "/blog" },
              { label: isUk ? "Контакти" : "Контакты", href: "/kontakty" },
            ],
          },
        ];

  const legalLinks =
    shell?.footerLegalLinks && shell.footerLegalLinks.length > 0
      ? shell.footerLegalLinks
      : [
          {
            label: isUk ? "Публічна оферта" : "Публичная оферта",
            href: "/oferta",
          },
          {
            label: isUk ? "Конфіденційність" : "Конфиденциальность",
            href: "/konfidentsiynist",
          },
        ];

  const brandName = shell?.siteName || "VideoVitannya";
  const logoUrl = shell?.logoUrl || "/assets/video-gift.svg";

  return (
    <footer className="mt-16 border-t border-amber-200/15 bg-[#080c18]/90">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Link href={l("/")} className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff8f0] p-1.5 shadow-md">
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="brand-wordmark font-serif-book text-xl font-bold text-amber-100">
                {brandName}
              </span>
            </Link>
            {shell?.footerTextHtml ? (
              <div
                className="max-w-xs text-sm leading-relaxed text-slate-300 [&_p]:m-0"
                dangerouslySetInnerHTML={{ __html: shell.footerTextHtml }}
              />
            ) : (
              <p className="max-w-xs text-sm leading-relaxed text-slate-300">
                {isUk
                  ? "Для тих, хто дарує трохи більше, ніж подарунок. Іменні казки PDF та відеопривітання."
                  : "Для тех, кто дарит чуть больше, чем подарок. Именные сказки PDF и видеопоздравления."}
              </p>
            )}

            {shell?.socialLinks && shell.socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {shell.socialLinks.map((soc) => (
                  <a
                    key={`${soc.platform}-${soc.url}`}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="site-button rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-amber-300/40 hover:text-amber-200"
                  >
                    {soc.label || soc.platform}
                  </a>
                ))}
              </div>
            )}
          </div>

          {columns.slice(0, 2).map((col) => (
            <div key={col.heading} className="space-y-3 text-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                {col.heading}
              </div>
              <ul className="space-y-2 text-slate-300">
                {col.links.map((item) => (
                  <li key={`${item.href}-${item.label}`}>
                    <Link
                      href={item.href.startsWith("http") ? item.href : l(item.href)}
                      target={item.openInNewTab ? "_blank" : undefined}
                      rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                      className="transition hover:text-amber-200"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-3 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              {isUk ? "Важливе" : "Информация"}
            </div>
            <ul className="space-y-2 text-slate-300">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href.startsWith("http") ? item.href : l(item.href)}
                    className="transition hover:text-amber-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
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
          {shell?.copyrightTextHtml ? (
            <div
              className="[&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: shell.copyrightTextHtml }}
            />
          ) : (
            <span>© 2026 {brandName}</span>
          )}
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
