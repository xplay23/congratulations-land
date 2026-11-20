import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "@engine/lib/payload";
import { getCmsAiConfig } from "@/lib/cms-ai-config";

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload();
    const { user } = await payload.auth({ headers: req.headers });
    if (!user) {
      return NextResponse.json(
        { enabled: false, imageEnabled: false, elevenLabsEnabled: false },
        { status: 401 }
      );
    }

    const cfg = await getCmsAiConfig();
    const enabled = Boolean(cfg.enabled && cfg.apiKey);
    const imageEnabled = Boolean(
      enabled && cfg.imageProvider && cfg.imageApiKey && cfg.imageModel
    );
    const elevenLabsEnabled = Boolean(cfg.elevenLabsApiKey);

    return NextResponse.json({
      enabled,
      imageEnabled,
      elevenLabsEnabled,
    });
  } catch (err) {
    console.error("[api/ai/status] error:", err);
    return NextResponse.json(
      { enabled: false, imageEnabled: false, elevenLabsEnabled: false },
      { status: 500 }
    );
  }
}
