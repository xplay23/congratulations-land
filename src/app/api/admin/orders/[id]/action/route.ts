import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  getOrderById,
  markOrderPaid,
  markOrderPaymentCancelled,
  resetOrderForResume,
  setOrderMonoInvoice,
  updateOrderAiEditsLimit,
} from "@/lib/db";
import { sendPaidOrderEmail } from "@/lib/email/mailer";
import {
  cancelMonoInvoice,
  fetchMonoInvoiceStatus,
  isMonoSandboxMode,
} from "@/lib/payments/mono";
import { assertSafeId, resolveUploadPath } from "@/lib/storage";
import {
  isStorybookFinalizationActive,
  runStorybookPipeline,
  triggerStorybookFinalization,
} from "@/lib/storybook/pipeline";
import type { StorybookOrderPayload, StorybookResult } from "@/lib/types";
import { getAppBaseUrl } from "@/lib/url";

type AdminOrderAction =
  | "resume"
  | "refund"
  | "sync_mono"
  | "grant_ai_edit"
  | "resend_email";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    let order = await getOrderById(assertSafeId(id));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = (await req.json()) as { action?: AdminOrderAction };
    const action = body.action;
    const origin = getAppBaseUrl(req);

    if (action === "resume") {
      if (order.productType !== "storybook") {
        return NextResponse.json(
          { error: "Resume is supported for storybook orders." },
          { status: 400 }
        );
      }

      // Case A: Stage 1 failed before draft existed (no result yet)
      if (!order.result) {
        if (order.status !== "failed") {
          return NextResponse.json(
            { error: "Stage 1 is not in failed state." },
            { status: 400 }
          );
        }
        const payload = order.payload as StorybookOrderPayload;
        const missingChildPhoto =
          payload.photoUploadId && !resolveUploadPath(payload.photoUploadId);
        const missingCompanionPhoto =
          payload.companionPhotoUploadId &&
          !resolveUploadPath(payload.companionPhotoUploadId);

        if (missingChildPhoto || missingCompanionPhoto) {
          return NextResponse.json(
            {
              error:
                "Исходное фото уже удалено по правилам приватности; клиент должен создать новый заказ.",
            },
            { status: 409 }
          );
        }

        void runStorybookPipeline(order.id, payload);
        return NextResponse.json({
          ok: true,
          message: "Stage 1 pipeline restarted.",
        });
      }

      // Case B: Stage 2 post-payment finalization resume
      const hasPaidOrHeld =
        order.monoStatus === "hold" || order.monoStatus === "success";
      if (!hasPaidOrHeld) {
        return NextResponse.json(
          {
            error:
              "У заказа нет активного холда или оплаты Mono (monoStatus !== hold/success).",
          },
          { status: 400 }
        );
      }

      if (order.status === "paid") {
        return NextResponse.json({
          ok: true,
          message: "Order is already paid & finalized.",
        });
      }

      if (order.status === "generating") {
        if (isStorybookFinalizationActive(order.id)) {
          return NextResponse.json({
            ok: true,
            message: "Finalization worker is already running in memory.",
          });
        }
        // Stale generating state (e.g. after server restart) -> reset and reclaim
        const reset = await resetOrderForResume(order.id);
        if (reset) order = reset;
      }

      const started = await triggerStorybookFinalization(
        order.id,
        origin,
        order.monoStatus || "hold",
        order.receiptUrl || null
      );
      if (!started) {
        return NextResponse.json(
          { error: "Could not claim order for finalization." },
          { status: 409 }
        );
      }

      return NextResponse.json({
        ok: true,
        status: started.status,
        message: "Stage 2 finalization resumed.",
      });
    }

    if (action === "refund") {
      const refundable =
        order.monoStatus === "hold" || order.monoStatus === "success";
      if (!refundable) {
        return NextResponse.json(
          {
            error:
              "Возврат/снятие холда возможны только для заказов со статусом Mono 'hold' или 'success'.",
          },
          { status: 400 }
        );
      }

      if (order.monoInvoiceId) {
        await cancelMonoInvoice(order.monoInvoiceId, `admin_cancel_${order.id}`);
      }
      const updated = await markOrderPaymentCancelled(order.id, "reversed");
      return NextResponse.json({
        ok: true,
        status: updated?.status || "failed",
        monoStatus: updated?.monoStatus || "reversed",
        message: isMonoSandboxMode()
          ? "Sandbox payment marked as reversed."
          : "Plata by mono invoice cancelled/reversed.",
      });
    }

    if (action === "sync_mono") {
      if (!order.monoInvoiceId) {
        return NextResponse.json(
          { error: "У заказа ещё нет monoInvoiceId." },
          { status: 400 }
        );
      }
      if (isMonoSandboxMode() || order.monoInvoiceId.startsWith("sandbox_")) {
        return NextResponse.json({
          ok: true,
          monoStatus: order.monoStatus,
          message: "Sandbox order — live Mono check skipped.",
        });
      }

      const mono = await fetchMonoInvoiceStatus(order.monoInvoiceId);
      const sr = order.result as StorybookResult | null;
      const needsStage2 =
        order.productType === "storybook" && sr?.generationStage !== "complete";

      if (
        (mono.status === "hold" || (mono.status === "success" && needsStage2)) &&
        order.status !== "paid"
      ) {
        if (order.status === "generating" && !isStorybookFinalizationActive(order.id)) {
          await resetOrderForResume(order.id);
        }
        const started = await triggerStorybookFinalization(
          order.id,
          origin,
          mono.status,
          mono.receiptUrl || null
        );
        return NextResponse.json({
          ok: true,
          monoStatus: mono.status,
          finalizing: Boolean(started),
          message: started
            ? `Mono=${mono.status}: Stage 2 finalization triggered.`
            : `Mono=${mono.status} synced.`,
        });
      }

      if (mono.status === "success" && order.status !== "paid") {
        const updated = await markOrderPaid(order.id, "success", mono.receiptUrl || null);
        if (updated) {
          try {
            await sendPaidOrderEmail({ order: updated, baseUrl: origin });
          } catch (mailErr) {
            console.error("[admin-sync-mono] email error:", mailErr);
          }
        }
        return NextResponse.json({
          ok: true,
          monoStatus: "success",
          status: "paid",
          message: "Synced Mono=success and marked order paid.",
        });
      }

      await setOrderMonoInvoice(
        order.id,
        order.monoInvoiceId,
        order.monoPaymentUrl || "",
        mono.status
      );
      return NextResponse.json({
        ok: true,
        monoStatus: mono.status,
        message: `Mono status synced: ${mono.status}`,
      });
    }

    if (action === "grant_ai_edit") {
      const updated = await updateOrderAiEditsLimit(order.id, order.aiEditsLimit + 1);
      return NextResponse.json({
        ok: true,
        aiEditsLimit: updated?.aiEditsLimit ?? order.aiEditsLimit + 1,
        message: "Added +1 AI edit quota to order.",
      });
    }

    if (action === "resend_email") {
      if (order.status !== "paid" || !order.customerEmail) {
        return NextResponse.json(
          { error: "Повторная отправка письма доступна для оплаченных заказов с Email." },
          { status: 400 }
        );
      }
      const delivery = await sendPaidOrderEmail({ order, baseUrl: origin });
      return NextResponse.json({
        ok: true,
        delivery,
        message: `Email queued via ${delivery?.channel || "unknown"}.`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Admin order action failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
