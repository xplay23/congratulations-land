import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "@engine/lib/payload";

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

    const aiSettings = (await payload.findGlobal({
      slug: "ai-settings",
    })) as unknown as {
      enabled?: boolean | null;
      apiKey?: string | null;
      imageProvider?: string | null;
      imageApiKey?: string | null;
      imageModel?: string | null;
      elevenLabsApiKey?: string | null;
    };

    const hasTextKey = Boolean(
      aiSettings.apiKey?.trim() ||
        process.env.OPENAI_API_KEY?.trim() ||
        process.env.OPEN_AI_KEY?.trim()
    );
    const hasImageKey = Boolean(
      aiSettings.imageApiKey?.trim() ||
        aiSettings.apiKey?.trim() ||
        process.env.OPENAI_API_KEY?.trim()
    );
    const hasElevenLabs = Boolean(
      aiSettings.elevenLabsApiKey?.trim() ||
        process.env.ELEVENLABS_API_KEY?.trim()
    );

    const enabled = Boolean(aiSettings.enabled ?? true) && hasTextKey;
    const imageEnabled =
      enabled &&
      Boolean(aiSettings.imageProvider || "openai") &&
      hasImageKey &&
      Boolean(
        aiSettings.imageModel ||
          process.env.OPENAI_IMAGE_MODEL ||
          "gpt-image-2.5-sunburst-2026-09-08"
      );

    return NextResponse.json({
      enabled,
      imageEnabled,
      elevenLabsEnabled: hasElevenLabs,
    });
  } catch (err) {
    console.error("[api/ai/status] error:", err);
    return NextResponse.json(
      { enabled: false, imageEnabled: false, elevenLabsEnabled: false },
      { status: 500 }
    );
  }
}
