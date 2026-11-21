import { NextResponse } from "next/server";
import { getStorybookPublicConfig } from "@/lib/storybook/config";

export async function GET() {
  try {
    const config = await getStorybookPublicConfig();
    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed loading storybook config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
