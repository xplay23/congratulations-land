import { NextRequest, NextResponse } from "next/server";
import { getOrderById, setOrderCustomerEmail, setOrderMonoInvoice } from "@/lib/db";
import { createMonoInvoice } from "@/lib/payments/mono";
import { getVerifiedEmailFromCookie } from "@/lib/session";
import { assertSafeId } from "@/lib/storage";
import { getAppBaseUrl } from "@/lib/url";
import type { StorybookResult } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

    let bodyEmail = "";
    try {
      const body = (await req.json()) as { email?: string };
      bodyEmail = String(body.email || "").trim().toLowerCase();
    } catch {
      // Optional JSON body
    }

    const cookieEmail = await getVerifiedEmailFromCookie();
    const resolvedEmail = bodyEmail || order.customerEmail || cookieEmail || "";

    if (!EMAIL_RE.test(resolvedEmail)) {
      return NextResponse.json(
        {
          error:
            order.lang === "uk"
              ? "Вкажіть коректний Email для отримання подарунка та чеку."
              : "Укажите корректный Email для получения подарка и чека.",
        },
        { status: 400 }
      );
    }

    setOrderCustomerEmail(order.id, resolvedEmail);

    if (order.status === "paid") {
      return NextResponse.json({
        alreadyPaid: true,
        downloadUrl: `/api/orders/${order.id}/download?token=${encodeURIComponent(order.accessToken)}`,
      });
    }
    if (order.status !== "preview_ready") {
      return NextResponse.json(
        { error: "Preview is not ready for checkout yet." },
        { status: 400 }
      );
    }

    const origin = getAppBaseUrl(req);

    const productName =
      order.productType === "storybook"
        ? order.lang === "uk"
          ? "Персональна ілюстрована казка PDF (VideoVitannya)"
          : "Персональная иллюстрированная сказка PDF (VideoVitannya)"
        : order.lang === "uk"
        ? "Персональне HD відеопривітання (VideoVitannya)"
        : "Персональное HD видеопоздравление (VideoVitannya)";

    const sr = order.result as StorybookResult | null;
    const useHold =
      order.productType === "storybook" &&
      sr?.generationStage !== "complete";

    const invoice = await createMonoInvoice({
      orderId: order.id,
      amountKopiykas: order.priceKopiykas,
      productName,
      lang: order.lang,
      baseUrl: origin,
      paymentType: useHold ? "hold" : "debit",
    });

    setOrderMonoInvoice(order.id, invoice.invoiceId, invoice.pageUrl, "created");

    return NextResponse.json({
      invoiceId: invoice.invoiceId,
      pageUrl: invoice.pageUrl,
      sandbox: invoice.sandbox,
      email: resolvedEmail,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
