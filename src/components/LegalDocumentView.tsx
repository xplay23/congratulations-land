"use client";

import Link from "next/link";
import { ArrowRight, Settings2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { openCookieSettings } from "@/components/CookieConsent";
import { LEGAL_PAGES, type LegalPageItem } from "@/lib/site-content";

export function LegalDocumentView({
  pageKey,
}: {
  pageKey: LegalPageItem["slug"];
}) {
  const { lang, l } = useLanguage();
  const isUk = lang === "uk";
  const doc = LEGAL_PAGES[pageKey];

  return (
    <article className="mx-auto max-w-3xl space-y-8 pb-12">
      <Breadcrumbs items={[{ label: doc.h1 }]} />

      <header className="space-y-3 rounded-3xl border border-amber-200/20 bg-gradient-to-br from-[#141f3f] to-[#0b1020] p-6 sm:p-9">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
          {doc.eyebrow[lang]}
        </span>
        <h1 className="font-serif-book text-3xl font-bold text-amber-50 sm:text-4xl">
          {doc.h1[lang]}
        </h1>
        <p className="text-sm leading-relaxed text-slate-300">
          {doc.description[lang]}
        </p>
      </header>

      <div className="space-y-5 rounded-3xl border border-white/10 bg-[#121a30]/80 p-6 sm:p-9">
        {doc.sections.map((section, idx) => (
          <section key={idx} className="space-y-2">
            {section.title && (
              <h2 className="font-serif-book text-lg font-bold text-amber-100 sm:text-xl">
                {section.title[lang]}
              </h2>
            )}
            <p className="text-sm leading-relaxed text-slate-300 sm:text-[15px]">
              {section.text[lang]}
            </p>
          </section>
        ))}

        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
          {pageKey === "konfidentsiynist" && (
            <button
              type="button"
              onClick={() => openCookieSettings()}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/20"
            >
              <Settings2 className="h-4 w-4" />
              {isUk ? "Налаштувати cookies" : "Настроить cookies"}
            </button>
          )}
          <Link
            href={l("/#gifts")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            {isUk ? "Оберіть ваше привітання" : "Выберите ваше поздравление"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
