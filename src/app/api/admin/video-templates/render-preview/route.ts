import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { synthesizeElevenLabsBuffer } from "@/lib/video/elevenlabs";
import {
  buildAssembleManifestFromTemplate,
  getDefaultDemoPhotoPath,
  getVideoTemplateById,
  runAssembleVideoScript,
  type VideoTemplateDoc,
} from "@/lib/video/manifest-builder";
import {
  parseTimelineConfig,
  type VideoTimelineConfig,
} from "@/lib/video/template-schema";
import { buildTemplateVars, interpolateVideoText } from "@/lib/video/template-vars";
import { resolveUploadPath } from "@/lib/storage";
import type { Lang } from "@/lib/types";

const PREVIEW_DIR = path.resolve(
  process.cwd(),
  "storage",
  "temp_previews",
  "renders"
);

function cleanupOldPreviews() {
  try {
    if (!fs.existsSync(PREVIEW_DIR)) return;
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    for (const entry of fs.readdirSync(PREVIEW_DIR)) {
      const full = path.join(PREVIEW_DIR, entry);
      try {
        const st = fs.statSync(full);
        if (st.mtimeMs < cutoff) {
          fs.rmSync(full, { recursive: true, force: true });
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

interface RenderPreviewBody {
  templateId: number | string;
  lang?: Lang;
  mode?: "shot" | "full";
  shotKey?: string;
  timelineConfig?: VideoTimelineConfig;
  sampleFields?: Record<string, string>;
  synthesizeDynamic?: boolean;
  demoPhotoUploadId?: string;
  templateOverrides?: Partial<VideoTemplateDoc>;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as RenderPreviewBody;
    if (!body.templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    const lang: Lang = body.lang === "ru" ? "ru" : "uk";
    const mode = body.mode === "shot" ? "shot" : "full";
    if (mode === "shot" && !body.shotKey) {
      return NextResponse.json(
        { error: "shotKey is required when mode is 'shot'" },
        { status: 400 }
      );
    }

    const baseTemplate = await getVideoTemplateById(body.templateId, lang);
    if (!baseTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const effectiveTemplate: VideoTemplateDoc = {
      ...baseTemplate,
      ...(body.templateOverrides || {}),
    };

    const timeline = body.timelineConfig
      ? parseTimelineConfig(body.timelineConfig)
      : parseTimelineConfig(effectiveTemplate.timelineConfig);

    cleanupOldPreviews();
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });

    const jobId = `prv_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
    const jobDir = path.join(PREVIEW_DIR, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    const fields =
      body.sampleFields && Object.keys(body.sampleFields).length > 0
        ? body.sampleFields
        : timeline.samplePresets?.medium?.[lang] || {};
    const vars = buildTemplateVars({ lang, fields });

    // Optionally synthesize dynamic voice lines live via ElevenLabs; otherwise use fallback audioAssetId if present
    const dynamicAudioByLineId: Record<string, string> = {};
    if (body.synthesizeDynamic) {
      for (const shot of timeline.shots) {
        if (mode === "shot" && shot.key !== body.shotKey && shot.id !== body.shotKey) {
          continue;
        }
        for (const vl of shot.voiceLines[lang] || []) {
          if (vl.mode !== "dynamic") continue;
          const rendered = interpolateVideoText(vl.text || "", vars);
          if (!rendered) continue;
          const tts = await synthesizeElevenLabsBuffer({
            text: rendered,
            languageCode: lang,
            voiceId: effectiveTemplate.elevenLabsVoiceId,
            modelId: effectiveTemplate.elevenLabsModelId,
            stability: effectiveTemplate.stability,
            similarityBoost: effectiveTemplate.similarityBoost,
          });
          const mp3Path = path.join(jobDir, `dyn_${vl.id}.mp3`);
          fs.writeFileSync(mp3Path, tts.buffer);
          dynamicAudioByLineId[vl.id] = mp3Path;
        }
      }
    }

    const demoPhoto =
      (body.demoPhotoUploadId ? resolveUploadPath(body.demoPhotoUploadId) : null) ||
      getDefaultDemoPhotoPath();

    const { manifest, resolvedScriptLines } = await buildAssembleManifestFromTemplate({
      template: effectiveTemplate,
      timelineOverride: timeline,
      lang,
      tag: jobId,
      fields,
      uploadPaths: { photo: demoPhoto },
      dynamicAudioByLineId,
      onlyShot: mode === "shot" ? body.shotKey : undefined,
    });

    const outFilename = `${jobId}.mp4`;
    const outPath = path.join(PREVIEW_DIR, outFilename);
    const manifestPath = path.join(jobDir, "manifest.json");

    const runRes = await runAssembleVideoScript({
      manifest,
      manifestPath,
      outPath,
      onlyShot: mode === "shot" ? body.shotKey : undefined,
    });

    // Cleanup temp job manifest/audio dir (keep final mp4)
    fs.rmSync(jobDir, { recursive: true, force: true });

    return NextResponse.json({
      ok: true,
      file: outFilename,
      videoUrl: `/api/admin/video-templates/render-preview?file=${encodeURIComponent(outFilename)}`,
      durationSec: runRes.durationSec,
      sizeBytes: runRes.sizeBytes,
      buildSec: runRes.buildSec,
      shotStarts: runRes.shotStarts,
      warnings: runRes.warnings,
      resolvedScriptLines,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Preview render failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const file = req.nextUrl.searchParams.get("file")?.trim() || "";
  if (!/^prv_[a-z0-9_]+\.mp4$/i.test(file)) {
    return NextResponse.json({ error: "Invalid preview filename" }, { status: 400 });
  }

  const filePath = path.join(PREVIEW_DIR, file);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Preview not found or expired" }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const total = stat.size;
  const rangeHeader = req.headers.get("range");

  if (rangeHeader) {
    const m = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
      if (start >= total || start > end || Number.isNaN(start) || Number.isNaN(end)) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${total}` },
        });
      }
      const chunkSize = end - start + 1;
      const fd = fs.openSync(filePath, "r");
      const buf = Buffer.alloc(chunkSize);
      try {
        fs.readSync(fd, buf, 0, chunkSize, start);
      } finally {
        fs.closeSync(fd);
      }
      return new NextResponse(new Uint8Array(buf), {
        status: 206,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(chunkSize),
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-store",
        },
      });
    }
  }

  const buf = fs.readFileSync(filePath);
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(total),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}
