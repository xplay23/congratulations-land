"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  Loader2,
  LogOut,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import {
  AdminLoginView,
  type AdminAuthMe,
} from "@/components/admin/AdminLoginView";
import { AdminAnalyticsTab } from "@/components/admin/AdminAnalyticsTab";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";

type AdminTab = "analytics" | "orders" | "settings";

function AdminPageInner() {
  const { lang } = useLanguage();
  const isUk = lang === "uk";
  const searchParams = useSearchParams();
  const router = useRouter();
  const magicParam = searchParams.get("magic");

  const [authMe, setAuthMe] = useState<AdminAuthMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<AdminTab>("analytics");

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/me", { cache: "no-store" });
      const data = (await res.json()) as AdminAuthMe;
      setAuthMe(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (magicParam) {
        try {
          const res = await fetch("/api/admin/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "verify_magic", magic: magicParam }),
          });
          if (res.ok) {
            router.replace("/admin");
          }
        } catch {
          // Ignore invalid magic token
        }
      }
      await checkAuth();
    };
    void init();
  }, [magicParam, router, checkAuth]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/login", { method: "DELETE" });
    await checkAuth();
  };

  if (loading && !authMe) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-300">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-300" />
        {isUk ? "Перевірка адмін-доступу..." : "Проверка админ-доступа..."}
      </div>
    );
  }

  if (!authMe?.authenticated) {
    return (
      <AdminLoginView
        authMe={
          authMe || {
            authenticated: false,
            identity: null,
            method: null,
            configured: false,
            methods: { password: false, email: false },
            verifiedEmailAllowed: false,
          }
        }
        onSuccess={checkAuth}
      />
    );
  }

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    {
      id: "analytics",
      label: isUk ? "Аналітика та Маржа" : "Аналитика и Маржа",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      id: "orders",
      label: isUk ? "Замовлення і Підтримка" : "Заказы и Поддержка",
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      id: "settings",
      label: isUk ? "Тарифи та Система" : "Тарифы и Система",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Admin Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300/20 bg-gradient-to-r from-[#141f3f] to-[#121a30] p-5 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin • {authMe.identity}
          </div>
          <h1 className="font-serif-book text-2xl font-bold text-white">
            {isUk ? "Панель управління VideoVitannya" : "Панель управления VideoVitannya"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-white/10 bg-[#0b1020]/70 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  tab === t.id
                    ? "bg-amber-400 text-[#0b1020] shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-rose-500/20 hover:text-rose-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            {isUk ? "Вийти" : "Выйти"}
          </button>
        </div>
      </div>

      {tab === "analytics" && <AdminAnalyticsTab />}
      {tab === "orders" && <AdminOrdersTab />}
      {tab === "settings" && <AdminSettingsTab />}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading...</div>}>
      <AdminPageInner />
    </Suspense>
  );
}
