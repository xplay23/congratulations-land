"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export const COOKIE_CONSENT_EVENT = "videovitannya:open-cookies";
const STORAGE_KEY = "videovitannya-consent";

export function openCookieSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT));
  }
}

export function CookieConsent() {
  const { lang, l } = useLanguage();
  const isUk = lang === "uk";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!window.localStorage.getItem(STORAGE_KEY));
    } catch {
      setVisible(true);
    }
    const onOpen = () => setVisible(true);
    window.addEventListener(COOKIE_CONSENT_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onOpen);
  }, []);

  const choose = (mode: "necessary" | "all") => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          necessary: true,
          analytics: mode === "all",
          marketing: mode === "all",
          version: 1,
        })
      );
    } catch {
      // Consent remains valid in memory if storage is unavailable
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label={isUk ? "Налаштування cookies" : "Настройки cookies"}
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-2xl border border-amber-200/30 bg-[#0e1529]/95 p-4 shadow-2xl backdrop-blur-md sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div className="space-y-1 text-xs">
            <strong className="block text-sm text-amber-100">
              {isUk
                ? "Ваш вибір — ваша приватність"
                : "Ваши настройки конфиденциальности"}
            </strong>
            <p className="leading-relaxed text-slate-300">
              {isUk
                ? "Необхідні cookies підтримують роботу сесій, кошика та мови. Аналітику й рекламу дозволяєте лише ви. Докладніше — у "
                : "Необходимые cookies поддерживают работу сессий, заказов и языка. Аналитику и рекламу разрешаете только вы. Подробнее — в "}
              <Link
                href={l("/konfidentsiynist")}
                className="text-amber-300 underline underline-offset-4 hover:text-amber-200"
              >
                {isUk ? "політиці конфіденційності" : "политике конфиденциальности"}
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => choose("necessary")}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            {isUk ? "Лише необхідні" : "Только необходимые"}
          </button>
          <button
            type="button"
            onClick={() => choose("all")}
            className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-[#0b1020] transition hover:bg-amber-300"
          >
            {isUk ? "Дозволити всі" : "Разрешить все"}
          </button>
        </div>
      </div>
    </aside>
  );
}
