"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import type { BilingualText } from "@/lib/site-content";

export interface BreadcrumbItem {
  label: BilingualText | string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const { lang, l } = useLanguage();
  const homeLabel = lang === "uk" ? "Головна" : "Главная";

  const fullItems: BreadcrumbItem[] = [
    { label: homeLabel, href: "/" },
    ...items,
  ];

  return (
    <nav
      aria-label={lang === "uk" ? "Хлібні крихти" : "Навигация по сайту"}
      className="mb-6 text-xs text-slate-400"
    >
      <ol className="flex flex-wrap items-center gap-2">
        {fullItems.map((item, idx) => {
          const text =
            typeof item.label === "string" ? item.label : item.label[lang];
          const isLast = idx === fullItems.length - 1;
          return (
            <li key={`${text}-${idx}`} className="flex items-center gap-2">
              {idx > 0 && <span className="text-slate-600">/</span>}
              {item.href && !isLast ? (
                <Link
                  href={l(item.href)}
                  className="transition hover:text-amber-200"
                >
                  {text}
                </Link>
              ) : (
                <span aria-current="page" className="text-amber-100 font-medium">
                  {text}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
