"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { ART_STYLE_META, LAYOUT_META } from "@/lib/i18n";
import { DEMO_STORYBOOKS } from "@/lib/site-content";
import type { Lang } from "@/lib/types";

export function StorybookShowcaseReader({
  showOrderCta = true,
}: {
  showOrderCta?: boolean;
}) {
  const { lang, l } = useLanguage();
  const isUk = lang === "uk";
  const [selectedBookId, setSelectedBookId] = useState<Lang>(lang);

  useEffect(() => {
    setSelectedBookId(lang);
  }, [lang]);

  const book =
    DEMO_STORYBOOKS.find((b) => b.id === selectedBookId) ?? DEMO_STORYBOOKS[0];

  const styleLabel = ART_STYLE_META[book.artStyle]?.label[lang] || book.artStyle;
  const layoutLabel = LAYOUT_META[book.layoutMode]?.label[lang] || book.layoutMode;
  const pdfViewerUrl = `${book.pdfUrl}#view=FitH&navpanes=0`;

  return (
    <div className="rounded-3xl border border-amber-200/20 bg-[#121a30]/90 p-5 shadow-2xl sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
            <BookOpen className="h-3.5 w-3.5" />
            {isUk
              ? "Демонстрація реальних PDF-книг (UA / RU)"
              : "Демонстрация реальных PDF-книг (UA / RU)"}
          </div>
          <h3 className="font-serif-book text-xl font-bold text-white sm:text-2xl">
            {book.title}
          </h3>
          <p className="text-xs text-slate-300 sm:text-sm">{book.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {DEMO_STORYBOOKS.map((item) => {
            const active = item.id === book.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedBookId(item.id)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-amber-300 bg-amber-400 text-[#0b1020] shadow-md shadow-amber-500/20"
                    : "border-white/15 bg-white/5 text-slate-200 hover:border-amber-300/40 hover:bg-white/10"
                }`}
              >
                {item.badge[lang]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Book Meta Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-semibold text-amber-100">
            {isUk ? "Герой:" : "Герой:"} {book.childName} ({book.ageGroup}{" "}
            {isUk ? "р." : "л."})
          </span>
          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
            {styleLabel}
          </span>
          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
            {layoutLabel}
          </span>
          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
            {book.pages.length} {isUk ? "стор. + обкладинка" : "стр. + обложка"}
          </span>
          {book.companionLabel && (
            <span className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
              {isUk ? "Супутник:" : "Спутник:"} {book.companionLabel}
            </span>
          )}
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          #{book.orderId.slice(-6)}
        </span>
      </div>

      {/* Embedded Real PDF Viewer */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-amber-200/25 bg-[#090e1a] shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0d1428] px-4 py-2.5 text-xs text-slate-300">
          <span className="inline-flex items-center gap-2 font-medium text-amber-100">
            <FileText className="h-4 w-4 text-amber-300" />
            {isUk
              ? "Вбудований PDF-переглядач (реальна друкована верстка)"
              : "Встроенный PDF-просмотрщик (реальная печатная вёрстка)"}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={book.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-semibold text-slate-200 transition hover:bg-white/10 hover:text-amber-200"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {isUk ? "На весь екран" : "На весь экран"}
            </a>
            <a
              href={book.pdfUrl}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 font-semibold text-amber-200 transition hover:bg-amber-400/20"
            >
              <Download className="h-3.5 w-3.5" />
              {isUk ? "Завантажити PDF" : "Скачать PDF"}
            </a>
          </div>
        </div>

        <iframe
          key={pdfViewerUrl}
          src={pdfViewerUrl}
          title={book.title}
          className="h-[560px] w-full bg-[#1a2234] sm:h-[700px]"
        />
      </div>

      {/* Bottom Action Row */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <a
          href={book.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/35 bg-white/5 px-5 py-3 text-xs font-semibold text-amber-100 transition hover:bg-white/10"
        >
          <FileText className="h-4 w-4 text-amber-300" />
          {isUk
            ? "Відкрити PDF у новій вкладці"
            : "Открыть PDF в новой вкладке"}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        {showOrderCta && (
          <Link
            href={l("/create/storybook")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 transition hover:brightness-105"
          >
            {isUk ? "Зібрати власну казку" : "Собрать свою сказку"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
