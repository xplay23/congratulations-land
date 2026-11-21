import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "@engine/lib/payload";
import { requireAdminApi } from "@/lib/admin-auth";
import { synthesizeElevenLabsBuffer } from "@/lib/video/elevenlabs";
import { probeMediaFile } from "@/lib/video/ffprobe";
import { parseTimelineConfig } from "@/lib/video/template-schema";
import type { Lang } from "@/lib/types";

interface SingleTtsBody {
  mode?: "single" | "bulk";
  templateId?: number | string;
  lang?: Lang;
  lineId?: string;
  label?: string;
  text?: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  bulkLangs?: Lang[];
}

async function createVoicePipelineAsset(opts: {
  label: string;
  lang: Lang;
  buffer: Buffer;
  voiceIdUsed: string;
  modelIdUsed: string;
  text: string;
}) {
  const tmpFile = path.join(
    os.tmpdir(),
    `tts_${crypto.randomBytes(6).toString("hex")}.mp3`
  );
  let durationSec: number | undefined;
  try {
    fs.writeFileSync(tmpFile, opts.buffer);
    const probed = await probeMediaFile(tmpFile);
    durationSec = probed.durationSec;
  } finally {
    try {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    } catch {
      // ignore
    }
  }

  const safeSlug = opts.label
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
  const fileName = `${safeSlug || "voice"}_${Date.now()}.mp3`;

  const payload = await getPayload();
  const created = (await payload.create({
    collection: "pipeline-assets" as never,
    overrideAccess: true,
    context: { skipMediaProbe: true },
    data: {
      label: opts.label,
      assetKind: "voice_static",
      lang: opts.lang,
      durationSec,
      notes: `ElevenLabs (${opts.voiceIdUsed} / ${opts.modelIdUsed}): ${opts.text.slice(0, 180)}`,
    } as never,
    file: {
      data: opts.buffer,
      mimetype: "audio/mpeg",
      name: fileName,
      size: opts.buffer.length,
    },
  })) as unknown as { id: number | string; durationSec?: number; filename?: string };

  const assetId = Number(created.id);
  return {
    assetId,
    durationSec: durationSec ?? created.durationSec ?? 0,
    filename: created.filename || fileName,
    streamUrl: `/api/admin/pipeline-assets/${assetId}/stream`,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as SingleTtsBody;

    // ── Bulk mode: revoice all static voice lines in a saved VideoTemplate ──
    if (body.mode === "bulk") {
      if (!body.templateId) {
        return NextResponse.json(
          { error: "templateId is required for bulk revoice" },
          { status: 400 }
        );
      }

      const payload = await getPayload();
      const tpl = (await payload.findByID({
        collection: "video-templates" as never,
        id: body.templateId,
        overrideAccess: true,
      })) as unknown as {
        id: number | string;
        slug?: string;
        elevenLabsVoiceId?: string | null;
        elevenLabsModelId?: string | null;
        stability?: number | null;
        similarityBoost?: number | null;
        timelineConfig?: unknown;
      } | null;

      if (!tpl) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }

      const timeline = parseTimelineConfig(tpl.timelineConfig);
      const langs: Lang[] =
        Array.isArray(body.bulkLangs) && body.bulkLangs.length > 0
          ? body.bulkLangs
          : ["uk", "ru"];

      const results: Array<{
        shotKey: string;
        lang: Lang;
        lineId: string;
        assetId: number;
        durationSec: number;
      }> = [];

      for (const shot of timeline.shots) {
        for (const lang of langs) {
          for (const vl of shot.voiceLines[lang] || []) {
            if (vl.mode !== "static" || !vl.text.trim()) continue;
            const tts = await synthesizeElevenLabsBuffer({
              text: vl.text,
              languageCode: lang,
              voiceId: body.voiceId ?? tpl.elevenLabsVoiceId,
              modelId: body.modelId ?? tpl.elevenLabsModelId,
              stability: body.stability ?? tpl.stability,
              similarityBoost: body.similarityBoost ?? tpl.similarityBoost,
            });
            const saved = await createVoicePipelineAsset({
              label: `${tpl.slug || "tpl"}_${lang}_${vl.id}`,
              lang,
              buffer: tts.buffer,
              voiceIdUsed: tts.voiceIdUsed,
              modelIdUsed: tts.modelIdUsed,
              text: vl.text,
            });
            vl.audioAssetId = saved.assetId;
            vl.sampleDurationSec = saved.durationSec;
            // Clear manual trims/segments since audio waveform is brand new
            vl.trimStart = undefined;
            vl.trimEnd = undefined;
            vl.audioSegments = undefined;
            vl.trimSilenceEnd = true;

            results.push({
              shotKey: shot.key,
              lang,
              lineId: vl.id,
              assetId: saved.assetId,
              durationSec: saved.durationSec,
            });
          }
        }
      }

      await payload.update({
        collection: "video-templates" as never,
        id: tpl.id,
        overrideAccess: true,
        data: { timelineConfig: timeline } as never,
      });

      return NextResponse.json({
        ok: true,
        count: results.length,
        results,
        timelineConfig: timeline,
      });
    }

    // ── Single voice line synthesis ──
    const text = String(body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    const lang: Lang = body.lang === "ru" ? "ru" : "uk";

    const tts = await synthesizeElevenLabsBuffer({
      text,
      languageCode: lang,
      voiceId: body.voiceId,
      modelId: body.modelId,
      stability: body.stability,
      similarityBoost: body.similarityBoost,
    });

    const label =
      body.label?.trim() ||
      `tts_${lang}_${body.lineId?.trim() || "line"}`;

    const saved = await createVoicePipelineAsset({
      label,
      lang,
      buffer: tts.buffer,
      voiceIdUsed: tts.voiceIdUsed,
      modelIdUsed: tts.modelIdUsed,
      text,
    });

    return NextResponse.json({
      ok: true,
      ...saved,
      voiceIdUsed: tts.voiceIdUsed,
      modelIdUsed: tts.modelIdUsed,
      charCount: tts.charCount,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "TTS generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
