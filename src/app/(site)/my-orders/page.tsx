"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FolderHeart,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Sparkles,
  Video,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import type { Lang, OrderStatus, ProductType } from "@/lib/types";

interface OrderSummary {
  id: string;
  productType: ProductType;
  lang: Lang;
  status: OrderStatus;
  title: string;
  priceKopiykas: number;
  createdAt: string;
  expiresAt: string;
  daysLeft: number;
  orderUrl: string;
  downloadUrl: string | null;
}

function MyOrdersInner() {
  const { lang, l } = useLanguage();
  const isUk = lang === "uk";
  const searchParams = useSearchParams();
  const router = useRouter();
  const magicParam = searchParams.get("magic");

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devPreview, setDevPreview] = useState<{ otpCode: string; magicLink: string } | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/my-orders", { cache: "no-store" });
      const data = await res.json();
      setAuthenticated(Boolean(data.authenticated));
      setVerifiedEmail(data.email || null);
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const verifyMagicIfPresent = async () => {
      if (magicParam) {
        setBusy(true);
        try {
          const res = await fetch("/api/auth/email/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ magic: magicParam }),
          });
          if (!res.ok) {
            setError(
              isUk
                ? "Магічне посилання недійсне або вже використане."
                : "Магическая ссылка недействительна или уже использована."
            );
          } else {
            router.replace(l("/my-orders"));
          }
        } finally {
          setBusy(false);
        }
      }
      await loadOrders();
    };

    void verifyMagicIfPresent();
  }, [magicParam, loadOrders, router, isUk, l]);

  const handleRequestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDevPreview(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim(), lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (data.devPreview) setDevPreview(data.devPreview);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed sending email");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim(), code: codeInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          isUk ? "Невірний або застарілий код." : "Неверный или устаревший код."
        );
      }
      setDevPreview(null);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification error");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/my-orders", { method: "DELETE" });
    setAuthenticated(false);
    setVerifiedEmail(null);
    setOrders([]);
    setStep("email");
    setCodeInput("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-300">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-300" />
        {isUk ? "Перевіряємо доступ..." : "Проверяем доступ..."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <FolderHeart className="h-3.5 w-3.5" />
            {isUk ? "Зберігання файлів — 30 днів" : "Хранение файлов — 30 дней"}
          </span>
          <h1 className="font-serif-book text-2xl font-bold text-white sm:text-3xl">
            {isUk ? "Мої замовлення" : "Мои заказы"}
          </h1>
        </div>

        {authenticated && verifiedEmail && (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-slate-200">
            <Mail className="h-4 w-4 text-amber-300" />
            <span>{verifiedEmail}</span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] text-slate-300 hover:bg-rose-500/20 hover:text-rose-200"
            >
              <LogOut className="h-3 w-3" />
              {isUk ? "Вийти" : "Выйти"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!authenticated ? (
        <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-6 shadow-xl sm:p-8 space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-amber-100">
              {isUk
                ? "Знайти оплачені подарунки за Email"
                : "Найти оплаченные подарки по Email"}
            </h2>
            <p className="text-xs leading-relaxed text-slate-300">
              {isUk
                ? "Без паролів: ми надішлемо на пошту одночасно 6-значний код і магічне посилання для входу в один клік."
                : "Без паролей: мы отправим на почту одновременно 6-значный код и магическую ссылку для входа в один клик."}
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={(e) => void handleRequestEmail(e)} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  {isUk ? "Ваш Email, вказаний при оплаті" : "Ваш Email, указанный при оплате"}
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-[#0b1020] hover:bg-amber-300 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {isUk ? "Надіслати код і посилання" : "Отправить код и ссылку"}
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => void handleVerifyCode(e)} className="space-y-4">
              <div className="rounded-xl border border-amber-300/25 bg-amber-400/5 p-3.5 text-xs text-slate-200">
                {isUk
                  ? `На ${emailInput} надіслано лист із 6-значним кодом та посиланням. Перевірте пошту або введіть код нижче:`
                  : `На ${emailInput} отправлено письмо с 6-значным кодом и ссылкой. Перейдите по ссылке в письме или введите код ниже:`}
              </div>

              {devPreview && (
                <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-4 text-xs text-emerald-100 space-y-2">
                  <div className="font-bold">Local Dev Outbox (SMTP не налаштований):</div>
                  <div>
                    Код: <span className="font-mono text-base font-bold text-amber-300">{devPreview.otpCode}</span>
                  </div>
                  <div>
                    Магічне посилання:{" "}
                    <a href={devPreview.magicLink} className="underline text-amber-300 break-all">
                      {devPreview.magicLink}
                    </a>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  {isUk ? "6-значний код із листа" : "6-значный код из письма"}
                </label>
                <input
                  required
                  maxLength={6}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="123456"
                  className="h-11 w-full max-w-xs rounded-xl border border-white/15 bg-white/5 px-3.5 text-center font-mono text-lg tracking-widest text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-[#0b1020] hover:bg-amber-300 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {isUk ? "Підтвердити код" : "Подтвердить код"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setDevPreview(null);
                  }}
                  className="rounded-xl border border-white/15 px-4 py-3 text-xs text-slate-300 hover:bg-white/5"
                >
                  {isUk ? "Змінити Email" : "Изменить Email"}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#121a30]/90 p-8 text-center space-y-4">
          <Sparkles className="mx-auto h-8 w-8 text-amber-300" />
          <p className="text-sm text-slate-300">
            {isUk
              ? "Для цього Email поки немає активних замовлень за останні 30 днів."
              : "Для этого Email пока нет активных заказов за последние 30 дней."}
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href={l("/create/video")}
              className="site-button rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-[#0b1020]"
            >
              {isUk ? "Створити відео" : "Создать видео"}
            </Link>
            <Link
              href={l("/create/storybook")}
              className="site-button rounded-xl border border-white/20 px-5 py-2.5 text-xs font-semibold text-white"
            >
              {isUk ? "Створити казку" : "Создать сказку"}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#121a30]/95 p-5 shadow-lg"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {o.productType === "storybook" ? (
                    <BookOpen className="h-4 w-4 text-amber-300" />
                  ) : (
                    <Video className="h-4 w-4 text-sky-300" />
                  )}
                  <span className="font-mono">#{o.id}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-amber-200/90">
                    <Clock className="h-3 w-3" />
                    {isUk ? `Зберігається ще ${o.daysLeft} дн.` : `Хранится ещё ${o.daysLeft} дн.`}
                  </span>
                </div>
                <h3 className="font-serif-book text-lg font-bold text-white">{o.title}</h3>
                <div className="text-xs text-slate-400">
                  {o.status === "paid" ? (
                    <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isUk ? "Оплачено" : "Оплачено"}
                    </span>
                  ) : o.status === "generating" ? (
                    <span className="text-amber-300">
                      {isUk ? "Триває генерація..." : "Идёт генерация..."}
                    </span>
                  ) : o.status === "preview_ready" ? (
                    <span className="text-sky-300">
                      {isUk ? "Прев'ю готове до оплати" : "Превью готово к оплате"}
                    </span>
                  ) : (
                    <span>{o.status}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={l(o.orderUrl)}
                  className="site-button inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {isUk ? "Відкрити" : "Открыть"}
                </Link>
                {o.downloadUrl && (
                  <a
                    href={o.downloadUrl}
                    className="site-button inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-[#071510] hover:bg-emerald-300"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {isUk ? "Завантажити" : "Скачать"}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading...</div>}>
      <MyOrdersInner />
    </Suspense>
  );
}
