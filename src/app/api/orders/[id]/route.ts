import { NextRequest, NextResponse } from "next/server";
import {
  cleanupExpiredOrders,
  getOrderById,
  markOrderPaid,
  setOrderMonoInvoice,
} from "@/lib/db";
import { sendPaidOrderEmail } from "@/lib/email/mailer";
import { getProgressLabel } from "@/lib/i18n";
import { fetchMonoInvoiceStatus, isMonoSandboxMode } from "@/lib/payments/mono";
import {
  getOrCreateSessionId,
  getVerifiedEmailFromCookie,
  isAdminAuthenticated,
} from "@/lib/session";
import { assertSafeId } from "@/lib/storage";
import { getTelegramBotUsername } from "@/lib/telegram/bot";
import { triggerStorybookFinalization } from "@/lib/storybook/pipeline";
import { getAppBaseUrl } from "@/lib/url";
import type { StorybookResult, VideoResult } from "@/lib/types";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    cleanupExpiredOrders();
    const { id } = await context.params;
    let order = getOrderById(assertSafeId(id));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Reconcile Plata by mono status on redirect back (essential for localhost or missed webhooks)
    if (
      !isMonoSandboxMode() &&
      order.status === "preview_ready" &&
      order.monoInvoiceId &&
      !order.monoInvoiceId.startsWith("sandbox_")
    ) {
      try {
        const mono = await fetchMonoInvoiceStatus(order.monoInvoiceId);
        const sr = order.result as StorybookResult | null;
        const needsStage2 =
          order.productType === "storybook" && sr?.generationStage !== "complete";

        if (mono.status === "hold" || (mono.status === "success" && needsStage2)) {
          const started = triggerStorybookFinalization(
            order.id,
            getAppBaseUrl(req),
            mono.status,
            mono.receiptUrl || null
          );
          if (started) {
            order = started;
          }
        } else if (mono.status === "success") {
          const updated = markOrderPaid(order.id, "success", mono.receiptUrl || null);
          if (updated) {
            order = updated;
            try {
              await sendPaidOrderEmail({ order: updated, baseUrl: getAppBaseUrl(req) });
            } catch (mailErr) {
              console.error("[order-get] email error:", mailErr);
            }
          }
        } else if (mono.status && mono.status !== order.monoStatus) {
          setOrderMonoInvoice(
            order.id,
            order.monoInvoiceId,
            order.monoPaymentUrl || "",
            mono.status
          );
          order = { ...order, monoStatus: mono.status };
        }
      } catch (monoErr) {
        console.warn("[order-get] mono status check skipped:", monoErr);
      }
    }

    const queryToken = req.nextUrl.searchParams.get("token") || "";
    const { sessionId } = await getOrCreateSessionId();
    const verifiedEmail = await getVerifiedEmailFromCookie();

    const isAdmin = await isAdminAuthenticated();

    const canDownload =
      order.status === "paid" &&
      (isAdmin ||
        queryToken === order.accessToken ||
        sessionId === order.sessionId ||
        (Boolean(verifiedEmail) &&
          Boolean(order.customerEmail) &&
          verifiedEmail === order.customerEmail?.toLowerCase()));

    let safeResult: Record<string, unknown> | null = null;
    if (order.result) {
      if (order.productType === "storybook") {
        const sr = order.result as StorybookResult;
        safeResult = {
          generationStage: sr.generationStage || "complete",
          title: sr.title,
          subtitle: sr.subtitle,
          dedication: sr.dedication,
          modeUsed: sr.modeUsed,
          writerNotes: sr.writerNotes,
          coverPreviewUrl: `/api/orders/${order.id}/preview-asset?file=${encodeURIComponent(sr.coverPreviewFile)}`,
          previewPdfUrl: `/api/orders/${order.id}/preview-asset?file=${encodeURIComponent(sr.previewPdfFile)}`,
          pages: sr.pages.map((p) => ({
            pageNumber: p.pageNumber,
            heading: p.heading,
            text: p.text,
            textZone: p.textZone,
            imageRevision: p.imageRevision || 1,
            previewImageUrl: p.previewImageFile
              ? `/api/orders/${order.id}/preview-asset?file=${encodeURIComponent(p.previewImageFile)}`
              : null,
          })),
        };
      } else {
        const vr = order.result as VideoResult;
        safeResult = {
          scriptLines: vr.scriptLines,
          modeUsed: vr.modeUsed,
          previewVideoUrl: `/api/orders/${order.id}/preview-asset?file=${encodeURIComponent(vr.previewVideoFile)}`,
        };
      }
    }

    return NextResponse.json({
      id: order.id,
      productType: order.productType,
      lang: order.lang,
      status: order.status,
      progressStep: order.progressStep,
      progressLabel: getProgressLabel(order.progressStep, order.lang),
      progressPercent: order.progressPercent,
      errorMessage: order.errorMessage,
      payload: order.payload,
      result: safeResult,
      aiEditsUsed: order.aiEditsUsed,
      aiEditsLimit: order.aiEditsLimit,
      priceKopiykas: order.priceKopiykas,
      monoStatus: order.monoStatus,
      receiptUrl: order.receiptUrl,
      customerEmail: order.customerEmail || verifiedEmail || null,
      expiresAt: order.expiresAt,
      isExpired: Boolean(order.expiresAt && new Date(order.expiresAt).getTime() < Date.now()),
      isSandboxPayment: isMonoSandboxMode(),
      telegramBotEnabled: Boolean(getTelegramBotUsername()),
      downloadUrl: canDownload
        ? `/api/orders/${order.id}/download?token=${encodeURIComponent(order.accessToken)}`
        : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed loading order";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
