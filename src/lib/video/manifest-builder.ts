import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getPayload } from "@engine/lib/payload";
import { PIPELINE_ASSETS_DIR } from "@engine/collections/PipelineAssets";
import {
  parseTimelineConfig,
  type AssembleManifest,
  type AssembleManifestOverlay,
  type AssembleManifestShot,
  type AssembleManifestVoiceLine,
  type VideoTimelineConfig,
} from "./template-schema";
import { buildTemplateVars, interpolateVideoText } from "./template-vars";
import type { Lang } from "@/lib/types";

const execFileAsync = promisify(execFile);

export interface VideoTemplateDoc {
  id: number | string;
  title: string;
  slug: string;
  enabled?: boolean;
  elevenLabsVoiceId?: string | null;
  elevenLabsModelId?: string | null;
  stability?: number | null;
  similarityBoost?: number | null;
  bgmAsset?: number | string | { id: number | string; filename?: string } | null;
  bgmVolume?: number | null;
  duckingPreset?: "gentle" | "standard" | "strong" | null;
  ambientMode?: "none" | "asset" | "extract_from_shot" | null;
  ambientAsset?: number | string | { id: number | string; filename?: string } | null;
  ambientSourceShotKey?: string | null;
  ambientExtractStart?: number | null;
  ambientExtractEnd?: number | null;
  ambientStartShotKey?: string | null;
  ambientVolume?: number | null;
  outputWidth?: number | null;
  outputHeight?: number | null;
  fps?: number | null;
  endFadeColor?: string | null;
  endFadeDuration?: number | null;
  cardBadge?: string | null;
  cardTitle?: string | null;
  cardDescription?: string | null;
  cardPreviewImage?: unknown;
  cardPreviewFallbackUrl?: string | null;
  parentAdviceTitle?: string | null;
  parentAdviceText?: string | null;
  formFields?: unknown[];
  timelineConfig?: unknown;
}

export interface AssembleRunResult {
  out: string;
  durationSec: number;
  sizeBytes: number;
  buildSec: number;
  shotStarts: Record<string, number>;
  warnings: string[];
}

export function getAssembleVideoScriptPath(): string {
  return path.resolve(process.cwd(), "video-pipeline", "scripts", "assemble_video.py");
}

export function getDefaultDemoPhotoPath(): string {
  return path.resolve(process.cwd(), "public", "samples", "nicholas_preview.jpg");
}

export function getFallbackFontPath(): string {
  return path.resolve(process.cwd(), "assets", "fonts", "georgiai.ttf");
}

export async function getVideoTemplateById(
  id: number | string,
  locale: Lang = "uk"
): Promise<VideoTemplateDoc | null> {
  const payload = await getPayload();
  try {
    const doc = await payload.findByID({
      collection: "video-templates" as never,
      id,
      locale,
      depth: 1,
      overrideAccess: true,
    });
    return (doc as unknown as VideoTemplateDoc) ?? null;
  } catch {
    return null;
  }
}

export async function getVideoTemplateBySlug(
  slug: string,
  locale: Lang = "uk"
): Promise<VideoTemplateDoc | null> {
  const payload = await getPayload();
  const res = await payload.find({
    collection: "video-templates" as never,
    where: { slug: { equals: slug } },
    locale,
    depth: 1,
    limit: 1,
    overrideAccess: true,
  });
  return (res.docs[0] as unknown as VideoTemplateDoc) ?? null;
}

async function resolveAssetMap(
  assetIds: Array<number | string>
): Promise<Map<number, { filename: string; filePath: string; durationSec?: number }>> {
  const uniqueIds = Array.from(
    new Set(
      assetIds
        .map((id) => Number(id))
        .filter((n) => Number.isInteger(n) && n > 0)
    )
  );
  const map = new Map<number, { filename: string; filePath: string; durationSec?: number }>();
  if (uniqueIds.length === 0) return map;

  const payload = await getPayload();
  const res = await payload.find({
    collection: "pipeline-assets" as never,
    where: { id: { in: uniqueIds } },
    limit: Math.max(100, uniqueIds.length),
    depth: 0,
    overrideAccess: true,
  });

  for (const raw of res.docs) {
    const doc = raw as unknown as {
      id: number | string;
      filename?: string;
      durationSec?: number;
    };
    if (!doc.filename) continue;
    const idNum = Number(doc.id);
    map.set(idNum, {
      filename: doc.filename,
      filePath: path.join(PIPELINE_ASSETS_DIR, doc.filename),
      durationSec: typeof doc.durationSec === "number" ? doc.durationSec : undefined,
    });
  }
  return map;
}

