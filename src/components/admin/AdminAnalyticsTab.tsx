"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Coins,
  Cpu,
  Filter,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { ART_STYLE_META } from "@/lib/i18n";
import type { ArtStyle, ProductType } from "@/lib/types";

interface AnalyticsResponse {
  period: string;
  groupBy: "day" | "week";
  productType: string;
  summary: {
    totalOrders: number;
    previewReadyOrBeyond: number;
    checkoutStarted: number;
    paidOrders: number;
    failedOrders: number;
    generatingOrders: number;
    heldOrders: number;
    reversedOrders: number;
    totalToPaidPct: number;
    previewToPaidPct: number;
    revenueKopiykas: number;
    aiCostKopiykas: number;
    aiCostUsd: number;
    grossMarginKopiykas: number;
    grossMarginPct: number;
    avgCheckKopiykas: number;
    avgAiCostKopiykas: number;
    measuredCostOrders: number;
    unmeasuredOrders: number;
  };
  funnel: Array<{ step: string; count: number; pctOfTotal: number }>;
  timeline: Array<{
    bucket: string;
    created: number;
    paid: number;
    failed: number;
    revenueKopiykas: number;
    aiCostKopiykas: number;
    marginKopiykas: number;
  }>;
  byProduct: Array<{
    key: string;
    count: number;
    paid: number;
    conversionPct: number;
    revenueKopiykas: number;
    aiCostKopiykas: number;
    marginKopiykas: number;
  }>;
  byArtStyle: Array<{
    key: ArtStyle;
    count: number;
    paid: number;
    conversionPct: number;
    revenueKopiykas: number;
  }>;
  byLayoutMode: Array<{
    key: string;
    count: number;
    paid: number;
    conversionPct: number;
  }>;
  byAgeGroup: Array<{ key: string; count: number; paid: number }>;
  byLang: Array<{ key: string; count: number; paid: number; conversionPct: number }>;
  byCompanionType: Array<{ key: string; count: number; paid: number }>;
  photoStats: {
    withChildPhoto: number;
    withoutChildPhoto: number;
    withChildPhotoPct: number;
    withCompanionPhoto: number;
  };
  aiMetrics: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalImageCalls: number;
    totalVisionQaRetries: number;
    totalElevenLabsChars: number;
  };
}

function fmtUah(kopiykas: number): string {
  const uah = kopiykas / 100;
  return `${uah.toLocaleString("uk-UA", {
    minimumFractionDigits: Math.abs(uah % 1) > 0.01 ? 2 : 0,
    maximumFractionDigits: 2,
  })} ₴`;
}

