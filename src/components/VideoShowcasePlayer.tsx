"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, PlayCircle, Sparkles, User, Volume2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { DEMO_VIDEOS, type DemoVideoItem } from "@/lib/site-content";
import type { Lang } from "@/lib/types";

export function VideoShowcasePlayer({
  showOrderCta = true,
  videos,
}: {
  showOrderCta?: boolean;
  videos?: DemoVideoItem[];
}) {
  const { lang, l } = useLanguage();
  const isUk = lang === "uk";
  const items = videos && videos.length > 0 ? videos : DEMO_VIDEOS;
  const [selectedDemo, setSelectedDemo] = useState<Lang>(lang);

  useEffect(() => {
    setSelectedDemo(lang);
  }, [lang]);

  const active =
    items.find((v) => v.id === selectedDemo) ?? items[0];

  return (
    <div className="rounded-3xl border border-amber-200/20 bg-[#121a30]/90 p-5 shadow-2xl sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
            <PlayCircle className="h-3.5 w-3.5" />
            {isUk
              ? "Живий приклад готового відео зі звуком"
              : "Живой пример готового видео со звуком"}
          </div>
          <h3 className="font-serif-book text-xl font-bold text-white sm:text-2xl">
            {isUk
              ? "Як виглядає персональне відео від Святого Миколая"
              : "Как выглядит персональное видео от Святого Николая"}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const activeTab = item.id === active.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedDemo(item.id)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  activeTab
                    ? "border-amber-300 bg-amber-400 text-[#0b1020] shadow-md shadow-amber-500/20"
                    : "border-white/15 bg-white/5 text-slate-200 hover:border-amber-300/40 hover:bg-white/10"
                }`}
              >
                {item.label[lang]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-center">
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-black shadow-xl">
          <div className="relative aspect-video w-full">
            <video
              key={active.videoUrl}
              src={active.videoUrl}
              poster={active.posterUrl}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between space-y-5 rounded-2xl border border-white/10 bg-[#0b1020]/70 p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 text-xs text-amber-200">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Volume2 className="h-4 w-4 text-amber-300" />
                {isUk ? "Озвучка ElevenLabs + музика" : "Озвучка ElevenLabs + музыка"}
              </span>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-slate-200">
                {active.duration}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-slate-300">
              {active.audienceNote[lang]}
            </p>

            <div className="space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-amber-200">
                <User className="h-3.5 w-3.5" />
                {isUk
                  ? "Дані, передані у цьому замовленні:"
                  : "Данные, переданные в этом заказе:"}
              </div>
              <dl className="space-y-1.5 text-slate-300">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">{isUk ? "Ім’я:" : "Имя:"}</dt>
                  <dd className="font-semibold text-white">{active.recipientName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">{isUk ? "Вік:" : "Возраст:"}</dt>
                  <dd className="font-semibold text-white">{active.age}</dd>
                </div>
                <div className="pt-1 border-t border-white/10">
                  <dt className="text-slate-400">
                    {isUk ? "Досягнення / подія:" : "Достижение / повод:"}
                  </dt>
                  <dd className="mt-0.5 font-medium text-amber-100">
                    «{active.achievement}»
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
              <span>
                {isUk
                  ? "Зверніть увагу: на сторінці Книги добрих справ у відео автоматично вклеєно фото отримувача та його ім’я."
                  : "Обратите внимание: на странице Книги добрых дел в видео автоматически вклеено фото получателя и его имя."}
              </span>
            </div>
          </div>

          {showOrderCta && (
            <Link
              href={l("/create/video")}
              className="site-button inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-5 py-3 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 transition hover:brightness-105"
            >
              {isUk ? "Замовити таке відео" : "Заказать такое видео"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
