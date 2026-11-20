import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getOrderById, markOrderPaymentCancelled } from "@/lib/db";
import { cancelMonoInvoice } from "@/lib/payments/mono";
import { getOrCreateSessionId, getVerifiedEmailFromCookie } from "@/lib/session";
import { assertSafeId } from "@/lib/storage";

function tokensMatch(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const order = await getOrderById(assertSafeId(id));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const queryToken = req.nextUrl.searchParams.get("token") || "";
    const { sessionId } = await getOrCreateSessionId();
    const verifiedEmail = await getVerifiedEmailFromCookie();

    const authorized =
      tokensMatch(queryToken, order.accessToken) ||
      sessionId === order.sessionId ||
      (Boolean(verifiedEmail) &&
        Boolean(order.customerEmail) &&
        verifiedEmail === order.customerEmail?.toLowerCase());

    if (!authorized) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const isRefundable = order.monoStatus === "hold" || order.monoStatus === "success";
    if (!isRefundable || order.status !== "failed") {
      return NextResponse.json(
        { error: "Cancellation/refund is available only for failed held or paid orders." },
        { status: 400 }
      );
    }

    if (order.monoInvoiceId) {
      await cancelMonoInvoice(order.monoInvoiceId, `cancel_${order.id}`);
    }

    const updated = await markOrderPaymentCancelled(order.id, "reversed");
    return NextResponse.json({
      ok: true,
      status: updated?.status || "failed",
      monoStatus: updated?.monoStatus || "reversed",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed releasing payment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
