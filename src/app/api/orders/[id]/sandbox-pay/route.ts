import { NextRequest, NextResponse } from "next/server";
import { getOrderById, markOrderPaid, setOrderCustomerEmail } from "@/lib/db";
import { sendPaidOrderEmail } from "@/lib/email/mailer";
import { isMonoSandboxMode } from "@/lib/payments/mono";
import { assertSafeId } from "@/lib/storage";
import { triggerStorybookFinalization } from "@/lib/storybook/pipeline";
import type { StorybookResult } from "@/lib/types";
import { getAppBaseUrl } from "@/lib/url";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isMonoSandboxMode()) {
      return NextResponse.json(
        { error: "Sandbox payment endpoint is disabled in live mode." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const order = await getOrderById(assertSafeId(id));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    try {
      const body = (await req.json()) as { email?: string };
      if (body.email?.trim()) {
        await setOrderCustomerEmail(order.id, body.email.trim().toLowerCase());
      }
    } catch {
      // Optional JSON body
    }

    const origin = getAppBaseUrl(req);
    const demoReceiptUrl = `https://check.checkbox.ua/sandbox/${order.id}`;
    const sr = order.result as StorybookResult | null;

    if (order.productType === "storybook" && sr?.generationStage !== "complete") {
      const started = await triggerStorybookFinalization(order.id, origin, "hold", demoReceiptUrl);
      return NextResponse.json({
        ok: true,
        finalizing: true,
        status: started?.status || order.status,
      });
    }

    const updated = await markOrderPaid(order.id, "success", demoReceiptUrl);

    let emailDelivery: { channel: string; devFile?: string } | null = null;
    if (updated) {
      try {
        emailDelivery = await sendPaidOrderEmail({ order: updated, baseUrl: origin });
      } catch (mailErr) {
        console.error("[sandbox-pay] email error:", mailErr);
      }
    }

    return NextResponse.json({
      ok: true,
      finalizing: false,
      status: updated?.status,
      receiptUrl: updated?.receiptUrl,
      emailDelivery,
      downloadUrl: `/api/orders/${order.id}/download?token=${encodeURIComponent(
        updated?.accessToken || order.accessToken
      )}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sandbox pay failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
