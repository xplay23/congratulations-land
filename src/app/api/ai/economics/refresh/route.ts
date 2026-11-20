import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "@engine/lib/payload";
import { refreshAiRatesFromRegistry } from "@/lib/ai-rates-sync";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const payload = await getPayload();
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await refreshAiRatesFromRegistry();
  return NextResponse.json(report, { status: report.ok ? 200 : 502 });
}
