import { NextResponse } from "next/server";
import { cleanupExpiredOrders, getOrdersByEmail } from "@/lib/db";
import { clearVerifiedEmailCookie, getVerifiedEmailFromCookie } from "@/lib/session";
import type { StorybookResult } from "@/lib/types";

export async function GET() {
  cleanupExpiredOrders();
  const email = await getVerifiedEmailFromCookie();
  if (!email) {
    return NextResponse.json({ authenticated: false, email: null, orders: [] });
  }

  const orders = getOrdersByEmail(email).map((o) => {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(o.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
    const title =
      o.productType === "storybook"
        ? (o.result as StorybookResult | null)?.title ||
          (o.lang === "uk" ? "Персональна казка PDF" : "Персональная сказка PDF")
        : o.lang === "uk"
        ? "Відеопривітання від Святого Миколая"
        : "Видеопоздравление от Святого Николая";

    return {
      id: o.id,
      productType: o.productType,
      lang: o.lang,
      status: o.status,
      title,
      priceKopiykas: o.priceKopiykas,
      createdAt: o.createdAt,
      expiresAt: o.expiresAt,
      daysLeft,
      orderUrl: `/orders/${o.id}?token=${encodeURIComponent(o.accessToken)}`,
      downloadUrl:
        o.status === "paid"
          ? `/api/orders/${o.id}/download?token=${encodeURIComponent(o.accessToken)}`
          : null,
    };
  });

  return NextResponse.json({
    authenticated: true,
    email,
    orders,
  });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  return clearVerifiedEmailCookie(res);
}
