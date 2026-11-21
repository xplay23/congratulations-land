import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { synthesizeElevenLabsBuffer } from "@/lib/video/elevenlabs";
import { probeMediaFile } from "@/lib/video/ffprobe";
import { buildTemplateVars, interpolateVideoText } from "@/lib/video/template-vars";
import type { Lang } from "@/lib/types";

interface TtsPreviewBody {
  lang?: Lang;
  templateText?: string;
  sampleFields?: Record<string, string>;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as TtsPreviewBody;
    const lang: Lang = body.lang === "ru" ? "ru" : "uk";
    const templateText = String(body.templateText || "").trim();
    if (!templateText) {
      return NextResponse.json({ error: "templateText is required" }, { status: 400 });
    }

    const vars = buildTemplateVars({
      lang,
      fields: body.sampleFields || {},
    });
    const renderedText = interpolateVideoText(templateText, vars);
    if (!renderedText) {
      return NextResponse.json(
        { error: "Rendered text is empty after variable substitution" },
        { status: 400 }
      );
    }

    const tts = await synthesizeElevenLabsBuffer({
      text: renderedText,
      languageCode: lang,
      voiceId: body.voiceId,
      modelId: body.modelId,
      stability: body.stability,
      similarityBoost: body.similarityBoost,
    });

    const tmpFile = path.join(
      os.tmpdir(),
      `tts_prev_${crypto.randomBytes(6).toString("hex")}.mp3`
    );
    let durationSec = 0;
    try {
      fs.writeFileSync(tmpFile, tts.buffer);
      const probed = await probeMediaFile(tmpFile);
      durationSec = probed.durationSec ?? 0;
    } finally {
      try {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      } catch {
        // ignore
      }
    }

    return new NextResponse(new Uint8Array(tts.buffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(tts.buffer.length),
        "X-Audio-Duration-Sec": String(durationSec),
        "X-Rendered-Text": encodeURIComponent(renderedText),
        "X-Voice-Id": tts.voiceIdUsed,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "TTS preview failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
