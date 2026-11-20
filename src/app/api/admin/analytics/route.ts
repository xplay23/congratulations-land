import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { getOrdersForAnalytics } from "@/lib/db";
import type {
  ArtStyle,
  ProductType,
  StorybookOrderPayload,
  VideoOrderPayload,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function resolveFromIso(period: string | null): string | undefined {
  const now = Date.now();
  if (period === "7d") return new Date(now - 7 * 86400_000).toISOString();
  if (period === "30d") return new Date(now - 30 * 86400_000).toISOString();
  if (period === "90d") return new Date(now - 90 * 86400_000).toISOString();
  return undefined;
}

function toWeekStartIso(isoDate: string): string {
  const d = new Date(isoDate);
  const day = d.getUTCDay(); // 0=Sun .. 6=Sat
  const diffToMon = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMon);
  return d.toISOString().slice(0, 10);
}

function pct(num: number, den: number): number {
  if (!den) return 0;
  return Number(((num / den) * 100).toFixed(1));
}

function bucketVideoAge(ageRaw?: string): string {
  const m = String(ageRaw || "").match(/\d+/);
  if (!m) return "not_specified";
  const n = Number(m[0]);
  if (n <= 3) return "1-3";
  if (n <= 6) return "4-6";
  if (n <= 10) return "7-10";
  return "11+";
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const period = sp.get("period") || "30d";
  const groupBy = sp.get("groupBy") === "week" ? "week" : "day";
  const ptParam = sp.get("productType");
  const productType: ProductType | "all" =
    ptParam === "storybook" || ptParam === "video" ? ptParam : "all";

  const rows = getOrdersForAnalytics({
    fromIso: resolveFromIso(period),
    productType,
  });

  let previewReadyOrBeyond = 0;
  let checkoutStarted = 0;
  let paidOrders = 0;
  let failedOrders = 0;
  let generatingOrders = 0;
  let heldOrders = 0;
  let reversedOrders = 0;

  let revenueKopiykas = 0;
  let aiCostKopiykas = 0;
  let aiCostUsd = 0;
  let measuredCostOrders = 0;
  let unmeasuredOrders = 0;

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalImageCalls = 0;
  let totalVisionQaRetries = 0;
  let totalElevenLabsChars = 0;

  let withChildPhoto = 0;
  let withCompanionPhoto = 0;

  const timelineMap = new Map<
    string,
    {
      bucket: string;
      created: number;
      paid: number;
      failed: number;
      revenueKopiykas: number;
      aiCostKopiykas: number;
      marginKopiykas: number;
    }
  >();

  const productMap = new Map<
    string,
    {
      key: string;
      count: number;
      paid: number;
      revenueKopiykas: number;
      aiCostKopiykas: number;
    }
  >();

  const artStyleMap = new Map<
    ArtStyle,
    { key: ArtStyle; count: number; paid: number; revenueKopiykas: number }
  >();
  const layoutMap = new Map<string, { key: string; count: number; paid: number }>();
  const ageMap = new Map<string, { key: string; count: number; paid: number }>();
  const langMap = new Map<string, { key: string; count: number; paid: number }>();
  const companionMap = new Map<string, { key: string; count: number; paid: number }>();

  for (const r of rows) {
    const isPaid = r.status === "paid";
    const isFailed = r.status === "failed";
    const isGenerating = r.status === "generating";
    const isHeld = r.monoStatus === "hold" && !isPaid;
    const isReversed = r.monoStatus === "reversed";

    if (
      r.status === "preview_ready" ||
      isPaid ||
      Boolean(r.resultSummary) ||
      Boolean(r.monoInvoiceId)
    ) {
      previewReadyOrBeyond += 1;
    }
    if (r.monoInvoiceId) checkoutStarted += 1;
    if (isPaid) paidOrders += 1;
    if (isFailed) failedOrders += 1;
    if (isGenerating) generatingOrders += 1;
    if (isHeld) heldOrders += 1;
    if (isReversed) reversedOrders += 1;

    const orderRev = isPaid ? r.priceKopiykas : 0;
    revenueKopiykas += orderRev;

    const orderCostKopiykas = r.aiCost?.totalUahKopiykas ?? 0;
    if (r.aiCost) {
      measuredCostOrders += 1;
      aiCostKopiykas += orderCostKopiykas;
      aiCostUsd += r.aiCost.totalUsd || 0;
      totalInputTokens += r.aiCost.totalInputTokens || 0;
      totalOutputTokens += r.aiCost.totalOutputTokens || 0;
      totalImageCalls += r.aiCost.totalImageCalls || 0;
      totalVisionQaRetries += r.aiCost.visionQaRetries || 0;
      totalElevenLabsChars += r.aiCost.elevenLabsChars || 0;
    } else {
      unmeasuredOrders += 1;
    }

    // Timeline bucket
    const bucketKey =
      groupBy === "week" ? toWeekStartIso(r.createdAt) : r.createdAt.slice(0, 10);
    const tb = timelineMap.get(bucketKey) || {
      bucket: bucketKey,
      created: 0,
      paid: 0,
      failed: 0,
      revenueKopiykas: 0,
      aiCostKopiykas: 0,
      marginKopiykas: 0,
    };
    tb.created += 1;
    if (isPaid) tb.paid += 1;
    if (isFailed) tb.failed += 1;
    tb.revenueKopiykas += orderRev;
    tb.aiCostKopiykas += orderCostKopiykas;
    tb.marginKopiykas = tb.revenueKopiykas - tb.aiCostKopiykas;
    timelineMap.set(bucketKey, tb);

    // Language
    const lb = langMap.get(r.lang) || { key: r.lang, count: 0, paid: 0 };
    lb.count += 1;
    if (isPaid) lb.paid += 1;
    langMap.set(r.lang, lb);

    // Product breakdown
    if (r.productType === "storybook") {
      const p = r.payload as StorybookOrderPayload;
      const tierKey = p.pageCount >= 8 ? "storybook_8" : "storybook_4_6";
      const pb = productMap.get(tierKey) || {
        key: tierKey,
        count: 0,
        paid: 0,
        revenueKopiykas: 0,
        aiCostKopiykas: 0,
      };
      pb.count += 1;
      if (isPaid) pb.paid += 1;
      pb.revenueKopiykas += orderRev;
      pb.aiCostKopiykas += orderCostKopiykas;
      productMap.set(tierKey, pb);

      // Art style
      const st = p.artStyle || "watercolor";
      const sb = artStyleMap.get(st) || {
        key: st,
        count: 0,
        paid: 0,
        revenueKopiykas: 0,
      };
      sb.count += 1;
      if (isPaid) sb.paid += 1;
      sb.revenueKopiykas += orderRev;
      artStyleMap.set(st, sb);

      // Layout
      const lm = p.layoutMode || "classic";
      const lmb = layoutMap.get(lm) || { key: lm, count: 0, paid: 0 };
      lmb.count += 1;
      if (isPaid) lmb.paid += 1;
      layoutMap.set(lm, lmb);

      // Age
      const ag = `storybook:${p.ageGroup || "6-8"}`;
      const ab = ageMap.get(ag) || { key: ag, count: 0, paid: 0 };
      ab.count += 1;
      if (isPaid) ab.paid += 1;
      ageMap.set(ag, ab);

      // Companion & photo
      const ct = p.companionType || "none";
      const cb = companionMap.get(ct) || { key: ct, count: 0, paid: 0 };
      cb.count += 1;
      if (isPaid) cb.paid += 1;
      companionMap.set(ct, cb);

      if (p.photoUploadId) withChildPhoto += 1;
      if (p.companionPhotoUploadId) withCompanionPhoto += 1;
    } else {
      const p = r.payload as VideoOrderPayload;
      const pb = productMap.get("video") || {
        key: "video",
        count: 0,
        paid: 0,
        revenueKopiykas: 0,
        aiCostKopiykas: 0,
      };
      pb.count += 1;
      if (isPaid) pb.paid += 1;
      pb.revenueKopiykas += orderRev;
      pb.aiCostKopiykas += orderCostKopiykas;
      productMap.set("video", pb);

      const ag = `video:${bucketVideoAge(p.age)}`;
      const ab = ageMap.get(ag) || { key: ag, count: 0, paid: 0 };
      ab.count += 1;
      if (isPaid) ab.paid += 1;
      ageMap.set(ag, ab);

      if (p.photoUploadId) withChildPhoto += 1;
    }
  }

  const totalOrders = rows.length;
  const grossMarginKopiykas = revenueKopiykas - aiCostKopiykas;
  const grossMarginPct = pct(grossMarginKopiykas, revenueKopiykas);

  return NextResponse.json(
    {
      period,
      groupBy,
      productType,
      summary: {
        totalOrders,
        previewReadyOrBeyond,
        checkoutStarted,
        paidOrders,
        failedOrders,
        generatingOrders,
        heldOrders,
        reversedOrders,
        totalToPaidPct: pct(paidOrders, totalOrders),
        previewToPaidPct: pct(paidOrders, previewReadyOrBeyond),
        revenueKopiykas,
        aiCostKopiykas,
        aiCostUsd: Number(aiCostUsd.toFixed(4)),
        grossMarginKopiykas,
        grossMarginPct,
        avgCheckKopiykas: paidOrders ? Math.round(revenueKopiykas / paidOrders) : 0,
        avgAiCostKopiykas: measuredCostOrders
          ? Math.round(aiCostKopiykas / measuredCostOrders)
          : 0,
        measuredCostOrders,
        unmeasuredOrders,
      },
      funnel: [
        { step: "created", count: totalOrders, pctOfTotal: 100 },
        {
          step: "preview_ready",
          count: previewReadyOrBeyond,
          pctOfTotal: pct(previewReadyOrBeyond, totalOrders),
        },
        {
          step: "checkout_started",
          count: checkoutStarted,
          pctOfTotal: pct(checkoutStarted, totalOrders),
        },
        {
          step: "paid",
          count: paidOrders,
          pctOfTotal: pct(paidOrders, totalOrders),
        },
      ],
      timeline: Array.from(timelineMap.values()),
      byProduct: Array.from(productMap.values()).map((p) => ({
        ...p,
        conversionPct: pct(p.paid, p.count),
        marginKopiykas: p.revenueKopiykas - p.aiCostKopiykas,
      })),
      byArtStyle: Array.from(artStyleMap.values())
        .sort((a, b) => b.count - a.count)
        .map((s) => ({ ...s, conversionPct: pct(s.paid, s.count) })),
      byLayoutMode: Array.from(layoutMap.values()).map((l) => ({
        ...l,
        conversionPct: pct(l.paid, l.count),
      })),
      byAgeGroup: Array.from(ageMap.values()).sort((a, b) =>
        a.key.localeCompare(b.key)
      ),
      byLang: Array.from(langMap.values()).map((l) => ({
        ...l,
        conversionPct: pct(l.paid, l.count),
      })),
      byCompanionType: Array.from(companionMap.values()).sort(
        (a, b) => b.count - a.count
      ),
      photoStats: {
        withChildPhoto,
        withoutChildPhoto: Math.max(0, totalOrders - withChildPhoto),
        withChildPhotoPct: pct(withChildPhoto, totalOrders),
        withCompanionPhoto,
      },
      aiMetrics: {
        totalInputTokens,
        totalOutputTokens,
        totalImageCalls,
        totalVisionQaRetries,
        totalElevenLabsChars,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
