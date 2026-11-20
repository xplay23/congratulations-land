import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/db";
import { getOrCreateSessionId, getVerifiedEmailFromCookie } from "@/lib/session";
import { assertSafeId } from "@/lib/storage";
import { triggerStorybookFinalization } from "@/lib/storybook/pipeline";
import { getAppBaseUrl } from "@/lib/url";

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
    const order = getOrderById(assertSafeId(id));
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

    const hasPaidOrHeld = order.monoStatus === "hold" || order.monoStatus === "success";
    if (order.productType !== "storybook" || !hasPaidOrHeld || !order.result) {
      return NextResponse.json(
        { error: "Order is not eligible for post-payment finalization resume." },
        { status: 400 }
      );
    }

    if (order.status === "paid") {
      return NextResponse.json({ ok: true, status: "paid" });
    }

    const started = triggerStorybookFinalization(
      order.id,
      getAppBaseUrl(req),
      order.monoStatus || "hold",
      order.receiptUrl || null
    );

    return NextResponse.json({
      ok: true,
      status: started?.status || order.status,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed resuming generation";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
