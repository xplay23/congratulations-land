"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  ChevronDown,
  FolderHeart,
  Menu,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { usePricing } from "./PricingContext";
import { stripLocalePrefix } from "@/lib/locale";
import { UI_TEXT } from "@/lib/i18n";
import type { CmsNavItem, CmsSiteShell } from "@/lib/cms-content";

function NavIcon({ icon }: { icon: CmsNavItem["icon"] }) {
  const cls = "h-4 w-4 text-amber-300";
  if (icon === "video") return <Video className={cls} />;
  if (icon === "book") return <BookOpen className={cls} />;
  if (icon === "orders") return <FolderHeart className={cls} />;
  if (icon === "sparkles") return <Sparkles className={cls} />;
  return null;
}

export function SiteHeader({ shell }: { shell?: CmsSiteShell }) {
  const pathname = usePathname() || "/";
  const cleanPath = stripLocalePrefix(pathname);
  const { lang, setLang, l, setAssistantOpen } = useLanguage();
  const { pricing } = usePricing();
  const [menuOpen, setMenuOpen] = useState(false);

  const t = UI_TEXT[lang];
  const isUk = lang === "uk";

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

  const rawItems: CmsNavItem[] =
    shell?.headerItems && shell.headerItems.length > 0
      ? shell.headerItems
      : [
          { label: t.navHome, href: "/", icon: "none" },
          {
            label: t.navVideo,
            href: "/svyatyj-mykolaj",
            icon: "video",
            serviceKey: "video",
          },
          {
            label: t.navStorybook,
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
        ];

  const isEnabledItem = (item: CmsNavItem): boolean => {
    if (!item.serviceKey || item.serviceKey === "none") return true;
    return pricing.services[item.serviceKey]?.enabled ?? true;
  };

  const navItems = rawItems
    .filter(isEnabledItem)
    .map((item) => ({
      ...item,
      children: item.children?.filter(isEnabledItem),
    }));

  const isActiveHref = (href: string): boolean => {
    if (href === "/") return cleanPath === "/";
    if (href === "/svyatyj-mykolaj") {
      return cleanPath === "/svyatyj-mykolaj" || cleanPath === "/create/video";
    }
    if (href === "/kazka") {
      return cleanPath === "/kazka" || cleanPath === "/create/storybook";
    }
    return cleanPath === href || cleanPath.startsWith(`${href}/`);
  };

  const linkClass = (active: boolean) =>
    `transition hover:text-amber-300 ${
      active ? "text-amber-300 font-semibold" : "text-slate-200"
    }`;

  const brandName = shell?.siteName || t.brand;
  const logoUrl = shell?.logoUrl || "/assets/video-gift.svg";

  return (
    <header className="sticky top-0 z-40 border-b border-amber-200/15 bg-[#0b1020]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <Link href={l("/")} className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff8f0] p-1 shadow-lg shadow-amber-500/15">
            <img
              src={logoUrl}
              alt={brandName}
              className="h-full w-full object-contain"
            />
          </span>
          <div>
            <span className="font-serif-book text-lg font-bold tracking-wide text-amber-100">
              {brandName}
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
          {navItems.map((item) => {
            const targetHref = item.href.startsWith("http")
              ? item.href
              : l(item.href);
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const active =
              isActiveHref(item.href) ||
              Boolean(item.children?.some((c) => isActiveHref(c.href)));

            if (!hasChildren) {
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={targetHref}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                  className={`flex items-center gap-1.5 ${linkClass(active)}`}
                >
                  <NavIcon icon={item.icon} />
                  {item.label}
                </Link>
              );
            }

            return (
              <div
                key={`${item.href}-${item.label}`}
                className="group relative py-1"
              >
                <Link
                  href={targetHref}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                  className={`flex items-center gap-1.5 ${linkClass(active)}`}
                >
                  <NavIcon icon={item.icon} />
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-75 transition-transform group-hover:rotate-180" />
                </Link>
                <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="min-w-[220px] rounded-2xl border border-amber-200/20 bg-[#0d1428]/95 p-2 shadow-2xl backdrop-blur-md">
                    {item.children!.map((child) => {
                      const childHref = child.href.startsWith("http")
                        ? child.href
                        : l(child.href);
                      return (
                        <Link
                          key={`${child.href}-${child.label}`}
                          href={childHref}
                          target={child.openInNewTab ? "_blank" : undefined}
                          rel={
                            child.openInNewTab
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition hover:bg-white/10 ${
                            isActiveHref(child.href)
                              ? "bg-amber-400/15 text-amber-200"
                              : "text-slate-200"
                          }`}
                        >
                          <NavIcon icon={child.icon} />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
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
          <div className="flex flex-col space-y-1.5 text-sm font-medium">
            {navItems.map((item) => {
              const targetHref = item.href.startsWith("http")
                ? item.href
                : l(item.href);
              return (
                <div key={`m-${item.href}-${item.label}`}>
                  <Link
                    href={targetHref}
                    target={item.openInNewTab ? "_blank" : undefined}
                    rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-200 hover:bg-white/5"
                  >
                    <NavIcon icon={item.icon} />
                    {item.label}
                  </Link>
                  {item.children && item.children.length > 0 && (
                    <div className="ml-5 space-y-1 border-l border-white/10 pl-3 py-1">
                      {item.children.map((child) => {
                        const childHref = child.href.startsWith("http")
                          ? child.href
                          : l(child.href);
                        return (
                          <Link
                            key={`mc-${child.href}-${child.label}`}
                            href={childHref}
                            target={child.openInNewTab ? "_blank" : undefined}
                            rel={
                              child.openInNewTab
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-amber-200"
                          >
                            <NavIcon icon={child.icon} />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
