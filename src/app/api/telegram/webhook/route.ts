import { NextRequest, NextResponse } from "next/server";
import { processTelegramUpdate, type TelegramUpdate } from "@/lib/telegram/bot";
import { getAppBaseUrl } from "@/lib/url";

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
    if (expectedSecret) {
      const provided = req.headers.get("x-telegram-bot-api-secret-token");
      if (provided !== expectedSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const update = (await req.json()) as TelegramUpdate;
    const origin = getAppBaseUrl(req);
    await processTelegramUpdate(update, origin);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram-webhook]", err);
    return NextResponse.json({ ok: true });
  }
}
