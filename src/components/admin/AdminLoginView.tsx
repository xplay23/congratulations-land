"use client";

import { useState } from "react";
import { KeyRound, Loader2, Lock, Mail, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export interface AdminAuthMe {
  authenticated: boolean;
  identity: string | null;
  method: "cookie" | "email" | null;
  configured: boolean;
  methods: {
    password: boolean;
    email: boolean;
  };
  verifiedEmailAllowed: boolean;
}

export function AdminLoginView({
  authMe,
  onSuccess,
}: {
  authMe: AdminAuthMe;
  onSuccess: () => Promise<void>;
}) {
  const { lang } = useLanguage();
  const isUk = lang === "uk";

  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailStep, setEmailStep] = useState<"email" | "code">("email");
  const [devPreview, setDevPreview] = useState<{
    otpCode: string;
    magicLink: string;
  } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy("password");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "password", password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid password");
      setPassword("");
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(null);
    }
  };

  const handleRequestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDevPreview(null);
    setBusy("request_email");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "request_email", email: email.trim(), lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email request failed");
      if (data.devPreview) setDevPreview(data.devPreview);
      setEmailStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email login failed");
    } finally {
      setBusy(null);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy("verify_email");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "verify_email",
          email: email.trim(),
          code: code.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setDevPreview(null);
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg py-8">
      <div className="rounded-2xl border border-amber-300/20 bg-[#121a30]/95 p-6 shadow-2xl sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 border border-amber-300/30">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-serif-book text-2xl font-bold text-white">
              {isUk ? "Адмін-панель VideoVitannya" : "Админ-панель VideoVitannya"}
            </h1>
            <p className="text-xs text-slate-400">
              {isUk
                ? "Управління тарифами, замовленнями та знеособленою аналітикою"
                : "Управление тарифами, заказами и обезличенной аналитикой"}
            </p>
          </div>
        </div>

        {!authMe.configured && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-xs text-amber-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-200">
              <ShieldAlert className="h-4 w-4" />
              {isUk
                ? "Адмін-доступ ще не налаштований"
                : "Админ-доступ ещё не настроен"}
            </div>
            <p className="leading-relaxed text-amber-100/90">
              {isUk
                ? "Додайте ADMIN_PASSWORD та/або ADMIN_EMAILS (через кому) у файл .env.local і перезапустіть сервер."
                : "Добавьте ADMIN_PASSWORD и/или ADMIN_EMAILS (через запятую) в файл .env.local и перезапустите сервер."}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            {error}
          </div>
        )}

        {authMe.methods.password && (
          <form onSubmit={(e) => void handlePasswordLogin(e)} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              {isUk ? "Пароль адміністратора" : "Пароль администратора"}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white focus:border-amber-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-5 py-3 text-sm font-bold text-[#0b1020] hover:brightness-105 disabled:opacity-50"
            >
              {busy === "password" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {isUk ? "Увійти за паролем" : "Войти по паролю"}
            </button>
          </form>
        )}

        {authMe.methods.password && authMe.methods.email && (
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <div className="h-px flex-1 bg-white/10" />
            <span>{isUk ? "або" : "или"}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        )}

        {authMe.methods.email && (
          <div className="space-y-3">
            {emailStep === "email" ? (
              <form onSubmit={(e) => void handleRequestEmail(e)} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  {isUk
                    ? "Вхід через Email із ADMIN_EMAILS (OTP / Magic link)"
                    : "Вход через Email из ADMIN_EMAILS (OTP / Magic link)"}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@videovitannya.com.ua"
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/35 bg-amber-400/10 px-5 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-400/20 disabled:opacity-50"
                >
                  {busy === "request_email" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {isUk ? "Надіслати код на адмін-пошту" : "Отправить код на админ-почту"}
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => void handleVerifyEmail(e)} className="space-y-3">
                {devPreview && (
                  <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-3 text-xs text-emerald-100 space-y-1">
                    <div className="font-bold">Local Dev Outbox:</div>
                    <div>
                      OTP: <span className="font-mono font-bold text-amber-300">{devPreview.otpCode}</span>
                    </div>
                  </div>
                )}
                <input
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-center font-mono text-lg tracking-widest text-white focus:border-amber-400 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy !== null}
                    className="flex-1 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-[#0b1020] hover:bg-amber-300"
                  >
                    {isUk ? "Підтвердити" : "Подтвердить"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailStep("email")}
                    className="rounded-xl border border-white/15 px-3 py-2.5 text-xs text-slate-300"
                  >
                    {isUk ? "Назад" : "Назад"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
