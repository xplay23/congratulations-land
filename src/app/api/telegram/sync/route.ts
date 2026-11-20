import { NextRequest, NextResponse } from "next/server";
import { syncPendingTelegramUpdates } from "@/lib/telegram/bot";
import { getAppBaseUrl } from "@/lib/url";

export async function POST(req: NextRequest) {
  try {
    const origin = getAppBaseUrl(req);
    const result = await syncPendingTelegramUpdates(origin);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Telegram sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
