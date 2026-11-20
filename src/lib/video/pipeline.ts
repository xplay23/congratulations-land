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

function buildVideoScriptLines(
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

const FALLBACK_PREMADE_VOICE_ID = "pqHfZKP75CvOlQylNhV4"; // Bill - Wise, Mature, Balanced (premade)

async function callElevenLabsTts(
  apiKey: string,
  voiceId: string,
  modelId: string,
  text: string,
  stability = 0.5,
  similarityBoost = 0.78
): Promise<Response> {
  return fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      }),
    }
  );
}

async function synthesizeElevenLabsMp3(
  text: string,
  outPath: string,
  cmsConfig?: CmsAiRuntimeConfig
): Promise<void> {
  const cfg = cmsConfig || (await getCmsAiConfig());
  const apiKey = cfg.elevenLabsApiKey?.trim();
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }
  const voiceId = cfg.elevenLabsVoiceId?.trim() || "NOpBlnGInO9m6vDvFkFC";
  const modelId = cfg.elevenLabsModelId?.trim() || "eleven_v4";
  const stability = cfg.elevenLabsStability ?? 0.5;
  const similarityBoost = cfg.elevenLabsSimilarityBoost ?? 0.78;

  let res = await callElevenLabsTts(
    apiKey,
    voiceId,
    modelId,
    text,
    stability,
    similarityBoost
  );
  if (res.status === 402 && voiceId !== FALLBACK_PREMADE_VOICE_ID) {
    console.warn(
      `[elevenlabs] Voice ${voiceId} requires paid plan (402); falling back to premade voice ${FALLBACK_PREMADE_VOICE_ID}`
    );
    res = await callElevenLabsTts(
      apiKey,
      FALLBACK_PREMADE_VOICE_ID,
      modelId,
      text,
      stability,
      similarityBoost
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${errText.slice(0, 200)}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

async function createWatermarkedPreviewVideo(
  cleanMp4Path: string,
  previewMp4Path: string,
  lang: VideoOrderPayload["lang"]
): Promise<void> {
  const watermarkText = lang === "uk" ? "VIDEOVITANNYA PREVIEW" : "VIDEOVITANNYA PREVIEW";
  // Escaping ':' and quotes for ffmpeg drawtext filter
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

export async function runVideoPipeline(
  orderId: string,
  payload: VideoOrderPayload
): Promise<void> {
  const costTracker = new AiCostTracker();
  try {
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

    const baseCmsConfig = await getCmsAiConfig();
    const variation = payload.variationSlug
      ? await getCmsVariationBySlug(payload.variationSlug)
      : undefined;

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

    const lines = buildVideoScriptLines(payload, cmsConfig.prompts);
    const audioDir = path.join(base, "custom_audio");
    fs.mkdirSync(audioDir, { recursive: true });

    updateOrderProgress(orderId, "video_tts", 20);

    const hasElevenLabs = Boolean(cmsConfig.elevenLabsApiKey?.trim());
    let modeUsed: VideoResult["modeUsed"] = "real_ffmpeg_demo_audio";

    const line03Filename = payload.lang === "ru" ? "line_03_v2.mp3" : "line_03.mp3";

    if (hasElevenLabs) {
      await synthesizeElevenLabsMp3(
        lines.line03,
        path.join(audioDir, line03Filename),
        cmsConfig
      );
      costTracker.addElevenLabsUsage("video_tts_line03", lines.line03.length);
      await synthesizeElevenLabsMp3(
        lines.line04b,
        path.join(audioDir, "line_04b.mp3"),
        cmsConfig
      );
      costTracker.addElevenLabsUsage("video_tts_line04b", lines.line04b.length);
      await synthesizeElevenLabsMp3(
        lines.line07_1,
        path.join(audioDir, "line_07_1.mp3"),
        cmsConfig
      );
      costTracker.addElevenLabsUsage("video_tts_line07_1", lines.line07_1.length);
      modeUsed = "real_ffmpeg_elevenlabs";
    } else {
      // Fallback to verified pre-synthesized pilot voice samples so FFmpeg/Pillow assembly still runs end-to-end
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

    updateOrderProgress(orderId, "video_render", 50);
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
    // Child photo is already baked into shot 04b of clean MP4 — delete original upload immediately
    deleteUploadFile(payload.photoUploadId);

    updateOrderProgress(orderId, "video_preview", 85);
    await createWatermarkedPreviewVideo(cleanVideoPath, previewVideoPath, payload.lang);

    const result: VideoResult = {
      scriptLines: lines,
      cleanVideoFile,
      previewVideoFile,
      modeUsed,
    };

    completeOrderGeneration(orderId, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Video assembly failed";
    console.error(`[video:${orderId}]`, err);
    failOrderGeneration(orderId, message);
  } finally {
    costTracker.flushToOrder(orderId);
    deleteUploadFile(payload.photoUploadId);
  }
}
