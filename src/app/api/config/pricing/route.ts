import { NextResponse } from "next/server";
import { getPricingConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const pricing = getPricingConfig();
  return NextResponse.json(pricing, {
    headers: { "Cache-Control": "no-store" },
  });
}
