import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { listOrdersAdmin } from "@/lib/db";
import { getProgressLabel } from "@/lib/i18n";
import type {
  StorybookOrderPayload,
  StorybookResult,
  VideoOrderPayload,
  VideoResult,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function resolvePeriodFromIso(period: string | null): string | undefined {
  const now = Date.now();
  if (period === "7d") return new Date(now - 7 * 86400_000).toISOString();
  if (period === "30d") return new Date(now - 30 * 86400_000).toISOString();
  if (period === "90d") return new Date(now - 90 * 86400_000).toISOString();
  return undefined;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status") || "all";
  const productType = sp.get("productType") || "all";
  const lang = sp.get("lang") || "all";
  const search = sp.get("q") || "";
  const period = sp.get("period") || "30d";
  const limit = Number(sp.get("limit") || "50");
  const offset = Number(sp.get("offset") || "0");

  const { orders, total } = await listOrdersAdmin({
    status,
    productType,
    lang,
    search,
    fromIso: resolvePeriodFromIso(period),
    limit,
    offset,
  });

  const items = orders.map((o) => {
    const isStorybook = o.productType === "storybook";
    const sbPayload = isStorybook ? (o.payload as StorybookOrderPayload) : null;
    const vidPayload = !isStorybook ? (o.payload as VideoOrderPayload) : null;
    const sbResult = isStorybook ? (o.result as StorybookResult | null) : null;
    const vidResult = !isStorybook ? (o.result as VideoResult | null) : null;

    const revenueKopiykas = o.status === "paid" ? o.priceKopiykas : 0;
    const aiCostKopiykas = o.aiCost?.totalUahKopiykas ?? null;
    const marginKopiykas =
      aiCostKopiykas !== null ? revenueKopiykas - aiCostKopiykas : null;

    const pagesIllustrated = sbResult
      ? sbResult.pages.filter((p) => Boolean(p.cleanImageFile)).length
      : 0;

    return {
      id: o.id,
      productType: o.productType,
      lang: o.lang,
      status: o.status,
      progressStep: o.progressStep,
      progressLabel: getProgressLabel(o.progressStep, o.lang),
      progressPercent: o.progressPercent,
      errorMessage: o.errorMessage || null,
      childName: o.payload.childName,
      title:
        sbResult?.title ||
        (isStorybook
          ? `${o.payload.childName} (${sbPayload?.pageCount || 6} стор.)`
          : `Відео: ${o.payload.childName}`),
      metaSummary: isStorybook
        ? {
            pageCount: sbPayload?.pageCount || 6,
            pagesIllustrated,
            totalPages: sbResult?.pages?.length || sbPayload?.pageCount || 6,
            artStyle: sbPayload?.artStyle,
            layoutMode: sbPayload?.layoutMode,
            ageGroup: sbPayload?.ageGroup,
            generationStage: sbResult?.generationStage || null,
            modeUsed: sbResult?.modeUsed || null,
          }
        : {
            age: vidPayload?.age || "",
            modeUsed: vidResult?.modeUsed || null,
          },
      priceKopiykas: o.priceKopiykas,
      revenueKopiykas,
      aiCost: o.aiCost || null,
      aiCostKopiykas,
      marginKopiykas,
      monoInvoiceId: o.monoInvoiceId || null,
      monoPaymentUrl: o.monoPaymentUrl || null,
      monoStatus: o.monoStatus || null,
      receiptUrl: o.receiptUrl || null,
      customerEmail: o.customerEmail || null,
      telegramChatId: o.telegramChatId || null,
      aiEditsUsed: o.aiEditsUsed,
      aiEditsLimit: o.aiEditsLimit,
      hasResult: Boolean(o.result),
      orderUrl: `/orders/${o.id}?token=${encodeURIComponent(o.accessToken)}`,
      downloadUrl:
        o.status === "paid"
          ? `/api/orders/${o.id}/download?token=${encodeURIComponent(o.accessToken)}`
          : null,
      expiresAt: o.expiresAt,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  });

  return NextResponse.json(
    { orders: items, total, limit, offset },
    { headers: { "Cache-Control": "no-store" } }
  );
}
