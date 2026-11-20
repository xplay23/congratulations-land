"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import {
  Alert,
  BarRow,
  Button,
  C,
  Card,
  SectionLabel,
  Select,
} from "@engine/components/admin/ui";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";
import { AdminSystemHealthCard } from "./AdminSystemHealthCard";
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
  byLang: Array<{
    key: string;
    count: number;
    paid: number;
    conversionPct: number;
  }>;
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

function KpiCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <Card>
      <div
        className="adm-label"
        style={{ color: C.muted, opacity: 0.7, marginBottom: "10px" }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "30px",
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: "-0.02em",
          color: valueColor || C.text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="adm-caption"
          style={{ color: C.muted, opacity: 0.75, marginTop: "6px" }}
        >
          {sub}
        </div>
      )}
    </Card>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "var(--adm-radius)",
        background: C.surface,
        border: `1px solid ${C.cardBorder}`,
        textAlign: "center",
      }}
    >
      <div
        className="adm-badge"
        style={{ color: C.muted, opacity: 0.75, marginBottom: "4px" }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: color || C.text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "10px 12px",
        borderRadius: "var(--adm-radius-sm)",
        background: C.surface,
        border: `1px solid ${C.cardBorder}`,
      }}
    >
      <span className="adm-body" style={{ color: C.muted }}>
        {label}
      </span>
      <span
        className="adm-mono"
        style={{
          color: valueColor || C.text,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
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

export function AdminAnalyticsTab() {
  const lang = useAdminLang();
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
    created: tAdmin(lang, "Создано заказов", "Створено замовлень"),
    preview_ready: tAdmin(lang, "Превью готово", "Прев'ю готове"),
    checkout_started: tAdmin(
      lang,
      "Переход к оплате Mono",
      "Перехід до оплати Mono"
    ),
    paid: tAdmin(lang, "Успешно оплачено", "Успішно оплачено"),
  };

  const productLabels: Record<string, string> = {
    storybook_4_6: tAdmin(
      lang,
      "Сказка PDF (4–6 стр.)",
      "Казка PDF (4–6 стор.)"
    ),
    storybook_8: tAdmin(lang, "Сказка PDF (8 стр.)", "Казка PDF (8 стор.)"),
    video: tAdmin(lang, "Видеопоздравление HD", "Відеопривітання HD"),
  };

  const companionLabels: Record<string, string> = {
    none: tAdmin(lang, "Без спутника", "Без супутника"),
    pet: tAdmin(lang, "Питомец", "Улюбленець"),
    family: tAdmin(lang, "Член семьи", "Член родини"),
    friend: tAdmin(lang, "Друг / подруга", "Друг / подруга"),
  };

  const periodOptions: Array<{ value: "7d" | "30d" | "90d" | "all"; label: string }> = [
    { value: "7d", label: tAdmin(lang, "7 дней", "7 днів") },
    { value: "30d", label: tAdmin(lang, "30 дней", "30 днів") },
    { value: "90d", label: tAdmin(lang, "90 дней", "90 днів") },
    { value: "all", label: tAdmin(lang, "Всё время", "Увесь час") },
  ];

  if (loading && !data) {
    return (
      <Card
        style={{
          padding: "48px 24px",
          textAlign: "center",
          color: C.muted,
        }}
      >
        <span className="adm-body">
          {tAdmin(lang, "Загрузка аналитики…", "Завантаження аналітики…")}
        </span>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="error" title={tAdmin(lang, "Ошибка загрузки", "Помилка завантаження")}>
        {error}
      </Alert>
    );
  }

  if (!data) return null;

  const s = data.summary;
  const maxTimelineRev = Math.max(
    1,
    ...data.timeline.map((t) => Math.max(t.revenueKopiykas, t.aiCostKopiykas))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Filters & Privacy bar (Domainer PeriodTabs style) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            className="adm-label"
            style={{ color: C.muted, opacity: 0.6 }}
          >
            {tAdmin(lang, "Период", "Період")}
          </span>
          <div
            style={{
              display: "inline-flex",
              gap: "2px",
              padding: "3px",
              borderRadius: "var(--adm-radius)",
              border: `1px solid ${C.cardBorder}`,
              background: C.card,
            }}
          >
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={`aui-period-tab${
                  period === opt.value ? " aui-period-tab--active" : ""
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div style={{ width: "170px" }}>
            <Select
              value={productType}
              onChange={(v) => setProductType(v as typeof productType)}
              options={[
                { value: "all", label: tAdmin(lang, "Все услуги", "Усі послуги") },
                { value: "storybook", label: tAdmin(lang, "Сказки PDF", "Казки PDF") },
                { value: "video", label: tAdmin(lang, "Видео HD", "Відео HD") },
              ]}
            />
          </div>

          <div
            style={{
              display: "inline-flex",
              gap: "2px",
              padding: "3px",
              borderRadius: "var(--adm-radius)",
              border: `1px solid ${C.cardBorder}`,
              background: C.card,
            }}
          >
            {(["day", "week"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupBy(g)}
                className={`aui-period-tab${
                  groupBy === g ? " aui-period-tab--active" : ""
                }`}
              >
                {g === "day"
                  ? tAdmin(lang, "Дни", "Дні")
                  : tAdmin(lang, "Недели", "Тижні")}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={() => void loadAnalytics()}
            disabled={loading}
          >
            <RefreshCw size={14} />
            {tAdmin(lang, "Обновить", "Оновити")}
          </Button>
        </div>

        <div
          className="adm-caption"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: C.muted,
          }}
        >
          <ShieldCheck size={15} style={{ color: C.green, flexShrink: 0 }} />
          <span>
            {tAdmin(
              lang,
              "Обезличенная аналитика: без email, имён и фото",
              "Знеособлена аналітика: без email, імен та фото"
            )}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
        }}
      >
        <KpiCard
          label={tAdmin(lang, "Заказы / Оплачено", "Замовлення / Оплачено")}
          value={
            <>
              {s.totalOrders}{" "}
              <span style={{ fontSize: "20px", fontWeight: 600, color: C.green }}>
                / {s.paidOrders}
              </span>
            </>
          }
          sub={
            <>
              {tAdmin(lang, "Из превью:", "З прев'ю:")}{" "}
              <strong style={{ color: C.text }}>{s.previewToPaidPct}%</strong> ·{" "}
              {tAdmin(lang, "общая:", "загальна:")} {s.totalToPaidPct}%
            </>
          }
        />

        <KpiCard
          label={tAdmin(lang, "Выручка (оплаченные)", "Виручка (оплачені)")}
          value={fmtUah(s.revenueKopiykas)}
          valueColor={C.green}
          sub={`${tAdmin(lang, "Средний чек:", "Середній чек:")} ${fmtUah(
            s.avgCheckKopiykas
          )}`}
        />

        <KpiCard
          label={tAdmin(lang, "Расходы на ИИ", "Витрати на ШІ")}
          value={fmtUah(s.aiCostKopiykas)}
          valueColor={C.blue}
          sub={`$${s.aiCostUsd.toFixed(2)} · ${tAdmin(
            lang,
            `замер в ${s.measuredCostOrders}/${s.totalOrders}`,
            `замір у ${s.measuredCostOrders}/${s.totalOrders}`
          )}`}
        />

        <KpiCard
          label={tAdmin(lang, "Валовая маржа", "Валова маржа")}
          value={fmtUah(s.grossMarginKopiykas)}
          valueColor={s.grossMarginKopiykas >= 0 ? C.text : C.red}
          sub={`${s.grossMarginPct}% · ${tAdmin(
            lang,
            `Холды: ${s.heldOrders} · Ошибки: ${s.failedOrders}`,
            `Холди: ${s.heldOrders} · Помилки: ${s.failedOrders}`
          )}`}
        />
      </div>

      {/* Funnel + Timeline */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "20px",
        }}
      >
        <Card>
          <SectionLabel>
            {tAdmin(lang, "Воронка конверсии", "Воронка конверсії")}
          </SectionLabel>
          <div style={{ marginTop: "12px" }}>
            {data.funnel.map((f) => (
              <BarRow
                key={f.step}
                label={funnelLabels[f.step] || f.step}
                count={f.count}
                pct={f.pctOfTotal}
                color={C.blue}
              />
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              marginTop: "18px",
              paddingTop: "16px",
              borderTop: `1px solid ${C.cardBorder}`,
            }}
          >
            <MiniStat
              label={tAdmin(lang, "Генерация", "Генерація")}
              value={s.generatingOrders}
              color={C.amber}
            />
            <MiniStat
              label={tAdmin(lang, "Ошибки", "Помилки")}
              value={s.failedOrders}
              color={C.red}
            />
            <MiniStat
              label={tAdmin(lang, "Возвраты", "Повернення")}
              value={s.reversedOrders}
            />
          </div>
        </Card>

        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <SectionLabel>
              {tAdmin(
                lang,
                "Динамика выручки и расходов ИИ",
                "Динаміка виручки та витрат ШІ"
              )}
            </SectionLabel>
            <div
              className="adm-badge"
              style={{ display: "flex", alignItems: "center", gap: "12px", color: C.muted }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: C.green,
                  }}
                />
                {tAdmin(lang, "Выручка", "Виручка")}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: C.blue,
                  }}
                />
                AI
              </span>
            </div>
          </div>

          {data.timeline.length === 0 ? (
            <div
              className="adm-body"
              style={{ padding: "40px 16px", textAlign: "center", color: C.muted, opacity: 0.6 }}
            >
              {tAdmin(
                lang,
                "Нет данных за выбранный период",
                "Немає даних за обраний період"
              )}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {data.timeline.map((row) => {
                const revPct = Math.round((row.revenueKopiykas / maxTimelineRev) * 100);
                const costPct = Math.round((row.aiCostKopiykas / maxTimelineRev) * 100);
                return (
                  <div
                    key={row.bucket}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "var(--adm-radius)",
                      background: C.surface,
                      border: `1px solid ${C.cardBorder}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <span className="adm-mono" style={{ fontWeight: 600, color: C.text }}>
                        {row.bucket}
                      </span>
                      <span className="adm-caption" style={{ color: C.muted }}>
                        {row.created} {tAdmin(lang, "зак.", "зам.")} ·{" "}
                        <span style={{ color: C.green }}>
                          {row.paid} {tAdmin(lang, "опл.", "опл.")}
                        </span>{" "}
                        · {tAdmin(lang, "Маржа", "Маржа")}:{" "}
                        <strong style={{ color: C.text }}>
                          {fmtUah(row.marginKopiykas)}
                        </strong>
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            flex: 1,
                            height: "6px",
                            borderRadius: "3px",
                            background: "var(--theme-elevation-150)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.max(row.revenueKopiykas > 0 ? 2 : 0, revPct)}%`,
                              background: C.green,
                            }}
                          />
                        </div>
                        <span
                          className="adm-caption"
                          style={{
                            width: "76px",
                            textAlign: "right",
                            fontFamily: "monospace",
                            color: C.green,
                          }}
                        >
                          {fmtUah(row.revenueKopiykas)}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            flex: 1,
                            height: "6px",
                            borderRadius: "3px",
                            background: "var(--theme-elevation-150)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.max(row.aiCostKopiykas > 0 ? 2 : 0, costPct)}%`,
                              background: C.blue,
                            }}
                          />
                        </div>
                        <span
                          className="adm-caption"
                          style={{
                            width: "76px",
                            textAlign: "right",
                            fontFamily: "monospace",
                            color: C.blue,
                          }}
                        >
                          {fmtUah(row.aiCostKopiykas)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Product Margins + AI Resource Consumption */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "20px",
        }}
      >
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 20px 10px" }}>
            <SectionLabel>
              {tAdmin(lang, "Маржинальность по услугам", "Маржинальність за послугами")}
            </SectionLabel>
          </div>
          <div className="aui-scroll-x">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                  <th style={TH_STYLE}>{tAdmin(lang, "Продукт", "Продукт")}</th>
                  <th style={TH_STYLE}>{tAdmin(lang, "Создано", "Створено")}</th>
                  <th style={TH_STYLE}>{tAdmin(lang, "Оплачено", "Оплачено")}</th>
                  <th style={TH_STYLE}>{tAdmin(lang, "Конв.", "Конв.")}</th>
                  <th style={TH_STYLE}>{tAdmin(lang, "Выручка", "Виручка")}</th>
                  <th style={TH_STYLE}>AI</th>
                  <th style={TH_STYLE}>{tAdmin(lang, "Маржа", "Маржа")}</th>
                </tr>
              </thead>
              <tbody>
                {data.byProduct.map((p, idx) => (
                  <tr
                    key={p.key}
                    style={{
                      borderBottom:
                        idx < data.byProduct.length - 1
                          ? `1px solid ${C.cardBorder}`
                          : "none",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "var(--adm-fs-body)",
                        fontWeight: 600,
                        color: C.text,
                      }}
                    >
                      {productLabels[p.key] || p.key}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "var(--adm-fs-body)", color: C.muted }}>
                      {p.count}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "var(--adm-fs-body)", color: C.green, fontWeight: 600 }}>
                      {p.paid}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "var(--adm-fs-body)", color: C.text }}>
                      {p.conversionPct}%
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "var(--adm-fs-body)", fontFamily: "monospace", color: C.text }}>
                      {fmtUah(p.revenueKopiykas)}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "var(--adm-fs-body)", fontFamily: "monospace", color: C.blue }}>
                      {fmtUah(p.aiCostKopiykas)}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "var(--adm-fs-body)",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: p.marginKopiykas >= 0 ? C.green : C.red,
                      }}
                    >
                      {fmtUah(p.marginKopiykas)}
                    </td>
                  </tr>
                ))}
                {data.byProduct.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: "24px",
                        textAlign: "center",
                        fontSize: "var(--adm-fs-body)",
                        color: C.muted,
                      }}
                    >
                      —
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionLabel>
            {tAdmin(lang, "Потребление ресурсов ИИ", "Споживання ресурсів ШІ")}
          </SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
            <MetricRow
              label="Input / Output tokens"
              value={`${data.aiMetrics.totalInputTokens.toLocaleString()} / ${data.aiMetrics.totalOutputTokens.toLocaleString()}`}
            />
            <MetricRow
              label={tAdmin(lang, "Вызовы gpt-image", "Виклики gpt-image")}
              value={data.aiMetrics.totalImageCalls}
            />
            <MetricRow
              label="Vision QA repairs"
              value={data.aiMetrics.totalVisionQaRetries}
              valueColor={C.amber}
            />
            <MetricRow
              label="ElevenLabs chars"
              value={data.aiMetrics.totalElevenLabsChars.toLocaleString()}
            />
            <MetricRow
              label={tAdmin(
                lang,
                "Сред. ИИ-расход / замер",
                "Середн. ШІ-витрати / замір"
              )}
              value={fmtUah(s.avgAiCostKopiykas)}
              valueColor={C.blue}
            />
          </div>
        </Card>
      </div>

      {/* Styles, Ages/Languages, Photos/Companions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        <Card>
          <SectionLabel>
            {tAdmin(lang, "Популярные стили сказок", "Популярні стилі казок")}
          </SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
            {data.byArtStyle.map((st) => (
              <div
                key={st.key}
                className="adm-body"
                style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}
              >
                <span style={{ color: C.text }}>
                  {ART_STYLE_META[st.key]?.label[isUk ? "uk" : "ru"] || st.key}
                </span>
                <span style={{ fontFamily: "monospace", color: C.muted }}>
                  {st.count} ({st.paid} опл. · {st.conversionPct}%)
                </span>
              </div>
            ))}
            {data.byArtStyle.length === 0 && (
              <div className="adm-body" style={{ color: C.muted, opacity: 0.6 }}>—</div>
            )}
          </div>
        </Card>

        <Card>
          <SectionLabel>
            {tAdmin(lang, "Возрастные группы", "Вікові групи")}
          </SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px", marginBottom: "16px" }}>
            {data.byAgeGroup.map((a) => (
              <div
                key={a.key}
                className="adm-body"
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span style={{ color: C.text }}>{a.key}</span>
                <span style={{ fontFamily: "monospace", color: C.muted }}>
                  {a.count} ({a.paid} опл.)
                </span>
              </div>
            ))}
            {data.byAgeGroup.length === 0 && (
              <div className="adm-body" style={{ color: C.muted, opacity: 0.6 }}>—</div>
            )}
          </div>

          <div style={{ borderTop: `1px solid ${C.cardBorder}`, paddingTop: "14px" }}>
            <SectionLabel>
              {tAdmin(lang, "Языки и вёрстка", "Мови та верстка")}
            </SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              {data.byLang.map((l) => (
                <div
                  key={l.key}
                  className="adm-body"
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ textTransform: "uppercase", color: C.text }}>
                    {l.key}
                  </span>
                  <span style={{ fontFamily: "monospace", color: C.muted }}>
                    {l.count} ({l.paid} опл. · {l.conversionPct}%)
                  </span>
                </div>
              ))}
              {data.byLayoutMode.map((lm) => (
                <div
                  key={lm.key}
                  className="adm-body"
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: C.text }}>layout: {lm.key}</span>
                  <span style={{ fontFamily: "monospace", color: C.muted }}>
                    {lm.count} ({lm.paid} опл.)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <SectionLabel>
            {tAdmin(lang, "Фото и спутники", "Фото та супутники")}
          </SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px", marginBottom: "16px" }}>
            <div className="adm-body" style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.text }}>
                {tAdmin(lang, "С фото ребёнка", "З фото дитини")}
              </span>
              <span style={{ fontFamily: "monospace", color: C.text, fontWeight: 600 }}>
                {data.photoStats.withChildPhoto} ({data.photoStats.withChildPhotoPct}%)
              </span>
            </div>
            <div className="adm-body" style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.text }}>
                {tAdmin(lang, "С фото спутника", "З фото супутника")}
              </span>
              <span style={{ fontFamily: "monospace", color: C.muted }}>
                {data.photoStats.withCompanionPhoto}
              </span>
            </div>
          </div>

          <div
            style={{
              borderTop: `1px solid ${C.cardBorder}`,
              paddingTop: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {data.byCompanionType.map((c) => (
              <div
                key={c.key}
                className="adm-body"
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span style={{ color: C.text }}>
                  {companionLabels[c.key] || c.key}
                </span>
                <span style={{ fontFamily: "monospace", color: C.muted }}>
                  {c.count} ({c.paid} опл.)
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* System Health (at bottom of Dashboard) */}
      <AdminSystemHealthCard />
    </div>
  );
}
