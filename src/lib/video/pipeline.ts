import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  completeOrderGeneration,
  failOrderGeneration,
  updateOrderProgress,
} from "@/lib/db";
import { deleteUploadFile, getOrderDirs, resolveUploadPath } from "@/lib/storage";
import { AiCostTracker } from "@/lib/ai-cost";
import { getCmsAiConfig, type CmsAiRuntimeConfig } from "@/lib/cms-ai-config";
import { getCmsVariationBySlug } from "@/lib/cms-content";
import { synthesizeElevenLabsBuffer } from "@/lib/video/elevenlabs";
import {
  buildAssembleManifestFromTemplate,
  getVideoTemplateById,
  getVideoTemplateBySlug,
  runAssembleVideoScript,
  type VideoTemplateDoc,
} from "@/lib/video/manifest-builder";
import { parseTimelineConfig } from "@/lib/video/template-schema";
import { buildTemplateVars, interpolateVideoText } from "@/lib/video/template-vars";
import type { VideoOrderPayload, VideoResult } from "@/lib/types";

const execFileAsync = promisify(execFile);

function getPilotRoot(): string {
  return path.resolve(process.cwd(), "video-pipeline");
}

function applyVideoTemplate(
  template: string | undefined,
  fallback: string,
  vars: Record<string, string>
): string {
  if (!template || !template.trim()) return fallback;
  let out = template.trim();
  for (const [key, val] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, val);
  }
  return out;
}

function buildLegacyVideoScriptLines(
  payload: VideoOrderPayload,
  prompts?: Record<string, string>
) {
  const name = payload.childName.trim();
  const voc = payload.childNameVocative?.trim() || name;
  const ach = payload.achievement.trim();
  const age = payload.age.trim();

  if (payload.lang === "uk") {
    const agePrefix = age
      ? /^1\b/.test(age)
        ? `У свій ${age} ти`
        : `У свої ${age} ти`
      : "Цього року ти";
    const vars = { name, voc, ach, age, agePrefix };
    return {
      line03: applyVideoTemplate(
        prompts?.["video-line-03-uk"],
        `Вітаю тебе, ${voc}! Я так радий нарешті завітати до тебе особисто!`,
        vars
      ),
      line04b: applyVideoTemplate(
        prompts?.["video-line-04b-uk"],
        `${agePrefix} ${ach}…`,
        vars
      ),
      line07_1: applyVideoTemplate(
        prompts?.["video-line-07-uk"],
        `Щасливих свят, ${voc}!`,
        vars
      ),
    };
  }

  const agePrefix = age
    ? /^1\b/.test(age)
      ? `В свой ${age} ты`
      : `В свои ${age} ты`
    : "В этом году ты";
  const vars = { name, voc, ach, age, agePrefix };
  return {
    line03: applyVideoTemplate(
      prompts?.["video-line-03-ru"],
      `Здравствуй, ${voc}! Как же я рад заглянуть к тебе лично!`,
      vars
    ),
    line04b: applyVideoTemplate(
      prompts?.["video-line-04b-ru"],
      `${agePrefix} ${ach}…`,
      vars
    ),
    line07_1: applyVideoTemplate(
      prompts?.["video-line-07-ru"],
      `Счастливых праздников, ${voc}!`,
      vars
    ),
  };
}

async function createWatermarkedPreviewVideo(
  cleanMp4Path: string,
  previewMp4Path: string
): Promise<void> {
  const watermarkText = "VIDEOVITANNYA PREVIEW";
  const vf = [
    "scale=640:360",
    `drawtext=text='${watermarkText}':fontcolor=white@0.42:fontsize=34:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.22:boxborderw=10`,
  ].join(",");

  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    cleanMp4Path,
    "-vf",
    vf,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "28",
    "-c:a",
    "aac",
    "-b:a",
    "96k",
    "-movflags",
    "+faststart",
    previewMp4Path,
  ]);
}

