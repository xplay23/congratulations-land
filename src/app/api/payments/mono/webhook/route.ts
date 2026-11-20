import { NextRequest, NextResponse } from "next/server";
import { getOrderByInvoiceId, markOrderPaid, setOrderMonoInvoice } from "@/lib/db";
import { sendPaidOrderEmail } from "@/lib/email/mailer";
import { verifyMonoWebhookSignature } from "@/lib/payments/mono";
import { triggerStorybookFinalization } from "@/lib/storybook/pipeline";
import type { StorybookResult } from "@/lib/types";
import { getAppBaseUrl } from "@/lib/url";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const xSign = req.headers.get("x-sign");

    const valid = await verifyMonoWebhookSignature(rawBody, xSign);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as {
      invoiceId: string;
      status: string;
      reference?: string;
      receiptUrl?: string;
    };

    const order = getOrderByInvoiceId(event.invoiceId);
    if (!order) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const origin = getAppBaseUrl(req);
    const sr = order.result as StorybookResult | null;
    const needsStage2 =
      order.productType === "storybook" && sr?.generationStage !== "complete";

    if (event.status === "hold" || (event.status === "success" && needsStage2)) {
      triggerStorybookFinalization(
        order.id,
        origin,
        event.status,
        event.receiptUrl || null
      );
      return NextResponse.json({ ok: true, finalizing: true });
    }

    if (event.status === "success") {
      if (order.status !== "paid") {
        const updated = markOrderPaid(order.id, "success", event.receiptUrl || null);
        if (updated) {
          try {
            await sendPaidOrderEmail({ order: updated, baseUrl: origin });
          } catch (mailErr) {
            console.error("[mono-webhook] email error:", mailErr);
          }
        }
      }
    } else {
      setOrderMonoInvoice(
        order.id,
        event.invoiceId,
        order.monoPaymentUrl || "",
        event.status
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
