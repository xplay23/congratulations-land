"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Undo2,
  Video,
  X,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import type { Lang, OrderAiCost, OrderStatus, ProductType } from "@/lib/types";

interface AdminOrderItem {
  id: string;
  productType: ProductType;
  lang: Lang;
  status: OrderStatus;
  progressStep: string;
  progressLabel: string;
  progressPercent: number;
  errorMessage: string | null;
  childName: string;
  title: string;
  metaSummary: {
    pageCount?: number;
    pagesIllustrated?: number;
    totalPages?: number;
    artStyle?: string;
    layoutMode?: string;
    ageGroup?: string;
    generationStage?: string | null;
    modeUsed?: string | null;
    age?: string;
  };
  priceKopiykas: number;
  revenueKopiykas: number;
  aiCost: OrderAiCost | null;
  aiCostKopiykas: number | null;
  marginKopiykas: number | null;
  monoInvoiceId: string | null;
  monoPaymentUrl: string | null;
  monoStatus: string | null;
  receiptUrl: string | null;
  customerEmail: string | null;
  telegramChatId: string | null;
  aiEditsUsed: number;
  aiEditsLimit: number;
  hasResult: boolean;
  orderUrl: string;
  downloadUrl: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

function fmtUah(kopiykas: number): string {
  const uah = kopiykas / 100;
  return `${uah.toLocaleString("uk-UA", {
    minimumFractionDigits: Math.abs(uah % 1) > 0.01 ? 2 : 0,
    maximumFractionDigits: 2,
  })} ₴`;
}

export function AdminOrdersTab() {
  const { lang } = useLanguage();
  const isUk = lang === "uk";

  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("all");
  const [productType, setProductType] = useState("all");
  const [orderLang, setOrderLang] = useState("all");
  const [period, setPeriod] = useState("30d");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminOrderItem | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        status,
        productType,
        lang: orderLang,
        period,
        q: search.trim(),
        limit: "50",
        offset: "0",
      });
      const res = await fetch(`/api/admin/orders?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed loading orders");
      const list = (data.orders || []) as AdminOrderItem[];
      setOrders(list);
      setTotal(data.total || 0);
      setSelected((prev) => (prev ? list.find((o) => o.id === prev.id) || prev : null));
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : "Failed loading orders",
      });
    } finally {
      setLoading(false);
    }
  }, [status, productType, orderLang, period, search]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const runOrderAction = async (
    orderId: string,
    action: "resume" | "refund" | "sync_mono" | "grant_ai_edit" | "resend_email"
  ) => {
    if (action === "refund") {
      const confirmed = window.confirm(
        isUk
          ? `Підтвердити скасування холду / повернення коштів для ${orderId}?`
          : `Подтвердить отмену холда / возврат средств для ${orderId}?`
      );
      if (!confirmed) return;
    }

    setBusyAction(`${orderId}:${action}`);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setFeedback({ ok: true, text: data.message || "OK" });
      await loadOrders();
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : "Action failed",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleMaintenanceCleanup = async () => {
    setBusyAction("maintenance");
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/maintenance", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cleanup failed");
      setFeedback({
        ok: true,
        text: isUk
          ? `Очищено: замовлень=${data.expiredOrdersCleaned}, тимчасових фото=${data.expiredUploadsCleaned}`
          : `Очищено: заказов=${data.expiredOrdersCleaned}, временных фото=${data.expiredUploadsCleaned}`,
      });
      await loadOrders();
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : "Cleanup error",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const statusBadge = (o: AdminOrderItem) => {
    if (o.status === "paid") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
          <CheckCircle2 className="h-3 w-3" /> paid
        </span>
      );
    }
    if (o.status === "failed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300">
          <AlertTriangle className="h-3 w-3" />{" "}
          {o.monoStatus === "reversed" ? "reversed" : "failed"}
        </span>
      );
    }
    if (o.status === "generating") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
          <Loader2 className="h-3 w-3 animate-spin" /> {o.progressPercent}%
        </span>
      );
    }
    return (
      <span className="rounded-full bg-sky-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-sky-200">
        {o.status}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121a30]/90 p-4">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isUk
                  ? "ID, email, invoiceId або ім'я..."
                  : "ID, email, invoiceId или имя..."
              }
              className="h-9 w-full rounded-lg border border-white/15 bg-[#0b1020] pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 rounded-lg border border-white/15 bg-[#0b1020] px-2.5 text-xs text-slate-200"
          >
            <option value="all">{isUk ? "Усі статуси" : "Все статусы"}</option>
            <option value="paid">paid</option>
            <option value="preview_ready">preview_ready</option>
            <option value="generating">generating</option>
            <option value="failed">failed</option>
          </select>

          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            className="h-9 rounded-lg border border-white/15 bg-[#0b1020] px-2.5 text-xs text-slate-200"
          >
            <option value="all">{isUk ? "Усі послуги" : "Все услуги"}</option>
            <option value="storybook">{isUk ? "Казки" : "Сказки"}</option>
            <option value="video">{isUk ? "Відео" : "Видео"}</option>
          </select>

          <select
            value={orderLang}
            onChange={(e) => setOrderLang(e.target.value)}
            className="h-9 rounded-lg border border-white/15 bg-[#0b1020] px-2.5 text-xs text-slate-200"
          >
            <option value="all">UA + RU</option>
            <option value="uk">UA</option>
            <option value="ru">RU</option>
          </select>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-9 rounded-lg border border-white/15 bg-[#0b1020] px-2.5 text-xs text-slate-200"
          >
            <option value="7d">{isUk ? "7 днів" : "7 дней"}</option>
            <option value="30d">{isUk ? "30 днів" : "30 дней"}</option>
            <option value="90d">{isUk ? "90 днів" : "90 дней"}</option>
            <option value="all">{isUk ? "Усі" : "Все"}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={() => void handleMaintenanceCleanup()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5 text-amber-300" />
            {isUk ? "Очистити TTL" : "Очистить TTL"}
          </button>

          <button
            type="button"
            onClick={() => void loadOrders()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-300/35 bg-amber-400/10 px-3 text-xs font-semibold text-amber-200 hover:bg-amber-400/20"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {total}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            feedback.ok
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-400/40 bg-rose-500/10 text-rose-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Table + Inspector */}
      <div className={`grid gap-6 ${selected ? "lg:grid-cols-[1fr_400px]" : ""}`}>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121a30]/95 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                <tr>
                  <th className="px-4 py-3">{isUk ? "Замовлення" : "Заказ"}</th>
                  <th className="px-3 py-3">{isUk ? "Послуга" : "Услуга"}</th>
                  <th className="px-3 py-3">{isUk ? "Статус" : "Статус"}</th>
                  <th className="px-3 py-3">Mono</th>
                  <th className="px-3 py-3">{isUk ? "Ціна / AI / Маржа" : "Цена / AI / Маржа"}</th>
                  <th className="px-4 py-3 text-right">{isUk ? "Дії" : "Действия"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((o) => {
                  const isSelected = selected?.id === o.id;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelected(o)}
                      className={`cursor-pointer transition hover:bg-white/[0.04] ${
                        isSelected ? "bg-amber-400/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] text-amber-200">{o.id}</div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {new Date(o.createdAt).toLocaleString(isUk ? "uk-UA" : "ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {o.customerEmail ? ` · ${o.customerEmail}` : ""}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-white">
                          {o.productType === "storybook" ? (
                            <BookOpen className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                          ) : (
                            <Video className="h-3.5 w-3.5 text-sky-300 shrink-0" />
                          )}
                          <span className="uppercase text-[10px] text-slate-400">
                            {o.lang}
                          </span>
                          <span className="truncate max-w-[140px]">{o.childName}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {o.productType === "storybook"
                            ? `${o.metaSummary.pageCount}p · ${o.metaSummary.artStyle} · ${o.metaSummary.layoutMode}`
                            : "HD Video 720p"}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        {statusBadge(o)}
                        <div className="mt-1 text-[10px] text-slate-400">
                          {o.progressStep}
                        </div>
                      </td>

                      <td className="px-3 py-3 font-mono text-[11px] text-slate-300">
                        <div>{o.monoStatus || "—"}</div>
                        {o.monoInvoiceId && (
                          <div className="max-w-[110px] truncate text-[10px] text-slate-500">
                            {o.monoInvoiceId}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3 font-mono text-[11px]">
                        <div className="text-slate-100">{fmtUah(o.priceKopiykas)}</div>
                        <div className="text-sky-300">
                          AI: {o.aiCostKopiykas !== null ? fmtUah(o.aiCostKopiykas) : "—"}
                        </div>
                        {o.marginKopiykas !== null && o.status === "paid" && (
                          <div
                            className={
                              o.marginKopiykas >= 0 ? "text-emerald-300" : "text-rose-300"
                            }
                          >
                            M: {fmtUah(o.marginKopiykas)}
                          </div>
                        )}
                      </td>

                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          {(o.monoStatus === "hold" || o.monoStatus === "success") &&
                            o.status !== "paid" &&
                            o.productType === "storybook" && (
                              <button
                                type="button"
                                disabled={busyAction !== null}
                                onClick={() => void runOrderAction(o.id, "resume")}
                                title="Resume finalization"
                                className="rounded-lg bg-amber-400/20 px-2.5 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-400/30"
                              >
                                Resume
                              </button>
                            )}
                          <Link
                            href={o.orderUrl}
                            target="_blank"
                            className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:text-white"
                            title="Open order page"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {isUk ? "Замовлень не знайдено" : "Заказов не найдено"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Inspector Drawer */}
        {selected && (
          <div className="rounded-2xl border border-amber-300/25 bg-[#121a30]/95 p-5 shadow-2xl space-y-4 self-start sticky top-20">
            <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <div className="font-mono text-xs text-amber-300">{selected.id}</div>
                <h3 className="font-serif-book text-lg font-bold text-white">
                  {selected.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-white/5 p-2.5">
                <div className="text-[10px] text-slate-400">Status</div>
                <div className="mt-0.5 font-semibold text-white">
                  {selected.status} ({selected.progressPercent}%)
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-2.5">
                <div className="text-[10px] text-slate-400">Mono</div>
                <div className="mt-0.5 font-semibold text-white">
                  {selected.monoStatus || "none"}
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-2.5">
                <div className="text-[10px] text-slate-400">Email</div>
                <div className="mt-0.5 truncate text-slate-200">
                  {selected.customerEmail || "—"}
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-2.5">
                <div className="text-[10px] text-slate-400">AI Edits</div>
                <div className="mt-0.5 font-mono text-slate-200">
                  {selected.aiEditsUsed} / {selected.aiEditsLimit}
                </div>
              </div>
            </div>

            {selected.productType === "storybook" && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300 space-y-1">
                <div>
                  Stage:{" "}
                  <strong className="text-amber-200">
                    {selected.metaSummary.generationStage || "—"}
                  </strong>{" "}
                  ({selected.metaSummary.pagesIllustrated}/
                  {selected.metaSummary.totalPages} {isUk ? "ілюстр." : "иллюстр."})
                </div>
                <div>
                  Style: {selected.metaSummary.artStyle} · Layout:{" "}
                  {selected.metaSummary.layoutMode} · Age: {selected.metaSummary.ageGroup}
                </div>
              </div>
            )}

            {selected.errorMessage && (
              <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 p-3 text-xs text-rose-200">
                <div className="font-bold">Error:</div>
                <div className="mt-1 break-words font-mono text-[11px]">
                  {selected.errorMessage}
                </div>
              </div>
            )}

            {/* AI Cost Breakdown */}
            <div className="rounded-xl border border-sky-400/20 bg-sky-500/5 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-sky-200">
                <span>{isUk ? "Витрати ШІ" : "Расходы ИИ"}</span>
                <span className="font-mono">
                  {selected.aiCost
                    ? `$${selected.aiCost.totalUsd.toFixed(4)} (${fmtUah(
                        selected.aiCost.totalUahKopiykas
                      )})`
                    : isUk
                    ? "не виміряно"
                    : "не измерено"}
                </span>
              </div>
              {selected.aiCost && (
                <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-slate-300">
                  {selected.aiCost.breakdown.map((b, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span className="truncate">
                        {b.step} ({b.calls}x {b.model})
                      </span>
                      <span className="font-mono shrink-0">${b.costUsd.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busyAction !== null || selected.productType !== "storybook"}
                  onClick={() => void runOrderAction(selected.id, "resume")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-xs font-bold text-[#0b1020] hover:bg-amber-300 disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Resume
                </button>

                <button
                  type="button"
                  disabled={busyAction !== null || !selected.monoInvoiceId}
                  onClick={() => void runOrderAction(selected.id, "sync_mono")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-40"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Sync Mono
                </button>

                <button
                  type="button"
                  disabled={
                    busyAction !== null ||
                    (selected.monoStatus !== "hold" && selected.monoStatus !== "success")
                  }
                  onClick={() => void runOrderAction(selected.id, "refund")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-400/35 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/25 disabled:opacity-40"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  {isUk ? "Зняти холд / Поверн." : "Снять холд / Возврат"}
                </button>

                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => void runOrderAction(selected.id, "grant_ai_edit")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  +1 AI-правка
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {selected.status === "paid" && selected.customerEmail && (
                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => void runOrderAction(selected.id, "resend_email")}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-sky-400/35 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/20"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {isUk ? "Надіслати лист" : "Повторить письмо"}
                  </button>
                )}
                <Link
                  href={selected.orderUrl}
                  target="_blank"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-400/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {isUk ? "Сторінка клієнта" : "Страница клиента"}
                </Link>
              </div>

              {selected.receiptUrl && (
                <a
                  href={selected.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center text-[11px] text-emerald-300 underline"
                >
                  {isUk ? "Відкрити чек Plata / ПРРО" : "Открыть чек Plata / ПРРО"}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
