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
  Trash2,
  Undo2,
  Video,
  X,
} from "lucide-react";
import {
  Alert,
  Button,
  C,
  Card,
  Input,
  SectionLabel,
  Select,
} from "@engine/components/admin/ui";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";
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

function OrderStatusPill({ o }: { o: AdminOrderItem }) {
  let color: string = C.blue;
  let text: string = o.status;
  let icon: React.ReactNode = null;

  if (o.status === "paid") {
    color = C.green;
    text = "paid";
    icon = <CheckCircle2 size={13} />;
  } else if (o.status === "failed") {
    color = C.red;
    text = o.monoStatus === "reversed" ? "reversed" : "failed";
    icon = <AlertTriangle size={13} />;
  } else if (o.status === "generating") {
    color = C.amber;
    text = `${o.progressPercent}%`;
    icon = <Loader2 size={13} />;
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "var(--adm-radius-pill)",
        fontSize: "var(--adm-fs-badge)",
        fontWeight: 600,
        color,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {text}
    </span>
  );
}

const TH_STYLE: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "var(--adm-fs-label)",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: C.muted,
  opacity: 0.65,
  textAlign: "left",
  whiteSpace: "nowrap",
};

export function AdminOrdersTab() {
  const lang = useAdminLang();
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
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null
  );

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
      setSelected((prev) =>
        prev ? list.find((o) => o.id === prev.id) || prev : null
      );
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
        tAdmin(
          lang,
          `Подтвердить отмену холда / возврат средств для ${orderId}?`,
          `Підтвердити скасування холду / повернення коштів для ${orderId}?`
        )
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
        text: tAdmin(
          lang,
          `Очищено: заказов=${data.expiredOrdersCleaned}, временных фото=${data.expiredUploadsCleaned}`,
          `Очищено: замовлень=${data.expiredOrdersCleaned}, тимчасових фото=${data.expiredUploadsCleaned}`
        ),
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toolbar */}
      <Card style={{ padding: "14px 16px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px",
              flex: 1,
              minWidth: "260px",
            }}
          >
            <div style={{ flex: "1 1 220px", maxWidth: "280px" }}>
              <Input
                type="search"
                value={search}
                onChange={setSearch}
                placeholder={tAdmin(
                  lang,
                  "Поиск: ID, email, invoiceId или имя…",
                  "Пошук: ID, email, invoiceId або ім'я…"
                )}
              />
            </div>

            <div style={{ width: "145px" }}>
              <Select
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: tAdmin(lang, "Все статусы", "Усі статуси") },
                  { value: "paid", label: "paid" },
                  { value: "preview_ready", label: "preview_ready" },
                  { value: "generating", label: "generating" },
                  { value: "failed", label: "failed" },
                ]}
              />
            </div>

            <div style={{ width: "135px" }}>
              <Select
                value={productType}
                onChange={setProductType}
                options={[
                  { value: "all", label: tAdmin(lang, "Все услуги", "Усі послуги") },
                  { value: "storybook", label: tAdmin(lang, "Сказки", "Казки") },
                  { value: "video", label: tAdmin(lang, "Видео", "Відео") },
                ]}
              />
            </div>

            <div style={{ width: "105px" }}>
              <Select
                value={orderLang}
                onChange={setOrderLang}
                options={[
                  { value: "all", label: "UA + RU" },
                  { value: "uk", label: "UA" },
                  { value: "ru", label: "RU" },
                ]}
              />
            </div>

            <div style={{ width: "120px" }}>
              <Select
                value={period}
                onChange={setPeriod}
                options={[
                  { value: "7d", label: tAdmin(lang, "7 дней", "7 днів") },
                  { value: "30d", label: tAdmin(lang, "30 дней", "30 днів") },
                  { value: "90d", label: tAdmin(lang, "90 дней", "90 днів") },
                  { value: "all", label: tAdmin(lang, "Всё время", "Увесь час") },
                ]}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Button
              variant="ghost"
              disabled={busyAction !== null}
              onClick={() => void handleMaintenanceCleanup()}
            >
              <Trash2 size={14} />
              {tAdmin(lang, "Очистить TTL", "Очистити TTL")}
            </Button>

            <Button
              variant="primary"
              onClick={() => void loadOrders()}
              disabled={loading}
            >
              <RefreshCw size={14} />
              {tAdmin(lang, `Обновить (${total})`, `Оновити (${total})`)}
            </Button>
          </div>
        </div>
      </Card>

      {feedback && (
        <Alert
          variant={feedback.ok ? "success" : "error"}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.text}
        </Alert>
      )}

      {/* Table + Inspector */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: selected ? "minmax(0, 1fr) 410px" : "1fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div className="aui-scroll-x">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                  <th style={TH_STYLE}>{tAdmin(lang, "Заказ", "Замовлення")}</th>
                  <th style={TH_STYLE}>{tAdmin(lang, "Услуга", "Послуга")}</th>
                  <th style={TH_STYLE}>{tAdmin(lang, "Статус", "Статус")}</th>
                  <th style={TH_STYLE}>Mono</th>
                  <th style={TH_STYLE}>
                    {tAdmin(lang, "Цена / AI / Маржа", "Ціна / AI / Маржа")}
                  </th>
                  <th style={{ ...TH_STYLE, textAlign: "right" }}>
                    {tAdmin(lang, "Действия", "Дії")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => {
                  const isSelected = selected?.id === o.id;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelected(o)}
                      style={{
                        cursor: "pointer",
                        borderBottom:
                          idx < orders.length - 1
                            ? `1px solid ${C.cardBorder}`
                            : "none",
                        background: isSelected
                          ? `color-mix(in srgb, ${C.blue} 10%, transparent)`
                          : "transparent",
                        transition: "background 0.12s",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div
                          className="adm-mono"
                          style={{
                            fontSize: "var(--adm-fs-caption)",
                            fontWeight: 600,
                            color: C.text,
                          }}
                        >
                          {o.id}
                        </div>
                        <div
                          className="adm-caption"
                          style={{ color: C.muted, marginTop: "2px" }}
                        >
                          {new Date(o.createdAt).toLocaleString(
                            isUk ? "uk-UA" : "ru-RU",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                          {o.customerEmail ? ` · ${o.customerEmail}` : ""}
                        </div>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <div
                          className="adm-body"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "7px",
                            fontWeight: 600,
                            color: C.text,
                          }}
                        >
                          {o.productType === "storybook" ? (
                            <BookOpen size={15} style={{ color: C.amber, flexShrink: 0 }} />
                          ) : (
                            <Video size={15} style={{ color: C.blue, flexShrink: 0 }} />
                          )}
                          <span
                            className="adm-badge"
                            style={{
                              textTransform: "uppercase",
                              color: C.muted,
                            }}
                          >
                            {o.lang}
                          </span>
                          <span>{o.childName}</span>
                        </div>
                        <div
                          className="adm-caption"
                          style={{ color: C.muted, marginTop: "2px" }}
                        >
                          {o.productType === "storybook"
                            ? `${o.metaSummary.pageCount}p · ${o.metaSummary.artStyle} · ${o.metaSummary.layoutMode}`
                            : "HD Video 720p"}
                        </div>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <OrderStatusPill o={o} />
                        <div
                          className="adm-badge"
                          style={{ color: C.muted, marginTop: "4px", opacity: 0.8 }}
                        >
                          {o.progressStep}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: "12px 16px",
                          fontFamily: "monospace",
                          fontSize: "var(--adm-fs-caption)",
                          color: C.text,
                        }}
                      >
                        <div>{o.monoStatus || "—"}</div>
                        {o.monoInvoiceId && (
                          <div
                            style={{
                              maxWidth: "120px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: "var(--adm-fs-badge)",
                              color: C.muted,
                            }}
                          >
                            {o.monoInvoiceId}
                          </div>
                        )}
                      </td>

                      <td
                        style={{
                          padding: "12px 16px",
                          fontFamily: "monospace",
                          fontSize: "var(--adm-fs-caption)",
                        }}
                      >
                        <div style={{ color: C.text, fontWeight: 600 }}>
                          {fmtUah(o.priceKopiykas)}
                        </div>
                        <div style={{ color: C.blue }}>
                          AI:{" "}
                          {o.aiCostKopiykas !== null
                            ? fmtUah(o.aiCostKopiykas)
                            : "—"}
                        </div>
                        {o.marginKopiykas !== null && o.status === "paid" && (
                          <div
                            style={{
                              color:
                                o.marginKopiykas >= 0 ? C.green : C.red,
                            }}
                          >
                            M: {fmtUah(o.marginKopiykas)}
                          </div>
                        )}
                      </td>

                      <td
                        style={{ padding: "12px 16px", textAlign: "right" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {(o.monoStatus === "hold" ||
                            o.monoStatus === "success") &&
                            o.status !== "paid" &&
                            o.productType === "storybook" && (
                              <Button
                                variant="primary"
                                disabled={busyAction !== null}
                                onClick={() => void runOrderAction(o.id, "resume")}
                              >
                                Resume
                              </Button>
                            )}
                          <Link
                            href={o.orderUrl}
                            target="_blank"
                            className="aui-btn aui-btn--ghost aui-btn--icon"
                            title={tAdmin(
                              lang,
                              "Открыть страницу клиента",
                              "Відкрити сторінку клієнта"
                            )}
                          >
                            <ExternalLink size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "40px 16px",
                        textAlign: "center",
                        fontSize: "var(--adm-fs-body)",
                        color: C.muted,
                      }}
                    >
                      {tAdmin(lang, "Заказов не найдено", "Замовлень не знайдено")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Inspector Drawer */}
        {selected && (
          <Card style={{ position: "sticky", top: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "12px",
                paddingBottom: "14px",
                borderBottom: `1px solid ${C.cardBorder}`,
                marginBottom: "16px",
              }}
            >
              <div>
                <div
                  className="adm-mono"
                  style={{ fontSize: "var(--adm-fs-caption)", color: C.blue }}
                >
                  {selected.id}
                </div>
                <h3
                  style={{
                    margin: "4px 0 0",
                    fontSize: "var(--adm-fs-heading)",
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  {selected.title}
                </h3>
              </div>
              <Button
                variant="ghost"
                className="aui-btn--icon"
                onClick={() => setSelected(null)}
              >
                <X size={15} />
              </Button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              {[
                {
                  k: tAdmin(lang, "Статус", "Статус"),
                  v: `${selected.status} (${selected.progressPercent}%)`,
                },
                { k: "Mono", v: selected.monoStatus || "none" },
                { k: "Email", v: selected.customerEmail || "—" },
                {
                  k: tAdmin(lang, "AI-правки", "AI-правки"),
                  v: `${selected.aiEditsUsed} / ${selected.aiEditsLimit}`,
                },
              ].map((cell) => (
                <div
                  key={cell.k}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--adm-radius-sm)",
                    background: C.surface,
                    border: `1px solid ${C.cardBorder}`,
                  }}
                >
                  <div className="adm-label" style={{ color: C.muted, opacity: 0.7 }}>
                    {cell.k}
                  </div>
                  <div
                    className="adm-body"
                    style={{
                      marginTop: "4px",
                      fontWeight: 600,
                      color: C.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cell.v}
                  </div>
                </div>
              ))}
            </div>

            {selected.productType === "storybook" && (
              <div
                className="adm-caption"
                style={{
                  padding: "12px",
                  borderRadius: "var(--adm-radius)",
                  background: C.surface,
                  border: `1px solid ${C.cardBorder}`,
                  color: C.muted,
                  marginBottom: "14px",
                  lineHeight: 1.6,
                }}
              >
                <div>
                  Stage:{" "}
                  <strong style={{ color: C.text }}>
                    {selected.metaSummary.generationStage || "—"}
                  </strong>{" "}
                  ({selected.metaSummary.pagesIllustrated}/
                  {selected.metaSummary.totalPages}{" "}
                  {tAdmin(lang, "иллюстр.", "ілюстр.")})
                </div>
                <div>
                  Style: {selected.metaSummary.artStyle} · Layout:{" "}
                  {selected.metaSummary.layoutMode} · Age:{" "}
                  {selected.metaSummary.ageGroup}
                </div>
              </div>
            )}

            {selected.errorMessage && (
              <Alert variant="error" title="Error">
                <span style={{ fontFamily: "monospace", wordBreak: "break-word" }}>
                  {selected.errorMessage}
                </span>
              </Alert>
            )}

            {/* AI Cost Breakdown */}
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "var(--adm-radius)",
                background: C.surface,
                border: `1px solid ${C.cardBorder}`,
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: selected.aiCost ? "10px" : 0,
                }}
              >
                <SectionLabel>
                  {tAdmin(lang, "Расходы ИИ", "Витрати ШІ")}
                </SectionLabel>
                <span
                  className="adm-mono"
                  style={{
                    fontSize: "var(--adm-fs-caption)",
                    fontWeight: 600,
                    color: C.blue,
                  }}
                >
                  {selected.aiCost
                    ? `$${selected.aiCost.totalUsd.toFixed(4)} (${fmtUah(
                        selected.aiCost.totalUahKopiykas
                      )})`
                    : tAdmin(lang, "не измерено", "не виміряно")}
                </span>
              </div>
              {selected.aiCost && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    maxHeight: "150px",
                    overflowY: "auto",
                  }}
                >
                  {selected.aiCost.breakdown.map((b, idx) => (
                    <div
                      key={idx}
                      className="adm-caption"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                        color: C.muted,
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {b.step} ({b.calls}x {b.model})
                      </span>
                      <span style={{ fontFamily: "monospace", flexShrink: 0, color: C.text }}>
                        ${b.costUsd.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div
              style={{
                paddingTop: "14px",
                borderTop: `1px solid ${C.cardBorder}`,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                <Button
                  variant="primary"
                  disabled={
                    busyAction !== null || selected.productType !== "storybook"
                  }
                  onClick={() => void runOrderAction(selected.id, "resume")}
                >
                  <RotateCcw size={14} />
                  Resume
                </Button>

                <Button
                  variant="ghost"
                  disabled={busyAction !== null || !selected.monoInvoiceId}
                  onClick={() => void runOrderAction(selected.id, "sync_mono")}
                >
                  <RefreshCw size={14} />
                  Sync Mono
                </Button>

                <Button
                  variant="danger"
                  disabled={
                    busyAction !== null ||
                    (selected.monoStatus !== "hold" &&
                      selected.monoStatus !== "success")
                  }
                  onClick={() => void runOrderAction(selected.id, "refund")}
                >
                  <Undo2 size={14} />
                  {tAdmin(lang, "Возврат / Холд", "Повернення / Холд")}
                </Button>

                <Button
                  variant="ghost"
                  disabled={busyAction !== null}
                  onClick={() =>
                    void runOrderAction(selected.id, "grant_ai_edit")
                  }
                >
                  <Plus size={14} />
                  +1 AI-правка
                </Button>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {selected.status === "paid" && selected.customerEmail && (
                  <Button
                    variant="ghost"
                    disabled={busyAction !== null}
                    onClick={() =>
                      void runOrderAction(selected.id, "resend_email")
                    }
                  >
                    <Mail size={14} />
                    {tAdmin(lang, "Повторить письмо", "Надіслати лист")}
                  </Button>
                )}
                <Link
                  href={selected.orderUrl}
                  target="_blank"
                  className="aui-btn aui-btn--ghost"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  <ExternalLink size={14} />
                  {tAdmin(lang, "Страница клиента", "Сторінка клієнта")}
                </Link>
              </div>

              {selected.receiptUrl && (
                <a
                  href={selected.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="adm-caption"
                  style={{
                    textAlign: "center",
                    color: C.green,
                    marginTop: "4px",
                  }}
                >
                  {tAdmin(
                    lang,
                    "Открыть чек Plata / ПРРО ↗",
                    "Відкрити чек Plata / ПРРО ↗"
                  )}
                </a>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
