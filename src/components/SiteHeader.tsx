"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Bot, FolderHeart, Menu, Video, X } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { usePricing } from "./PricingContext";
import { stripLocalePrefix } from "@/lib/locale";
import { UI_TEXT } from "@/lib/i18n";

export function SiteHeader() {
  const pathname = usePathname() || "/";
  const cleanPath = stripLocalePrefix(pathname);
  const { lang, setLang, l, setAssistantOpen } = useLanguage();
  const { pricing } = usePricing();
  const [menuOpen, setMenuOpen] = useState(false);

  const t = UI_TEXT[lang];
  const isUk = lang === "uk";
  const sbEnabled = pricing.services.storybook?.enabled ?? true;
  const videoEnabled = pricing.services.video?.enabled ?? true;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const linkClass = (active: boolean) =>
    `transition hover:text-amber-300 ${
      active ? "text-amber-300 font-semibold" : "text-slate-200"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-amber-200/15 bg-[#0b1020]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <Link href={l("/")} className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff8f0] p-1 shadow-lg shadow-amber-500/15">
            <img
              src="/assets/video-gift.svg"
              alt="VideoVitannya"
              className="h-full w-full object-contain"
            />
          </span>
          <div>
            <span className="font-serif-book text-lg font-bold tracking-wide text-amber-100">
              {t.brand}
            </span>
            <p className="hidden text-[11px] text-slate-400 lg:block">{t.tagline}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
          <Link href={l("/")} className={linkClass(cleanPath === "/")}>
            {t.navHome}
          </Link>
          {videoEnabled && (
            <Link
              href={l("/svyatyj-mykolaj")}
              className={`flex items-center gap-1.5 ${linkClass(
                cleanPath === "/svyatyj-mykolaj" || cleanPath === "/create/video"
              )}`}
            >
              <Video className="h-4 w-4 text-amber-300" />
              {t.navVideo}
            </Link>
          )}
          {sbEnabled && (
            <Link
              href={l("/kazka")}
              className={`flex items-center gap-1.5 ${linkClass(
                cleanPath === "/kazka" || cleanPath === "/create/storybook"
              )}`}
            >
              <BookOpen className="h-4 w-4 text-amber-300" />
              {t.navStorybook}
            </Link>
          )}
          <Link href={l("/tsiny")} className={linkClass(cleanPath === "/tsiny")}>
            {isUk ? "Ціни" : "Цены"}
          </Link>
          <Link
            href={l("/blog")}
            className={linkClass(cleanPath.startsWith("/blog"))}
          >
            {isUk ? "Блог" : "Блог"}
          </Link>
          <Link
            href={l("/my-orders")}
            className={`flex items-center gap-1.5 ${linkClass(cleanPath === "/my-orders")}`}
          >
            <FolderHeart className="h-4 w-4 text-amber-300" />
            {isUk ? "Мої замовлення" : "Мои заказы"}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLang("uk")}
              className={`rounded-md px-2.5 py-1 transition ${
                lang === "uk"
                  ? "bg-amber-400 text-[#0b1020]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              UA
            </button>
            <button
              type="button"
              onClick={() => setLang("ru")}
              className={`rounded-md px-2.5 py-1 transition ${
                lang === "ru"
                  ? "bg-amber-400 text-[#0b1020]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              RU
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300/35 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/20"
          >
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">{t.assistantBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label={
              menuOpen
                ? isUk
                  ? "Закрити меню"
                  : "Закрыть меню"
                : isUk
                  ? "Відкрити меню"
                  : "Открыть меню"
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/10 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label={isUk ? "Мобільне меню" : "Мобильное меню"}
          className="border-t border-white/10 bg-[#0b1020] px-4 py-4 md:hidden"
        >
          <div className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              href={l("/")}
              className="rounded-xl px-3 py-2 text-slate-200 hover:bg-white/5"
            >
              {t.navHome}
            </Link>
            {videoEnabled && (
              <Link
                href={l("/svyatyj-mykolaj")}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-200 hover:bg-white/5"
              >
                <Video className="h-4 w-4 text-amber-300" />
                {t.navVideo}
              </Link>
            )}
            {sbEnabled && (
              <Link
                href={l("/kazka")}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-200 hover:bg-white/5"
              >
                <BookOpen className="h-4 w-4 text-amber-300" />
                {t.navStorybook}
              </Link>
            )}
            <Link
              href={l("/tsiny")}
              className="rounded-xl px-3 py-2 text-slate-200 hover:bg-white/5"
            >
              {isUk ? "Ціни" : "Цены"}
            </Link>
            <Link
              href={l("/blog")}
              className="rounded-xl px-3 py-2 text-slate-200 hover:bg-white/5"
            >
              {isUk ? "Блог" : "Блог"}
            </Link>
            <Link
              href={l("/my-orders")}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-200 hover:bg-white/5"
            >
              <FolderHeart className="h-4 w-4 text-amber-300" />
              {isUk ? "Мої замовлення" : "Мои заказы"}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
