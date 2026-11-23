"use client";

import React, { useEffect } from "react";
import { X, Languages } from "lucide-react";
import type { AgeGroup, ChildGender, Lang } from "@/lib/types";

export function SectionHeading({
  title,
  badge,
}: {
  title: string;
  badge?: string;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-2 border-l-2 border-amber-400 pl-3">
      <h3 className="text-sm font-bold tracking-wide text-amber-100 sm:text-base">
        {title}
      </h3>
      {badge && (
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-300">
          {badge}
        </span>
      )}
    </div>
  );
}

export function LanguageGlyph({ lang, active }: { lang: Lang; active: boolean }) {
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs font-extrabold tracking-tight transition ${
        active
          ? "border-amber-300/60 bg-amber-400/20 text-amber-200"
          : "border-white/15 bg-white/5 text-slate-300"
      }`}
    >
      {lang === "uk" ? "УКР" : "РУС"}
    </span>
  );
}

export function LanguageIconLabel() {
  return <Languages className="h-4 w-4 text-amber-300 shrink-0" />;
}

export function GenderAvatar({ gender, active }: { gender: ChildGender; active: boolean }) {
  if (gender === "girl") {
    return (
      <svg
        viewBox="0 0 64 64"
        className={`h-10 w-10 shrink-0 rounded-xl p-0.5 transition ${
          active ? "bg-rose-400/20 ring-2 ring-amber-400" : "bg-white/5"
        }`}
        aria-hidden="true"
      >
        <circle cx="32" cy="32" r="28" fill="#2a2244" />
        <circle cx="17" cy="36" r="6" fill="#9a5b32" />
        <circle cx="47" cy="36" r="6" fill="#9a5b32" />
        <circle cx="17" cy="30" r="2.6" fill="#f472b6" />
        <circle cx="47" cy="30" r="2.6" fill="#f472b6" />
        <path d="M16 30 C16 15, 48 15, 48 30 Z" fill="#9a5b32" />
        <circle cx="32" cy="33" r="13" fill="#fbd3b6" />
        <path d="M19 29 Q27 20 38 25 Q44 27 45 31 Q35 24 19 29 Z" fill="#9a5b32" />
        <circle cx="27" cy="33" r="1.8" fill="#1e293b" />
        <circle cx="37" cy="33" r="1.8" fill="#1e293b" />
        <path d="M28 38 Q32 42 36 38" fill="none" stroke="#9f1239" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M20 55 C20 46, 44 46, 44 55 Z" fill="#fb7185" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={`h-10 w-10 shrink-0 rounded-xl p-0.5 transition ${
        active ? "bg-sky-400/20 ring-2 ring-amber-400" : "bg-white/5"
      }`}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="28" fill="#1b2c48" />
      <circle cx="32" cy="34" r="13" fill="#fbd3b6" />
      <path d="M18 30 C18 15, 46 15, 46 30 Q40 23 33 25 Q26 21 18 30 Z" fill="#6b4423" />
      <path d="M26 19 Q32 14 38 19" fill="none" stroke="#6b4423" strokeWidth="3" strokeLinecap="round" />
      <circle cx="27" cy="34" r="1.8" fill="#1e293b" />
      <circle cx="37" cy="34" r="1.8" fill="#1e293b" />
      <path d="M28 39 Q32 43 36 39" fill="none" stroke="#9a3412" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 55 C20 46, 44 46, 44 55 Z" fill="#38bdf8" />
      <path d="M25 48 Q32 51 39 48" fill="none" stroke="#e8b86d" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function AgeBadgeVisual({ age }: { age: AgeGroup }) {
  const blocks = age === "2-3" ? 1 : age === "4-5" ? 2 : 3;
  return (
    <div className="flex items-end gap-1 h-5" aria-hidden="true">
      {[1, 2, 3].map((idx) => (
        <span
          key={idx}
          className={`w-1.5 rounded-xs transition ${
            idx <= blocks ? "bg-amber-300" : "bg-white/15"
          }`}
          style={{ height: `${idx * 5 + 5}px` }}
        />
      ))}
    </div>
  );
}

export interface LightboxItem {
  src: string;
  title: string;
  desc: string;
}

export function ImageLightbox({
  item,
  onClose,
}: {
  item: LightboxItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full overflow-hidden rounded-2xl border border-amber-200/30 bg-[#0e1529] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="icon-button absolute right-3 top-3 z-10 rounded-full bg-black/70 p-2 text-white transition hover:bg-amber-400 hover:text-[#0b1020]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-black/40 flex items-center justify-center max-h-[75vh] overflow-hidden">
          <img
            src={item.src}
            alt={item.title}
            className="max-h-[75vh] w-full object-contain"
          />
        </div>

        <div className="border-t border-white/10 p-4 sm:p-5">
          <h3 className="font-serif-book text-lg font-bold text-amber-100">{item.title}</h3>
          <p className="mt-1 text-sm text-slate-300">{item.desc}</p>
        </div>
      </div>
    </div>
  );
}
