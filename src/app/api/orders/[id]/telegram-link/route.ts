import { NextRequest, NextResponse } from "next/server";
import { createTelegramDeliveryToken, getOrderById } from "@/lib/db";
import { getOrCreateSessionId, getVerifiedEmailFromCookie } from "@/lib/session";
import { assertSafeId } from "@/lib/storage";
import { getTelegramBotUsername } from "@/lib/telegram/bot";

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
    if (order.status !== "paid") {
      return NextResponse.json({ error: "Order is not paid yet" }, { status: 402 });
    }

    const queryToken = req.nextUrl.searchParams.get("token") || "";
    const { sessionId } = await getOrCreateSessionId();
    const verifiedEmail = await getVerifiedEmailFromCookie();
    const authorized =
      queryToken === order.accessToken ||
      sessionId === order.sessionId ||
      (Boolean(verifiedEmail) &&
        Boolean(order.customerEmail) &&
        verifiedEmail === order.customerEmail?.toLowerCase());

    if (!authorized) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const botUsername = getTelegramBotUsername();
    const token = await createTelegramDeliveryToken(order.id);
    if (!botUsername) {
      return NextResponse.json({
        configured: false,
        token,
        message: "TELEGRAM_BOT_USERNAME is not configured in .env.local",
      });
    }

    return NextResponse.json({
      configured: true,
      url: `https://t.me/${botUsername}?start=${token}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Telegram link error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
