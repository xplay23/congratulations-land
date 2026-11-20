"use client";

import { Plus } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import type { BilingualText } from "@/lib/site-content";

export type FaqEntry =
  | { q: BilingualText; a: BilingualText }
  | { id?: string; question: string; answer: string };

function resolvePair(
  item: FaqEntry,
  lang: "uk" | "ru"
): { key: string; question: string; answer: string } {
  if ("question" in item) {
    return {
      key: item.id || item.question,
      question: item.question,
      answer: item.answer,
    };
  }
  return {
    key: item.q.uk,
    question: item.q[lang],
    answer: item.a[lang],
  };
}

export function FaqSection({
  items,
  title,
  subtitle,
}: {
  items: FaqEntry[];
  title?: BilingualText;
  subtitle?: BilingualText;
}) {
  const { lang } = useLanguage();
  const isUk = lang === "uk";

  if (!items.length) return null;

  const heading =
    title?.[lang] || (isUk ? "Питання та відповіді" : "Вопросы и ответы");
  const sub =
    subtitle?.[lang] ||
    (isUk ? "Щоб обрати подарунок було легко." : "Чтобы выбрать подарок было легко.");

  const resolved = items.map((item) => resolvePair(item, lang));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: resolved.map((item) => ({
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
        {resolved.map((item) => (
          <details key={item.key} className="group p-5">
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
