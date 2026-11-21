import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdminApi } from "@/lib/admin-auth";
import { getCmsOpenAIRuntime, withOpenAIRetry } from "@/lib/openai-client";
import {
  resolveMediumTranslationRule,
  resolveNegativeRules,
  type StorybookMediumPreset,
} from "@/lib/storybook/config-shared";

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as {
      stylePrompt?: string;
      mediumPreset?: StorybookMediumPreset;
      mediumRuleOverride?: string;
      negativeRulesOverride?: string;
      scenePrompt?: string;
      size?: "1024x1024" | "1536x1024" | "1024x1536";
    };

    const stylePrompt = String(body.stylePrompt || "").trim();
    const scenePrompt = String(body.scenePrompt || "").trim();
    if (!stylePrompt) {
      return NextResponse.json({ error: "stylePrompt is required" }, { status: 400 });
    }
    if (!scenePrompt) {
      return NextResponse.json({ error: "scenePrompt is required" }, { status: 400 });
    }

    const size: "1024x1024" | "1536x1024" | "1024x1536" =
      body.size === "1024x1024" || body.size === "1024x1536" ? body.size : "1536x1024";

    const { imageClient: client, config } = await getCmsOpenAIRuntime();
    if (!client) {
      return NextResponse.json(
        { error: "Image API key is not configured (check ИИ-сказки settings or .env.local)." },
        { status: 503 }
      );
    }

    const mediumRule = resolveMediumTranslationRule({
      mediumPreset: body.mediumPreset,
      mediumRuleOverride: body.mediumRuleOverride,
    });
    const antiRipple = resolveNegativeRules({
      mediumPreset: body.mediumPreset,
      negativeRulesOverride: body.negativeRulesOverride,
    });

    const finalPrompt = [
      `Style: ${stylePrompt}.`,
      mediumRule,
      `Scene: ${scenePrompt}`,
      `CRITICAL RULES: Single continuous seamless full-bleed children's book illustration only. ${antiRipple} NO book fold, NO central crease, NO split screens, NO collage panels, NO borders or frames, NO letters or text inside the image.`,
    ].join(" ");

    const started = Date.now();
    const model = config.storybookImageModel;
    const quality = config.storybookImageQuality;

    const res = await withOpenAIRetry("storybook_style_test", () =>
      client.images.generate({
        model,
        prompt: finalPrompt,
        size,
        quality,
      })
    );

    const item = res.data?.[0];
    let rawBuf: Buffer;
    if (item?.b64_json) {
      rawBuf = Buffer.from(item.b64_json, "base64");
    } else if (item?.url) {
      const imgRes = await fetch(item.url);
      if (!imgRes.ok) throw new Error(`Failed downloading test image: ${imgRes.status}`);
      rawBuf = Buffer.from(await imgRes.arrayBuffer());
    } else {
      throw new Error("Image model returned empty response");
    }

    const jpgBuf = await sharp(rawBuf)
      .jpeg({ quality: 90, chromaSubsampling: "4:4:4", mozjpeg: true })
      .toBuffer();

    const imageBase64 = jpgBuf.toString("base64");
    const elapsedSec = (Date.now() - started) / 1000;

    return NextResponse.json({
      imageDataUrl: `data:image/jpeg;base64,${imageBase64}`,
      imageBase64,
      finalPrompt,
      model,
      quality,
      size,
      elapsedSec,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Test image generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