function collectAllUploadIds(payload: VideoOrderPayload): string[] {
  const ids = new Set<string>();
  if (payload.photoUploadId) ids.add(payload.photoUploadId);
  if (payload.uploads) {
    for (const id of Object.values(payload.uploads)) {
      if (id) ids.add(id);
    }
  }
  return Array.from(ids);
}

function deleteAllOrderUploads(payload: VideoOrderPayload): void {
  for (const id of collectAllUploadIds(payload)) {
    deleteUploadFile(id);
  }
}

async function runTemplateVideoPipeline(opts: {
  orderId: string;
  payload: VideoOrderPayload;
  template: VideoTemplateDoc;
  voiceIdOverride?: string;
  baseCmsConfig: CmsAiRuntimeConfig;
  costTracker: AiCostTracker;
}): Promise<VideoResult> {
  const { orderId, payload, template, voiceIdOverride, baseCmsConfig, costTracker } = opts;
  const { clean, preview, base } = getOrderDirs(orderId);
  const timeline = parseTimelineConfig(template.timelineConfig);

  const fields: Record<string, string> = {
    gender: payload.gender,
    childName: payload.childName,
    ...(payload.childNameVocative
      ? { childNameVocative: payload.childNameVocative }
      : {}),
    age: payload.age,
    achievement: payload.achievement,
    ...(payload.fields || {}),
  };
  const vars = buildTemplateVars({ lang: payload.lang, fields });

  // Resolve all uploaded user photos (EXIF already stripped by /api/uploads)
  const uploadPaths: Record<string, string> = {};
  const uploadEntries: Array<[string, string]> = Object.entries(
    payload.uploads && Object.keys(payload.uploads).length > 0
      ? payload.uploads
      : payload.photoUploadId
      ? { photo: payload.photoUploadId }
      : {}
  );

  for (const [key, uploadId] of uploadEntries) {
    const resolved = resolveUploadPath(uploadId);
    if (!resolved) {
      throw new Error(`Uploaded photo for field "${key}" was not found or expired`);
    }
    uploadPaths[key] = resolved;
  }

  const audioDir = path.join(base, "custom_audio");
  fs.mkdirSync(audioDir, { recursive: true });

  await updateOrderProgress(orderId, "video_tts", 20);

  const hasElevenLabs = Boolean(baseCmsConfig.elevenLabsApiKey?.trim());
  const effectiveVoiceId =
    voiceIdOverride?.trim() ||
    template.elevenLabsVoiceId?.trim() ||
    baseCmsConfig.elevenLabsVoiceId;
  const effectiveModelId =
    template.elevenLabsModelId?.trim() || baseCmsConfig.elevenLabsModelId;
  const effectiveStability = template.stability ?? baseCmsConfig.elevenLabsStability;
  const effectiveSimilarity =
    template.similarityBoost ?? baseCmsConfig.elevenLabsSimilarityBoost;

  const dynamicAudioByLineId: Record<string, string> = {};
  let modeUsed: VideoResult["modeUsed"] = "real_ffmpeg_demo_audio";

  if (hasElevenLabs) {
    for (const shot of timeline.shots) {
      for (const vl of shot.voiceLines[payload.lang] || []) {
        if (vl.mode !== "dynamic") continue;
        const rendered = interpolateVideoText(vl.text || "", vars);
        if (!rendered) continue;
        const tts = await synthesizeElevenLabsBuffer({
          text: rendered,
          languageCode: payload.lang,
          voiceId: effectiveVoiceId,
          modelId: effectiveModelId,
          stability: effectiveStability,
          similarityBoost: effectiveSimilarity,
          cmsConfig: baseCmsConfig,
        });
        const mp3Path = path.join(audioDir, `dyn_${shot.key}_${vl.id}.mp3`);
        fs.writeFileSync(mp3Path, tts.buffer);
        dynamicAudioByLineId[vl.id] = mp3Path;
        costTracker.addElevenLabsUsage(
          `video_tts_${vl.id}`,
          tts.charCount,
          tts.modelIdUsed
        );
        modeUsed = "real_ffmpeg_elevenlabs";
      }
    }
  }

  await updateOrderProgress(orderId, "video_render", 50);

  const { manifest, resolvedScriptLines, personalizedScriptLines } =
    await buildAssembleManifestFromTemplate({
      template,
      timelineOverride: timeline,
      lang: payload.lang,
      tag: orderId,
      fields,
      uploadPaths,
      dynamicAudioByLineId,
    });

  const cleanVideoFile = "video_clean.mp4";
  const previewVideoFile = "video_preview.mp4";
  const cleanVideoPath = path.join(clean, cleanVideoFile);
  const previewVideoPath = path.join(preview, previewVideoFile);
  const manifestPath = path.join(base, "manifest.json");

  const runRes = await runAssembleVideoScript({
    manifest,
    manifestPath,
    outPath: cleanVideoPath,
  });

  // Delete ALL uploaded user photos immediately after baking into clean MP4
  deleteAllOrderUploads(payload);

  await updateOrderProgress(orderId, "video_preview", 85);
  await createWatermarkedPreviewVideo(cleanVideoPath, previewVideoPath);

  const scriptLinesOut =
    Object.keys(personalizedScriptLines).length > 0
      ? personalizedScriptLines
      : resolvedScriptLines;

  return {
    scriptLines: scriptLinesOut,
    cleanVideoFile,
    previewVideoFile,
    durationSeconds: runRes.durationSec || undefined,
    modeUsed,
  };
}