export function AdminAnalyticsTab() {
  const { lang } = useLanguage();
  const isUk = lang === "uk";

  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [groupBy, setGroupBy] = useState<"day" | "week">("day");
  const [productType, setProductType] = useState<"all" | ProductType>("all");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ period, groupBy, productType });
      const res = await fetch(`/api/admin/analytics?${qs.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed loading analytics");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analytics error");
    } finally {
      setLoading(false);
    }
  }, [period, groupBy, productType]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const funnelLabels: Record<string, string> = {
    created: isUk ? "Створено замовлень" : "Создано заказов",
    preview_ready: isUk ? "Прев'ю готове" : "Превью готово",
    checkout_started: isUk ? "Перехід до оплати Mono" : "Переход к оплате Mono",
    paid: isUk ? "Успішно оплачено" : "Успешно оплачено",
  };

  const productLabels: Record<string, string> = {
    storybook_4_6: isUk ? "Казка PDF (4–6 стор.)" : "Сказка PDF (4–6 стр.)",
    storybook_8: isUk ? "Казка PDF (8 стор.)" : "Сказка PDF (8 стр.)",
    video: isUk ? "Відеопривітання HD" : "Видеопоздравление HD",
  };

  const companionLabels: Record<string, string> = {
    none: isUk ? "Без супутника" : "Без спутника",
    pet: isUk ? "Улюбленець" : "Питомец",
    family: isUk ? "Член родини" : "Член семьи",
    friend: isUk ? "Друг / подруга" : "Друг / подруга",
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-300">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-300" />
        {isUk ? "Рахуємо аналітику..." : "Считаем аналитику..."}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const s = data.summary;
  const maxTimelineRev = Math.max(
    1,
    ...data.timeline.map((t) => Math.max(t.revenueKopiykas, t.aiCostKopiykas))
  );

  return (
    <div className="space-y-6">
      {/* Privacy Banner + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121a30]/90 p-4">
        <div className="flex items-center gap-2 text-xs text-emerald-200">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            {isUk
              ? "Знеособлена аналітика: без email, імен та фото."
              : "Обезличенная аналитика: без email, имён и фото."}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="rounded-lg border border-white/15 bg-[#0b1020] px-2.5 py-1.5 text-slate-200"
          >
            <option value="7d">{isUk ? "7 днів" : "7 дней"}</option>
            <option value="30d">{isUk ? "30 днів" : "30 дней"}</option>
            <option value="90d">{isUk ? "90 днів" : "90 дней"}</option>
            <option value="all">{isUk ? "Увесь час" : "Всё время"}</option>
          </select>

          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value as typeof productType)}
            className="rounded-lg border border-white/15 bg-[#0b1020] px-2.5 py-1.5 text-slate-200"
          >
            <option value="all">{isUk ? "Усі послуги" : "Все услуги"}</option>
            <option value="storybook">{isUk ? "Казки PDF" : "Сказки PDF"}</option>
            <option value="video">{isUk ? "Відео HD" : "Видео HD"}</option>
          </select>

          <div className="flex rounded-lg border border-white/15 bg-[#0b1020] p-0.5">
            {(["day", "week"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupBy(g)}
                className={`rounded-md px-2.5 py-1 transition ${
                  groupBy === g
                    ? "bg-amber-400 font-bold text-[#0b1020]"
                    : "text-slate-300"
                }`}
              >
                {g === "day"
                  ? isUk
                    ? "Дні"
                    : "Дни"
                  : isUk
                  ? "Тижні"
                  : "Недели"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void loadAnalytics()}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-slate-200 hover:bg-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-5 space-y-1">
          <div className="text-xs text-slate-400">
            {isUk ? "Замовлень / Оплачено" : "Заказов / Оплачено"}
          </div>
          <div className="text-2xl font-bold text-white">
            {s.totalOrders}{" "}
            <span className="text-base font-semibold text-emerald-300">
              / {s.paidOrders}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {isUk ? "Конверсія з прев'ю:" : "Конверсия из превью:"}{" "}
            <strong className="text-amber-200">{s.previewToPaidPct}%</strong> ·{" "}
            {isUk ? "загальна:" : "общая:"} {s.totalToPaidPct}%
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-[#121a30]/95 p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isUk ? "Виручка (оплачені)" : "Выручка (оплаченные)"}</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300">
            {fmtUah(s.revenueKopiykas)}
          </div>
          <div className="text-[11px] text-slate-400">
            {isUk ? "Середній чек:" : "Средний чек:"} {fmtUah(s.avgCheckKopiykas)}
          </div>
        </div>

        <div className="rounded-2xl border border-sky-400/20 bg-[#121a30]/95 p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isUk ? "Витрати на ШІ" : "Расходы на ИИ"}</span>
            <Cpu className="h-4 w-4 text-sky-300" />
          </div>
          <div className="text-2xl font-bold text-sky-200">
            {fmtUah(s.aiCostKopiykas)}
          </div>
          <div className="text-[11px] text-slate-400">
            ${s.aiCostUsd.toFixed(2)} ·{" "}
            {isUk
              ? `замір у ${s.measuredCostOrders}/${s.totalOrders}`
              : `замер в ${s.measuredCostOrders}/${s.totalOrders}`}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300/25 bg-[#121a30]/95 p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isUk ? "Валова маржа" : "Валовая маржа"}</span>
            <TrendingUp className="h-4 w-4 text-amber-300" />
          </div>
          <div
            className={`text-2xl font-bold ${
              s.grossMarginKopiykas >= 0 ? "text-amber-200" : "text-rose-300"
            }`}
          >
            {fmtUah(s.grossMarginKopiykas)}
          </div>
          <div className="text-[11px] text-slate-400">
            {s.grossMarginPct}% ·{" "}
            {isUk
              ? `Холди: ${s.heldOrders} · Помилки: ${s.failedOrders}`
              : `Холды: ${s.heldOrders} · Ошибки: ${s.failedOrders}`}
          </div>
        </div>
      </div>

      {/* Funnel + Timeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-5 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-100">
            <BarChart3 className="h-4 w-4 text-amber-300" />
            {isUk ? "Воронка конверсії" : "Воронка конверсии"}
          </h3>
          <div className="space-y-3">
            {data.funnel.map((f) => (
              <div key={f.step} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-200">{funnelLabels[f.step] || f.step}</span>
                  <span className="font-mono text-amber-200">
                    {f.count} ({f.pctOfTotal}%)
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-400 transition-all"
                    style={{ width: `${Math.max(f.count > 0 ? 4 : 0, f.pctOfTotal)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-center text-[11px]">
            <div className="rounded-lg bg-white/5 p-2">
              <div className="text-slate-400">{isUk ? "Генерація" : "Генерация"}</div>
              <div className="font-bold text-amber-200">{s.generatingOrders}</div>
            </div>
            <div className="rounded-lg bg-white/5 p-2">
              <div className="text-slate-400">{isUk ? "Помилки" : "Ошибки"}</div>
              <div className="font-bold text-rose-300">{s.failedOrders}</div>
            </div>
            <div className="rounded-lg bg-white/5 p-2">
              <div className="text-slate-400">{isUk ? "Повернення" : "Возвраты"}</div>
              <div className="font-bold text-slate-200">{s.reversedOrders}</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-100">
              {isUk ? "Динаміка виручки та витрат ШІ" : "Динамика выручки и расходов ИИ"}
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {isUk ? "Виручка" : "Выручка"}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                AI
              </span>
            </div>
          </div>

          {data.timeline.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {isUk ? "Немає даних за обраний період" : "Нет данных за выбранный период"}
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {data.timeline.map((row) => {
                const revPct = Math.round((row.revenueKopiykas / maxTimelineRev) * 100);
                const costPct = Math.round((row.aiCostKopiykas / maxTimelineRev) * 100);
                return (
                  <div
                    key={row.bucket}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-slate-200">{row.bucket}</span>
                      <span className="text-[11px] text-slate-400">
                        {row.created} {isUk ? "зам." : "зак."} ·{" "}
                        <span className="text-emerald-300">{row.paid} опл.</span> ·{" "}
                        <span className="text-amber-200">
                          {isUk ? "Маржа" : "Маржа"}: {fmtUah(row.marginKopiykas)}
                        </span>
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{ width: `${Math.max(row.revenueKopiykas > 0 ? 2 : 0, revPct)}%` }}
                          />
                        </div>
                        <span className="w-16 text-right font-mono text-[11px] text-emerald-300">
                          {fmtUah(row.revenueKopiykas)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-sky-400"
                            style={{ width: `${Math.max(row.aiCostKopiykas > 0 ? 2 : 0, costPct)}%` }}
                          />
                        </div>
                        <span className="w-16 text-right font-mono text-[11px] text-sky-300">
                          {fmtUah(row.aiCostKopiykas)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Product & AI Resource Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-5 space-y-3 lg:col-span-2">
          <h3 className="text-sm font-bold text-amber-100">
            {isUk ? "Маржинальність за послугами" : "Маржинальность по услугам"}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-slate-400">
                <tr>
                  <th className="py-2 pr-3">{isUk ? "Продукт" : "Продукт"}</th>
                  <th className="py-2 px-2">{isUk ? "Створено" : "Создано"}</th>
                  <th className="py-2 px-2">{isUk ? "Оплачено" : "Оплачено"}</th>
                  <th className="py-2 px-2">{isUk ? "Конв." : "Конв."}</th>
                  <th className="py-2 px-2">{isUk ? "Виручка" : "Выручка"}</th>
                  <th className="py-2 px-2">AI</th>
                  <th className="py-2 pl-2">{isUk ? "Маржа" : "Маржа"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.byProduct.map((p) => (
                  <tr key={p.key}>
                    <td className="py-2.5 pr-3 font-medium text-white">
                      {productLabels[p.key] || p.key}
                    </td>
                    <td className="py-2.5 px-2 text-slate-300">{p.count}</td>
                    <td className="py-2.5 px-2 text-emerald-300">{p.paid}</td>
                    <td className="py-2.5 px-2 text-amber-200">{p.conversionPct}%</td>
                    <td className="py-2.5 px-2 font-mono text-slate-200">
                      {fmtUah(p.revenueKopiykas)}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-sky-300">
                      {fmtUah(p.aiCostKopiykas)}
                    </td>
                    <td className="py-2.5 pl-2 font-mono font-bold text-amber-200">
                      {fmtUah(p.marginKopiykas)}
                    </td>
                  </tr>
                ))}
                {data.byProduct.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      —
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-5 space-y-3">
          <h3 className="text-sm font-bold text-amber-100">
            {isUk ? "Споживання ресурсів ШІ" : "Потребление ресурсов ИИ"}
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
              <span className="text-slate-400">Input / Output tokens</span>
              <span className="font-mono text-slate-100">
                {data.aiMetrics.totalInputTokens.toLocaleString()} /{" "}
                {data.aiMetrics.totalOutputTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
              <span className="text-slate-400">
                {isUk ? "Виклики gpt-image" : "Вызовы gpt-image"}
              </span>
              <span className="font-mono text-slate-100">
                {data.aiMetrics.totalImageCalls}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
              <span className="text-slate-400">Vision QA repairs</span>
              <span className="font-mono text-amber-200">
                {data.aiMetrics.totalVisionQaRetries}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
              <span className="text-slate-400">ElevenLabs chars</span>
              <span className="font-mono text-slate-100">
                {data.aiMetrics.totalElevenLabsChars.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
              <span className="text-slate-400">
                {isUk ? "Середн. ШІ-витрати / замір" : "Сред. ИИ-расход / замер"}
              </span>
              <span className="font-mono text-sky-200">
                {fmtUah(s.avgAiCostKopiykas)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Styles, Layouts, Ages, Languages, Companions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Styles */}
        <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-5 space-y-3">
          <h3 className="text-sm font-bold text-amber-100">
            {isUk ? "Популярні стилі казок" : "Популярные стили сказок"}
          </h3>
          <div className="space-y-2 text-xs">
            {data.byArtStyle.map((st) => (
              <div key={st.key} className="flex items-center justify-between gap-2">
                <span className="truncate text-slate-200">
                  {ART_STYLE_META[st.key]?.label[lang] || st.key}
                </span>
                <span className="shrink-0 font-mono text-slate-300">
                  {st.count} ({st.paid} {isUk ? "опл." : "опл."} · {st.conversionPct}%)
                </span>
              </div>
            ))}
            {data.byArtStyle.length === 0 && (
              <div className="text-slate-400">—</div>
            )}
          </div>
        </div>

        {/* Ages & Languages */}
        <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-5 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-amber-100">
              {isUk ? "Вікові групи" : "Возрастные группы"}
            </h3>
            <div className="space-y-1.5 text-xs">
              {data.byAgeGroup.map((a) => (
                <div key={a.key} className="flex justify-between">
                  <span className="text-slate-300">{a.key}</span>
                  <span className="font-mono text-slate-200">
                    {a.count} ({a.paid} опл.)
                  </span>
                </div>
              ))}
              {data.byAgeGroup.length === 0 && (
                <div className="text-slate-400">—</div>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 space-y-2">
            <h3 className="text-sm font-bold text-amber-100">
              {isUk ? "Мови та верстка" : "Языки и вёрстка"}
            </h3>
            <div className="space-y-1 text-xs">
              {data.byLang.map((l) => (
                <div key={l.key} className="flex justify-between">
                  <span className="uppercase text-slate-300">{l.key}</span>
                  <span className="font-mono text-slate-200">
                    {l.count} ({l.paid} опл. · {l.conversionPct}%)
                  </span>
                </div>
              ))}
              {data.byLayoutMode.map((lm) => (
                <div key={lm.key} className="flex justify-between">
                  <span className="text-slate-300">layout:{lm.key}</span>
                  <span className="font-mono text-slate-200">
                    {lm.count} ({lm.paid} опл.)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Photo & Companion */}
        <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-5 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-amber-100">
              {isUk ? "Фото та супутники" : "Фото и спутники"}
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">
                  {isUk ? "З фото дитини" : "С фото ребёнка"}
                </span>
                <span className="font-mono text-amber-200">
                  {data.photoStats.withChildPhoto} ({data.photoStats.withChildPhotoPct}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">
                  {isUk ? "З фото супутника" : "С фото спутника"}
                </span>
                <span className="font-mono text-slate-200">
                  {data.photoStats.withCompanionPhoto}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 space-y-1.5 text-xs">
            {data.byCompanionType.map((c) => (
              <div key={c.key} className="flex justify-between">
                <span className="text-slate-300">
                  {companionLabels[c.key] || c.key}
                </span>
                <span className="font-mono text-slate-200">
                  {c.count} ({c.paid} опл.)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