function extractId(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const raw =
    typeof val === "object" && val !== null && "id" in val
      ? (val as { id: unknown }).id
      : val;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export interface BuildManifestOptions {
  template: VideoTemplateDoc;
  timelineOverride?: VideoTimelineConfig;
  lang: Lang;
  tag: string;
  fields: Record<string, string>;
  /** Resolved local file paths keyed by photoUploadField.fieldKey (e.g. { photo: "/path/to/upl.png" }) */
  uploadPaths: Record<string, string>;
  /** Resolved local .mp3 paths for dynamic voice lines keyed by voiceLine.id */
  dynamicAudioByLineId: Record<string, string>;
  onlyShot?: string;
}

export async function buildAssembleManifestFromTemplate(
  opts: BuildManifestOptions
): Promise<{
  manifest: AssembleManifest;
  resolvedScriptLines: Record<string, string>;
  personalizedScriptLines: Record<string, string>;
}> {
  const { template, lang, tag, fields, uploadPaths, dynamicAudioByLineId, onlyShot } = opts;
  const timeline = opts.timelineOverride
    ? parseTimelineConfig(opts.timelineOverride)
    : parseTimelineConfig(template.timelineConfig);

  const vars = buildTemplateVars({ lang, fields });

  // Collect all asset IDs referenced across template + timeline
  const neededIds: number[] = [];
  const bgmId = extractId(template.bgmAsset);
  const ambId = extractId(template.ambientAsset);
  if (bgmId) neededIds.push(bgmId);
  if (ambId) neededIds.push(ambId);

  for (const shot of timeline.shots) {
    const vid = extractId(shot.videoAssetId);
    if (vid) neededIds.push(vid);
    for (const vl of shot.voiceLines[lang] || []) {
      const aid = extractId(vl.audioAssetId);
      if (aid) neededIds.push(aid);
    }
  }

  const assetMap = await resolveAssetMap(neededIds);
  const resolvedScriptLines: Record<string, string> = {};
  const personalizedScriptLines: Record<string, string> = {};
  const manifestShots: AssembleManifestShot[] = [];

  for (const shot of timeline.shots) {
    if (onlyShot && shot.key !== onlyShot && shot.id !== onlyShot) {
      continue;
    }

    const vidId = extractId(shot.videoAssetId);
    const vidAsset = vidId ? assetMap.get(vidId) : undefined;
    if (!vidAsset || !fs.existsSync(vidAsset.filePath)) {
      throw new Error(
        `Shot "${shot.key}" video asset (${vidId ?? "none"}) is missing on disk`
      );
    }

    const manifestVoices: AssembleManifestVoiceLine[] = [];
    for (const vl of shot.voiceLines[lang] || []) {
      const renderedText = interpolateVideoText(vl.text || "", vars);
      resolvedScriptLines[vl.id] = renderedText;
      if (vl.mode === "dynamic" && renderedText) {
        personalizedScriptLines[vl.id] = renderedText;
      }

      let audioPath: string | undefined;
      if (vl.mode === "dynamic" && dynamicAudioByLineId[vl.id]) {
        audioPath = dynamicAudioByLineId[vl.id];
      } else {
        const aid = extractId(vl.audioAssetId);
        const aAsset = aid ? assetMap.get(aid) : undefined;
        if (aAsset && fs.existsSync(aAsset.filePath)) {
          audioPath = aAsset.filePath;
        }
      }

      if (!audioPath) {
        if (vl.mode === "dynamic") {
          throw new Error(
            `Dynamic voice line "${vl.id}" in shot "${shot.key}" has no synthesized audio or fallback asset`
          );
        }
        continue;
      }

      manifestVoices.push({
        id: vl.id,
        audioPath,
        offsetSec: vl.offsetSec,
        trimStart: vl.trimStart,
        trimEnd: vl.trimEnd,
        trimSilenceEnd: vl.trimSilenceEnd,
        audioSegments: vl.audioSegments,
        atempo: vl.atempo,
        autoFitMaxTempo: vl.autoFitMaxTempo,
        autoFitTargetSec: vl.autoFitTargetSec,
        volume: vl.volume,
      });
    }

    const manifestOverlays: AssembleManifestOverlay[] = [];
    for (const ov of shot.overlays || []) {
      const photoPath =
        uploadPaths[ov.photoFieldKey] ||
        uploadPaths.photo ||
        getDefaultDemoPhotoPath();
      if (!fs.existsSync(photoPath)) {
        throw new Error(
          `Overlay "${ov.id}" photo file not found for field "${ov.photoFieldKey}"`
        );
      }

      const captionText = ov.captionFieldKey
        ? vars[ov.captionFieldKey] || vars.childName || ""
        : "";

      manifestOverlays.push({
        id: ov.id,
        type: ov.type,
        photoPath,
        captionText,
        cx: ov.cx,
        cy: ov.cy,
        width: ov.width,
        height: ov.height,
        borderRadius: ov.borderRadius,
        rotation: ov.rotation ?? 0,
        framePreset: ov.framePreset,
        warmTint: ov.warmTint,
        fadeInStart: ov.fadeInStart,
        fadeInDuration: ov.fadeInDuration,
        caption: ov.caption,
      });
    }

    manifestShots.push({
      id: shot.id,
      key: shot.key,
      videoPath: vidAsset.filePath,
      trimStart: shot.trimStart,
      durationMode: shot.durationMode,
      fixedDuration: shot.fixedDuration,
      fitToSpeech: shot.fitToSpeech,
      keepClipAudioVolume: shot.keepClipAudioVolume,
      fadeIn: shot.fadeIn,
      fadeOut: shot.fadeOut,
      speedSegments: shot.speedSegments,
      transitionIn: shot.transitionIn,
      overlays: manifestOverlays,
      voiceLines: manifestVoices,
    });
  }

  const bgmAsset = bgmId ? assetMap.get(bgmId) : undefined;
  const ambAsset = ambId ? assetMap.get(ambId) : undefined;

  const manifest: AssembleManifest = {
    version: 1,
    tag,
    lang,
    output: {
      width: template.outputWidth || 1280,
      height: template.outputHeight || 720,
      fps: template.fps || 24,
      endFadeColor: template.endFadeColor || "#2a1a08",
      endFadeDuration: template.endFadeDuration ?? 0.45,
    },
    audio: {
      bgmPath: bgmAsset && fs.existsSync(bgmAsset.filePath) ? bgmAsset.filePath : undefined,
      bgmVolume: template.bgmVolume ?? 0.38,
      ambientMode: template.ambientMode || "none",
      ambientPath: ambAsset && fs.existsSync(ambAsset.filePath) ? ambAsset.filePath : undefined,
      ambientSourceShotKey: template.ambientSourceShotKey || undefined,
      ambientExtractStart: template.ambientExtractStart ?? 0.2,
      ambientExtractEnd: template.ambientExtractEnd ?? 9.5,
      ambientStartShotKey: template.ambientStartShotKey || undefined,
      ambientVolume: template.ambientVolume ?? 0.2,
      duckingPreset: template.duckingPreset || "standard",
    },
    fontFallbackPath: getFallbackFontPath(),
    shots: manifestShots,
  };

  return { manifest, resolvedScriptLines, personalizedScriptLines };
}

export async function runAssembleVideoScript(opts: {
  manifest: AssembleManifest;
  manifestPath: string;
  outPath: string;
  onlyShot?: string;
  keepWork?: boolean;
}): Promise<AssembleRunResult> {
  const scriptPath = getAssembleVideoScriptPath();
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Universal assembly script not found at ${scriptPath}`);
  }

  fs.mkdirSync(path.dirname(opts.manifestPath), { recursive: true });
  fs.mkdirSync(path.dirname(opts.outPath), { recursive: true });
  fs.writeFileSync(opts.manifestPath, JSON.stringify(opts.manifest, null, 2), "utf-8");

  const args = [
    scriptPath,
    "--manifest",
    opts.manifestPath,
    "--out",
    opts.outPath,
  ];
  if (opts.onlyShot) {
    args.push("--only-shot", opts.onlyShot);
  }
  if (opts.keepWork) {
    args.push("--keep-work");
  }

  const { stdout } = await execFileAsync("python", args, {
    cwd: process.cwd(),
    timeout: 240_000,
    maxBuffer: 10 * 1024 * 1024,
  });

  const line = stdout
    .split(/\r?\n/)
    .reverse()
    .find((l) => l.startsWith("MANIFEST_RESULT "));
  if (line) {
    const jsonStr = line.slice("MANIFEST_RESULT ".length).trim();
    return JSON.parse(jsonStr) as AssembleRunResult;
  }

  const stat = fs.statSync(opts.outPath);
  return {
    out: opts.outPath,
    durationSec: 0,
    sizeBytes: stat.size,
    buildSec: 0,
    shotStarts: {},
    warnings: [],
  };
}