export async function runVideoPipeline(
  orderId: string,
  payload: VideoOrderPayload
): Promise<void> {
  const costTracker = new AiCostTracker();
  try {
    const baseCmsConfig = await getCmsAiConfig();
    const variation = payload.variationSlug
      ? await getCmsVariationBySlug(payload.variationSlug)
      : undefined;

    // 1. Prefer CMS VideoTemplate + universal assemble_video.py whenever linked
    let videoTemplate: VideoTemplateDoc | null = null;
    if (variation?.videoTemplateId) {
      videoTemplate = await getVideoTemplateById(variation.videoTemplateId, payload.lang);
    } else if (variation?.videoTemplateSlug) {
      videoTemplate = await getVideoTemplateBySlug(variation.videoTemplateSlug, payload.lang);
    } else if (payload.templateSlug) {
      videoTemplate = await getVideoTemplateBySlug(payload.templateSlug, payload.lang);
    }

    if (videoTemplate) {
      const result = await runTemplateVideoPipeline({
        orderId,
        payload,
        template: videoTemplate,
        voiceIdOverride: variation?.elevenLabsVoiceIdOverride,
        baseCmsConfig,
        costTracker,
      });
      await completeOrderGeneration(orderId, result);
      return;
    }

    // 2. Legacy fallback to assemble_pilot.py (kept for backward compatibility)
    const { clean, preview, base } = getOrderDirs(orderId);
    const pilotRoot = getPilotRoot();
    const assembleScript = path.join(pilotRoot, "scripts", "assemble_pilot.py");

    if (!fs.existsSync(assembleScript)) {
      throw new Error(`Pilot assembly script not found at ${assembleScript}`);
    }

    const photoPath = resolveUploadPath(payload.photoUploadId);
    if (!photoPath) {
      throw new Error("Uploaded child photo was not found or expired");
    }

    const effectivePrompts: Record<string, string> = {
      ...baseCmsConfig.prompts,
      ...(variation?.line03Uk ? { "video-line-03-uk": variation.line03Uk } : {}),
      ...(variation?.line03Ru ? { "video-line-03-ru": variation.line03Ru } : {}),
      ...(variation?.line04bUk ? { "video-line-04b-uk": variation.line04bUk } : {}),
      ...(variation?.line04bRu ? { "video-line-04b-ru": variation.line04bRu } : {}),
      ...(variation?.line07Uk ? { "video-line-07-uk": variation.line07Uk } : {}),
      ...(variation?.line07Ru ? { "video-line-07-ru": variation.line07Ru } : {}),
    };
    const cmsConfig: CmsAiRuntimeConfig = {
      ...baseCmsConfig,
      ...(variation?.elevenLabsVoiceIdOverride
        ? { elevenLabsVoiceId: variation.elevenLabsVoiceIdOverride }
        : {}),
      prompts: effectivePrompts,
    };

    const lines = buildLegacyVideoScriptLines(payload, cmsConfig.prompts);
    const audioDir = path.join(base, "custom_audio");
    fs.mkdirSync(audioDir, { recursive: true });

    await updateOrderProgress(orderId, "video_tts", 20);

    const hasElevenLabs = Boolean(cmsConfig.elevenLabsApiKey?.trim());
    let modeUsed: VideoResult["modeUsed"] = "real_ffmpeg_demo_audio";

    const line03Filename = payload.lang === "ru" ? "line_03_v2.mp3" : "line_03.mp3";

    if (hasElevenLabs) {
      for (const [step, text, fileName] of [
        ["video_tts_line03", lines.line03, line03Filename],
        ["video_tts_line04b", lines.line04b, "line_04b.mp3"],
        ["video_tts_line07_1", lines.line07_1, "line_07_1.mp3"],
      ] as const) {
        const tts = await synthesizeElevenLabsBuffer({
          text,
          languageCode: payload.lang,
          cmsConfig,
        });
        fs.writeFileSync(path.join(audioDir, fileName), tts.buffer);
        costTracker.addElevenLabsUsage(step, tts.charCount, tts.modelIdUsed);
      }
      modeUsed = "real_ffmpeg_elevenlabs";
    } else {
      const srcAudioDir =
        payload.lang === "uk"
          ? path.join(pilotRoot, "audio_ua")
          : path.join(pilotRoot, "audio");

      const copyAudio = (srcName: string, dstName: string) => {
        const src = path.join(srcAudioDir, srcName);
        if (!fs.existsSync(src)) {
          throw new Error(`Missing baseline pilot audio: ${src}`);
        }
        fs.copyFileSync(src, path.join(audioDir, dstName));
      };

      copyAudio(line03Filename, line03Filename);
      copyAudio("line_04b.mp3", "line_04b.mp3");
      copyAudio("line_07_1.mp3", "line_07_1.mp3");
    }

    await updateOrderProgress(orderId, "video_render", 50);
    const cleanVideoFile = "video_clean.mp4";
    const previewVideoFile = "video_preview.mp4";
    const cleanVideoPath = path.join(clean, cleanVideoFile);
    const previewVideoPath = path.join(preview, previewVideoFile);

    await execFileAsync(
      "python",
      [
        assembleScript,
        "--lang",
        payload.lang,
        "--tag",
        orderId,
        "--name",
        payload.childName.trim(),
        "--photo",
        photoPath,
        "--custom-audio",
        audioDir,
        "--out",
        cleanVideoPath,
      ],
      {
        cwd: process.cwd(),
        timeout: 180_000,
      }
    );
    deleteAllOrderUploads(payload);

    await updateOrderProgress(orderId, "video_preview", 85);
    await createWatermarkedPreviewVideo(cleanVideoPath, previewVideoPath);

    const result: VideoResult = {
      scriptLines: lines,
      cleanVideoFile,
      previewVideoFile,
      modeUsed,
    };

    await completeOrderGeneration(orderId, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Video assembly failed";
    console.error(`[video:${orderId}]`, err);
    await failOrderGeneration(orderId, message);
  } finally {
    await costTracker.flushToOrder(orderId).catch((e) => {
      console.error(`[video:${orderId}] cost flush error:`, e);
    });
    deleteAllOrderUploads(payload);
  }
}
