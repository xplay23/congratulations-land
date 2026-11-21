import fs from "node:fs";
import path from "node:path";
import { getPayload } from "@engine/lib/payload";
import { VIDEO_PRAISE_OPTIONS } from "@/lib/i18n";
import { probeMediaFile } from "@/lib/video/ffprobe";
import type { VideoTimelineConfig } from "@/lib/video/template-schema";

const PILOT_ROOT = path.resolve(process.cwd(), "video-pipeline");
const VIDEOS_DIR = path.join(PILOT_ROOT, "videos");
const AUDIO_RU_DIR = path.join(PILOT_ROOT, "audio");
const AUDIO_UA_DIR = path.join(PILOT_ROOT, "audio_ua");

type AssetKind = "video" | "voice_static" | "bgm" | "ambient" | "image" | "font";
type AssetLang = "any" | "uk" | "ru";

async function ensurePipelineAsset(
  payload: Awaited<ReturnType<typeof getPayload>>,
  opts: {
    label: string;
    filePath: string;
    assetKind: AssetKind;
    lang: AssetLang;
    mimeType: string;
    notes?: string;
  }
): Promise<{ id: number; durationSec?: number }> {
  const existing = await payload.find({
    collection: "pipeline-assets" as never,
    where: { label: { equals: opts.label } },
    limit: 1,
    overrideAccess: true,
  });

  if (existing.docs.length > 0) {
    const doc = existing.docs[0] as unknown as {
      id: number | string;
      durationSec?: number;
    };
    return { id: Number(doc.id), durationSec: doc.durationSec };
  }

  if (!fs.existsSync(opts.filePath)) {
    throw new Error(`Missing source file for seed: ${opts.filePath}`);
  }

  const dataBuf = fs.readFileSync(opts.filePath);
  const probed = await probeMediaFile(opts.filePath);
  const ext = path.extname(opts.filePath);
  const baseName = `${opts.label.replace(/[^a-zA-Z0-9_-]+/g, "_").toLowerCase()}${ext}`;

  const created = await payload.create({
    collection: "pipeline-assets" as never,
    overrideAccess: true,
    context: { skipMediaProbe: true },
    data: {
      label: opts.label,
      assetKind: opts.assetKind,
      lang: opts.lang,
      durationSec: probed.durationSec,
      width: probed.width,
      height: probed.height,
      fps: probed.fps,
      notes: opts.notes || `Seeded from ${path.relative(process.cwd(), opts.filePath)}`,
    } as never,
    file: {
      data: dataBuf,
      mimetype: opts.mimeType,
      name: baseName,
      size: dataBuf.length,
    },
  });

  const cDoc = created as unknown as { id: number | string; durationSec?: number };
  console.log(
    `[seed-video] Created PipelineAsset #${cDoc.id}: ${opts.label} (${probed.durationSec ?? "?"}s)`
  );
  return { id: Number(cDoc.id), durationSec: probed.durationSec };
}

async function seedVideoTemplate() {
  console.log("[seed-video] Starting St. Nicholas VideoTemplate seed...");
  const payload = await getPayload();

  // 1. Seed 10 video clips
  const videoSpecs = [
    { key: "01", label: "st_nicholas_01_chalet", file: "Snow_falling_on_alpine_chalet_620ffea8.mp4" },
    { key: "02", label: "st_nicholas_02_study_entrance", file: "Elderly_man_reading_book_at_afc79866.mp4" },
    { key: "03", label: "st_nicholas_03_greeting", file: "Elderly_man_speaking_at_desk_f5436366.mp4" },
    { key: "04a", label: "st_nicholas_04a_book_reading", file: "Elderly_man_reading_antique_book_a98d7f22.mp4" },
    { key: "04b", label: "st_nicholas_04b_book_pov", file: "Man_reading_antique_book_88e0e6e6.mp4" },
    { key: "04c", label: "st_nicholas_04c_proud", file: "Elderly_man_speaking_in_study_e058903b.mp4" },
    { key: "05a", label: "st_nicholas_05a_gift_place", file: "Character_placing_gift_box_on_7aafa13c.mp4" },
    { key: "05b", label: "st_nicholas_05b_gift_speech", file: "Man_speaking_near_gift_box_533e503f.mp4" },
    { key: "06", label: "st_nicholas_06_gift_magic", file: "Elderly_man_touching_gift_box_b65df33e.mp4" },
    { key: "07", label: "st_nicholas_07_farewell", file: "Elderly_man_waving_holiday_farewell_1a684e39.mp4" },
  ] as const;

  const videoAssets: Record<string, { id: number; durationSec?: number }> = {};
  for (const v of videoSpecs) {
    videoAssets[v.key] = await ensurePipelineAsset(payload, {
      label: v.label,
      filePath: path.join(VIDEOS_DIR, v.file),
      assetKind: "video",
      lang: "any",
      mimeType: "video/mp4",
    });
  }

  // 2. Seed BGM
  const bgmAsset = await ensurePipelineAsset(payload, {
    label: "st_nicholas_bgm_suno",
    filePath: path.join(AUDIO_RU_DIR, "bgm_suno.mp3"),
    assetKind: "bgm",
    lang: "any",
    mimeType: "audio/mpeg",
  });

  // 3. Seed static + fallback dynamic voice lines (UA & RU)
  const audioUaSpecs = [
    { key: "01", label: "st_nicholas_ua_line_01", file: "line_01.mp3" },
    { key: "03", label: "st_nicholas_ua_line_03_demo", file: "line_03.mp3" },
    { key: "04a", label: "st_nicholas_ua_line_04a", file: "line_04a.mp3" },
    { key: "04b", label: "st_nicholas_ua_line_04b_demo", file: "line_04b.mp3" },
    { key: "04c", label: "st_nicholas_ua_line_04c", file: "line_04c.mp3" },
    { key: "05b_1", label: "st_nicholas_ua_line_05b_1", file: "line_05b_1.mp3" },
    { key: "05b_2", label: "st_nicholas_ua_line_05b_2", file: "line_05b_2.mp3" },
    { key: "07_1", label: "st_nicholas_ua_line_07_1_demo", file: "line_07_1.mp3" },
    { key: "07_2", label: "st_nicholas_ua_line_07_2", file: "line_07_2.mp3" },
  ] as const;

  const audioRuSpecs = [
    { key: "01", label: "st_nicholas_ru_line_01", file: "line_01.mp3" },
    { key: "03", label: "st_nicholas_ru_line_03_demo", file: "line_03_v2.mp3" },
    { key: "04a", label: "st_nicholas_ru_line_04a", file: "line_04a.mp3" },
    { key: "04b", label: "st_nicholas_ru_line_04b_demo", file: "line_04b.mp3" },
    { key: "04c", label: "st_nicholas_ru_line_04c", file: "line_04c.mp3" },
    { key: "05b_1", label: "st_nicholas_ru_line_05b_1", file: "line_05b_1_v2.mp3" },
    { key: "05b_2", label: "st_nicholas_ru_line_05b_2", file: "line_05b_2_v2.mp3" },
    { key: "07_1", label: "st_nicholas_ru_line_07_1_demo", file: "line_07_1.mp3" },
    { key: "07_2", label: "st_nicholas_ru_line_07_2", file: "line_07_2_v2.mp3" },
  ] as const;

  const uaAudio: Record<string, { id: number; durationSec?: number }> = {};
  for (const a of audioUaSpecs) {
    uaAudio[a.key] = await ensurePipelineAsset(payload, {
      label: a.label,
      filePath: path.join(AUDIO_UA_DIR, a.file),
      assetKind: "voice_static",
      lang: "uk",
      mimeType: "audio/mpeg",
    });
  }

  const ruAudio: Record<string, { id: number; durationSec?: number }> = {};
  for (const a of audioRuSpecs) {
    ruAudio[a.key] = await ensurePipelineAsset(payload, {
      label: a.label,
      filePath: path.join(AUDIO_RU_DIR, a.file),
      assetKind: "voice_static",
      lang: "ru",
      mimeType: "audio/mpeg",
    });
  }

  // 4. Build exact 1-to-1 timelineConfig matching assemble_pilot.py
  const timelineConfig: VideoTimelineConfig = {
    schemaVersion: 1,
    samplePresets: {
      short: {
        uk: {
          gender: "boy",
          childName: "Максим",
          childNameVocative: "Максиме",
          age: "4 роки",
          achievement: "навчився кататися на велосипеді",
        },
        ru: {
          gender: "boy",
          childName: "Миша",
          childNameVocative: "Миша",
          age: "4 года",
          achievement: "научился кататься на велосипеде",
        },
      },
      medium: {
        uk: {
          gender: "boy",
          childName: "Андрійко",
          childNameVocative: "Андрійку",
          age: "6 років",
          achievement: "пішов до школи та навчився читати книжки самостійно",
        },
        ru: {
          gender: "boy",
          childName: "Андрей",
          childNameVocative: "Андрюша",
          age: "6 лет",
          achievement: "пошёл в школу и научился читать книжки самостоятельно",
        },
      },
      max: {
        uk: {
          gender: "girl",
          childName: "Олександра",
          childNameVocative: "Олександро",
          age: "8 років",
          achievement:
            "старанно вчилася, допомагала мамі й татові та намалювала чудову виставку картин",
        },
        ru: {
          gender: "girl",
          childName: "Александра",
          childNameVocative: "Александра",
          age: "8 лет",
          achievement:
            "старательно училась, помогала маме и папе и нарисовала целую выставку картин",
        },
      },
    },
    shots: [
      {
        id: "shot_01",
        key: "01",
        label: "Внешний хук — зимний лес и резиденция",
        videoAssetId: videoAssets["01"].id,
        sourceDurationSec: videoAssets["01"].durationSec,
        trimStart: 0.0,
        durationMode: "fixed",
        fixedDuration: 3.65,
        keepClipAudioVolume: 0.0,
        fadeIn: { duration: 0.4 },
        voiceLines: {
          uk: [
            {
              id: "line_01",
              label: "Закадр — вход",
              mode: "static",
              offsetSec: 0.15,
              text: "У цю чарівну зимову ніч диво вже на порозі…",
              audioAssetId: uaAudio["01"].id,
              sampleDurationSec: 3.8,
              trimStart: 0.0,
              trimEnd: 3.8,
              trimSilenceEnd: false,
              atempo: 1.0,
              volume: 1.25,
            },
          ],
          ru: [
            {
              id: "line_01",
              label: "Закадр — вход",
              mode: "static",
              offsetSec: 0.15,
              text: "В эту волшебную зимнюю ночь чудо уже на пороге…",
              audioAssetId: ruAudio["01"].id,
              sampleDurationSec: 4.26,
              trimStart: 0.0,
              trimEnd: 4.26,
              trimSilenceEnd: false,
              atempo: 1.0,
              volume: 1.25,
            },
          ],
        },
      },
      {
        id: "shot_02",
        key: "02",
        label: "Вход в резиденцию и камин",
        videoAssetId: videoAssets["02"].id,
        sourceDurationSec: videoAssets["02"].durationSec,
        trimStart: 0.5,
        durationMode: "fixed",
        fixedDuration: 4.1,
        keepClipAudioVolume: 0.55,
        transitionIn: { type: "fade", duration: 0.55, spark: true },
        voiceLines: { uk: [], ru: [] },
      },
      {
        id: "shot_03",
        key: "03",
        label: "Личное приветствие по имени (lip-sync)",
        videoAssetId: videoAssets["03"].id,
        sourceDurationSec: videoAssets["03"].durationSec,
        trimStart: 0.65,
        durationMode: "fit_to_speech",
        fitToSpeech: {
          voiceLineId: "line_03",
          minDur: 2.2,
          maxDur: 7.25,
          padAfterSpeech: -0.14,
          overflowStrategy: "clamp",
        },
        keepClipAudioVolume: 0.0,
        transitionIn: { type: "fade", duration: 0.16, spark: false },
        voiceLines: {
          uk: [
            {
              id: "line_03",
              label: "Приветствие по имени",
              mode: "dynamic",
              offsetSec: 0.44,
              text: "Вітаю тебе, {voc}! Я так радий нарешті завітати до тебе особисто!",
              audioAssetId: uaAudio["03"].id,
              sampleDurationSec: uaAudio["03"].durationSec ?? 6.2,
              trimSilenceEnd: true,
              atempo: 1.08,
              autoFitMaxTempo: 1.16,
              autoFitTargetSec: 6.35,
              volume: 1.25,
            },
          ],
          ru: [
            {
              id: "line_03",
              label: "Приветствие по имени",
              mode: "dynamic",
              offsetSec: 0.44,
              text: "Здравствуй, {voc}! Как же я рад заглянуть к тебе лично!",
              audioAssetId: ruAudio["03"].id,
              sampleDurationSec: ruAudio["03"].durationSec ?? 5.6,
              trimSilenceEnd: true,
              atempo: 1.1,
              autoFitMaxTempo: 1.16,
              autoFitTargetSec: 6.35,
              volume: 1.25,
            },
          ],
        },
      },
      {
        id: "shot_04a",
        key: "04a",
        label: "Чтение Книги добрых дел",
        videoAssetId: videoAssets["04a"].id,
        sourceDurationSec: videoAssets["04a"].durationSec,
        trimStart: 0.2,
        durationMode: "fixed",
        fixedDuration: 4.2,
        keepClipAudioVolume: 0.45,
        transitionIn: { type: "fade", duration: 0.2, spark: false },
        voiceLines: {
          uk: [
            {
              id: "line_04a",
              label: "Подводка к книге",
              mode: "static",
              offsetSec: 0.38,
              text: "У моїй Книзі добрих справ уже є твоя сторінка…",
              audioAssetId: uaAudio["04a"].id,
              sampleDurationSec: 3.6,
              trimStart: 0.0,
              trimEnd: 3.6,
              trimSilenceEnd: false,
              atempo: 1.0,
              volume: 1.25,
            },
          ],
          ru: [
            {
              id: "line_04a",
              label: "Подводка к книге",
              mode: "static",
              offsetSec: 0.38,
              text: "В моей Книге добрых дел уже есть твоя страница…",
              audioAssetId: ruAudio["04a"].id,
              sampleDurationSec: 3.7,
              trimStart: 0.0,
              trimEnd: 3.7,
              trimSilenceEnd: false,
              atempo: 1.0,
              volume: 1.25,
            },
          ],
        },
      },
      {
        id: "shot_04b",
        key: "04b",
        label: "POV Книги — фото ребёнка + достижение",
        videoAssetId: videoAssets["04b"].id,
        sourceDurationSec: videoAssets["04b"].durationSec,
        trimStart: 0.0,
        durationMode: "fit_to_speech",
        fitToSpeech: {
          voiceLineId: "line_04b",
          minDur: 4.2,
          maxDur: 10.0,
          padAfterSpeech: 0.35,
          longSpeechThresholdSec: 8.0,
          longSpeechOffsetSec: 0.35,
          overflowStrategy: "slow_video",
        },
        keepClipAudioVolume: 0.45,
        transitionIn: { type: "fade", duration: 0.4, spark: true },
        overlays: [
          {
            id: "book_photo",
            type: "photo_card",
            photoFieldKey: "photo",
            captionFieldKey: "childName",
            cx: 822,
            cy: 286,
            width: 244,
            height: 244,
            borderRadius: 12,
            rotation: 0,
            framePreset: "antique_book",
            warmTint: true,
            fadeInStart: 0.15,
            fadeInDuration: 0.45,
            caption: {
              offsetY: 18,
              maxWidth: 275,
              maxFontSize: 58,
              minFontSize: 34,
              color: "#442610",
              underline: true,
            },
          },
        ],
        voiceLines: {
          uk: [
            {
              id: "line_04b",
              label: "Возраст и похвала",
              mode: "dynamic",
              offsetSec: 0.45,
              text: "{agePrefix} {achievement}…",
              audioAssetId: uaAudio["04b"].id,
              sampleDurationSec: uaAudio["04b"].durationSec ?? 5.5,
              trimSilenceEnd: true,
              atempo: 1.0,
              volume: 1.25,
            },
          ],
          ru: [
            {
              id: "line_04b",
              label: "Возраст и похвала",
              mode: "dynamic",
              offsetSec: 0.45,
              text: "{agePrefix} {achievement}…",
              audioAssetId: ruAudio["04b"].id,
              sampleDurationSec: ruAudio["04b"].durationSec ?? 5.5,
              trimSilenceEnd: true,
              atempo: 1.0,
              volume: 1.25,
            },
          ],
        },
      },
      {
        id: "shot_04c",
        key: "04c",
        label: "Кладёт книгу — «Я горжусь тобой!»",
        videoAssetId: videoAssets["04c"].id,
        sourceDurationSec: videoAssets["04c"].durationSec,
        trimStart: 1.3,
        durationMode: "fixed",
        fixedDuration: 3.02,
        keepClipAudioVolume: 0.0,
        transitionIn: { type: "fade", duration: 0.35, spark: true },
        voiceLines: {
          uk: [
            {
              id: "line_04c",
              label: "Горжусь тобой",
              mode: "static",
              offsetSec: 0.65,
              text: "Я справді пишаюся тобою!",
              audioAssetId: uaAudio["04c"].id,
              sampleDurationSec: 2.1,
              trimStart: 0.0,
              trimEnd: 2.1,
              trimSilenceEnd: false,
              atempo: 1.0,
              volume: 1.25,
            },
          ],
          ru: [
            {
              id: "line_04c",
              label: "Горжусь тобой",
              mode: "static",
              offsetSec: 0.65,
              text: "Я искренне горжусь тобой!",
              audioAssetId: ruAudio["04c"].id,
              sampleDurationSec: 2.22,
              trimStart: 0.0,
              trimEnd: 2.22,
              trimSilenceEnd: false,
              atempo: 1.0,
              volume: 1.25,
            },
          ],
        },
      },
      {
        id: "shot_05a",
        key: "05a",
        label: "Ставит подарочную коробку на стол",
        videoAssetId: videoAssets["05a"].id,
        sourceDurationSec: videoAssets["05a"].durationSec,
        trimStart: 0.2,
        durationMode: "fixed",
        fixedDuration: 4.2,
        keepClipAudioVolume: 0.0,
        transitionIn: { type: "fade", duration: 0.16, spark: false },
        voiceLines: { uk: [], ru: [] },
      },
      {
        id: "shot_05b",
        key: "05b",
        label: "Напутствие о добром сердце и подарке",
        videoAssetId: videoAssets["05b"].id,
        sourceDurationSec: videoAssets["05b"].durationSec,
        trimStart: 0.0,
        durationMode: "fixed",
        fixedDuration: 8.56,
        keepClipAudioVolume: 0.0,
        speedSegments: [
          { start: 0.0, end: 4.52, factor: 1.14 },
          { start: 4.52, end: 7.93, factor: 1.0 },
        ],
        transitionIn: { type: "fade", duration: 0.16, spark: false },
        voiceLines: {
          uk: [
            {
              id: "line_05b_1",
              label: "Береги светлое сердце",
              mode: "static",
              offsetSec: 0.15,
              text: "Бережи це світле серце й не бійся мріяти.",
              audioAssetId: uaAudio["05b_1"].id,
              sampleDurationSec: 4.55,
              trimSilenceEnd: false,
              audioSegments: [
                { start: 0.0, end: 2.52, atempo: 1.05 },
                { start: 2.75, end: 5.15, atempo: 1.05 },
              ],
              atempo: 1.05,
              volume: 1.25,
            },
            {
              id: "line_05b_2",
              label: "Особый подарок",
              mode: "static",
              offsetSec: 5.45,
              text: "На тебе вже чекає особливий подарунок!",
              audioAssetId: uaAudio["05b_2"].id,
              sampleDurationSec: 1.98,
              trimStart: 0.0,
              trimEnd: 2.1,
              trimSilenceEnd: false,
              atempo: 1.06,
              volume: 1.25,
            },
          ],
          ru: [
            {
              id: "line_05b_1",
              label: "Береги доброе сердце",
              mode: "static",
              offsetSec: 0.15,
              text: "Береги это доброе сердце и не переставай мечтать.",
              audioAssetId: ruAudio["05b_1"].id,
              sampleDurationSec: 4.95,
              trimSilenceEnd: false,
              audioSegments: [
                { start: 0.02, end: 3.01, atempo: 1.08 },
                { start: 3.24, end: 5.6, atempo: 1.08 },
              ],
              atempo: 1.08,
              volume: 1.25,
            },
            {
              id: "line_05b_2",
              label: "Особенный подарок",
              mode: "static",
              offsetSec: 5.45,
              text: "Тебя уже ждёт особенный подарок!",
              audioAssetId: ruAudio["05b_2"].id,
              sampleDurationSec: 2.0,
              trimStart: 0.0,
              trimEnd: 2.18,
              trimSilenceEnd: false,
              atempo: 1.09,
              volume: 1.25,
            },
          ],
        },
      },
      {
        id: "shot_06",
        key: "06",
        label: "Волшебное касание банта — искры",
        videoAssetId: videoAssets["06"].id,
        sourceDurationSec: videoAssets["06"].durationSec,
        trimStart: 0.2,
        durationMode: "fixed",
        fixedDuration: 4.0,
        keepClipAudioVolume: 0.0,
        transitionIn: { type: "fade", duration: 0.25, spark: false },
        voiceLines: { uk: [], ru: [] },
      },
      {
        id: "shot_07",
        key: "07",
        label: "Финал — прощание по имени и пожелание",
        videoAssetId: videoAssets["07"].id,
        sourceDurationSec: videoAssets["07"].durationSec,
        trimStart: 0.0,
        durationMode: "fixed",
        fixedDuration: 8.73,
        keepClipAudioVolume: 0.0,
        fadeOut: { duration: 0.45, color: "#2a1a08" },
        speedSegments: [
          { start: 0.0, end: 3.8, factor: 1.0 },
          { start: 3.8, end: 6.3, factor: 1.32 },
          { start: 6.3, end: 7.93, factor: 1.0 },
        ],
        transitionIn: { type: "fade", duration: 0.55, spark: true },
        voiceLines: {
          uk: [
            {
              id: "line_07_1",
              label: "С праздниками по имени",
              mode: "dynamic",
              offsetSec: 0.45,
              text: "Щасливих свят, {voc}!",
              audioAssetId: uaAudio["07_1"].id,
              sampleDurationSec: uaAudio["07_1"].durationSec ?? 2.0,
              trimSilenceEnd: true,
              atempo: 1.0,
              volume: 1.25,
            },
            {
              id: "line_07_2",
              label: "Финальное пожелание",
              mode: "static",
              offsetSec: 3.82,
              text: "Нехай у твоєму домі завжди панують тепло, радість і дива. До зустрічі!",
              audioAssetId: uaAudio["07_2"].id,
              sampleDurationSec: 3.55,
              trimSilenceEnd: false,
              audioSegments: [
                { start: 0.0, end: 2.85, atempo: 1.1 },
                { start: 3.08, end: 4.08, atempo: 1.05 },
              ],
              atempo: 1.08,
              volume: 1.25,
            },
          ],
          ru: [
            {
              id: "line_07_1",
              label: "С праздниками по имени",
              mode: "dynamic",
              offsetSec: 0.45,
              text: "Счастливых праздников, {voc}!",
              audioAssetId: ruAudio["07_1"].id,
              sampleDurationSec: ruAudio["07_1"].durationSec ?? 2.1,
              trimSilenceEnd: true,
              atempo: 1.0,
              volume: 1.25,
            },
            {
              id: "line_07_2",
              label: "Финальное пожелание",
              mode: "static",
              offsetSec: 3.82,
              text: "Пусть в твоём доме всегда живут тепло, радость и чудеса. До встречи!",
              audioAssetId: ruAudio["07_2"].id,
              sampleDurationSec: 3.35,
              trimSilenceEnd: false,
              audioSegments: [
                { start: 0.0, end: 2.77, atempo: 1.08 },
                { start: 3.02, end: 3.82, atempo: 1.04 },
              ],
              atempo: 1.06,
              volume: 1.25,
            },
          ],
        },
      },
    ],
  };

  // 5. Build formFields (uk first, then localize ru on existing block IDs)
  const formFieldsUk = [
    {
      blockType: "genderField",
      fieldKey: "gender",
      label: "Стать дитини",
      required: true,
      boyLabel: "Хлопчик",
      boyHint: "він • молодчина",
      girlLabel: "Дівчинка",
      girlHint: "вона • розумниця",
    },
    {
      blockType: "textField",
      fieldKey: "childName",
      label: "Ім'я (2–15 симв.)",
      placeholder: "Андрійко",
      required: true,
      minLength: 2,
      maxLength: 15,
      width: "half",
      enableVocative: true,
      vocativeFieldKey: "childNameVocative",
      vocativeLabel: "Кличний відмінок",
      vocativePlaceholder: "Андрійку",
      vocativeMaxLength: 17,
    },
    {
      blockType: "ageStepperField",
      fieldKey: "age",
      label: "Вік дитини",
      minAge: 1,
      maxAge: 14,
      defaultAge: 6,
      allowOmit: true,
      omitLabel: "Не озвучувати вік",
    },
    {
      blockType: "praisePresetsField",
      fieldKey: "achievement",
      label: "За що похвалити у ролику",
      required: true,
      minLength: 10,
      maxLength: 90,
      optimalMin: 25,
      optimalMax: 75,
      allowCustom: true,
      showSpokenPreview: true,
      spokenPreviewTemplate: "{agePrefix} {achievement}…",
      presets: VIDEO_PRAISE_OPTIONS.map((opt) => ({
        presetId: opt.id,
        icon: opt.icon,
        title: opt.title.uk,
        desc: opt.desc.uk,
        phraseBoy: opt.phrase.uk.boy,
        phraseGirl: opt.phrase.uk.girl,
      })),
    },
    {
      blockType: "photoUploadField",
      fieldKey: "photo",
      label: "Фото у «Книзі добрих справ»",
      required: true,
      requireConsent: true,
      autoDeleteAfterRender: true,
      showOverlayMockup: true,
      mockupShotKey: "04b",
      mockupOverlayId: "book_photo",
      consentText:
        "Я — батько/мати або законний опікун дитини та даю згоду на тимчасову обробку фото для створення відео. Знаю, що метадані EXIF видаляються, а завантажене фото стирається одразу після рендеру.",
      privacyNote:
        "EXIF-метадані очищуються автоматично; фото видаляється одразу після збірки.",
    },
  ];

  // 6. Upsert VideoTemplate `st-nicholas-room`
  const existingTpl = await payload.find({
    collection: "video-templates" as never,
    where: { slug: { equals: "st-nicholas-room" } },
    locale: "uk",
    limit: 1,
    overrideAccess: true,
  });

  let templateId: number | string;
  let savedFormFields: Array<{ id?: string; blockType?: string; presets?: Array<{ id?: string; presetId?: string }> }> = [];

  if (existingTpl.docs.length > 0) {
    const doc = existingTpl.docs[0] as unknown as {
      id: number | string;
      formFields?: typeof savedFormFields;
    };
    templateId = doc.id;
    const updated = await payload.update({
      collection: "video-templates" as never,
      id: templateId,
      locale: "uk",
      overrideAccess: true,
      data: {
        title: "Святий Миколай — Тепла резиденція",
        enabled: true,
        bgmAsset: bgmAsset.id,
        bgmVolume: 0.38,
        duckingPreset: "standard",
        ambientMode: "extract_from_shot",
        ambientSourceShotKey: "02",
        ambientExtractStart: 0.2,
        ambientExtractEnd: 9.5,
        ambientStartShotKey: "02",
        ambientVolume: 0.2,
        outputWidth: 1280,
        outputHeight: 720,
        fps: 24,
        endFadeColor: "#2a1a08",
        endFadeDuration: 0.45,
        cardBadge: "Персонаж • ~49 секунд",
        cardTitle: "Святий Миколай — «Тепла резиденція та Книга добрих справ»",
        cardDescription:
          "Звертається до дитини по імені, показує її фото та ім'я у старовинній книзі, хвалить за успіхи й запалює іскри на подарунку.",
        cardPreviewFallbackUrl: "/samples/nicholas_preview.jpg",
        parentAdviceTitle: "Порада батькам:",
        parentAdviceText:
          "у ролику Миколай показує чарівну коробку з подарунком. Після перегляду відео радимо вручити дитині підготовлений сюрприз і сказати, що це передав Святий Миколай — так у дитини не виникне питання «а де ж подарунок?».",
        timelineConfig,
        ...(Array.isArray(doc.formFields) && doc.formFields.length > 0
          ? {}
          : { formFields: formFieldsUk }),
      } as never,
    });
    savedFormFields =
      ((updated as unknown as { formFields?: typeof savedFormFields }).formFields) || [];
    console.log(`[seed-video] Updated VideoTemplate #${templateId} (uk)`);
  } else {
    const created = await payload.create({
      collection: "video-templates" as never,
      locale: "uk",
      overrideAccess: true,
      data: {
        title: "Святий Миколай — Тепла резиденція",
        slug: "st-nicholas-room",
        enabled: true,
        bgmAsset: bgmAsset.id,
        bgmVolume: 0.38,
        duckingPreset: "standard",
        ambientMode: "extract_from_shot",
        ambientSourceShotKey: "02",
        ambientExtractStart: 0.2,
        ambientExtractEnd: 9.5,
        ambientStartShotKey: "02",
        ambientVolume: 0.2,
        outputWidth: 1280,
        outputHeight: 720,
        fps: 24,
        endFadeColor: "#2a1a08",
        endFadeDuration: 0.45,
        cardBadge: "Персонаж • ~49 секунд",
        cardTitle: "Святий Миколай — «Тепла резиденція та Книга добрих справ»",
        cardDescription:
          "Звертається до дитини по імені, показує її фото та ім'я у старовинній книзі, хвалить за успіхи й запалює іскри на подарунку.",
        cardPreviewFallbackUrl: "/samples/nicholas_preview.jpg",
        parentAdviceTitle: "Порада батькам:",
        parentAdviceText:
          "у ролику Миколай показує чарівну коробку з подарунком. Після перегляду відео радимо вручити дитині підготовлений сюрприз і сказати, що це передав Святий Миколай — так у дитини не виникне питання «а де ж подарунок?».",
        formFields: formFieldsUk,
        timelineConfig,
      } as never,
    });
    const cDoc = created as unknown as {
      id: number | string;
      formFields?: typeof savedFormFields;
    };
    templateId = cDoc.id;
    savedFormFields = cDoc.formFields || [];
    console.log(`[seed-video] Created VideoTemplate #${templateId} (uk)`);
  }

  // 7. Update RU localized fields preserving exact block/row IDs
  const formFieldsRu = savedFormFields.map((blk) => {
    if (blk.blockType === "genderField") {
      return {
        ...blk,
        label: "Пол ребёнка",
        boyLabel: "Мальчик",
        boyHint: "он • молодец",
        girlLabel: "Девочка",
        girlHint: "она • умница",
      };
    }
    if (blk.blockType === "textField") {
      return {
        ...blk,
        label: "Имя (2–15 симв.)",
        placeholder: "Михаил",
        vocativeLabel: "Обращение в речи (опц.)",
        vocativePlaceholder: "Миша",
      };
    }
    if (blk.blockType === "ageStepperField") {
      return {
        ...blk,
        label: "Возраст ребёнка",
        omitLabel: "Не озвучивать возраст",
      };
    }
    if (blk.blockType === "praisePresetsField") {
      return {
        ...blk,
        label: "За что похвалить в ролике",
        spokenPreviewTemplate: "{agePrefix} {achievement}…",
        presets: (blk.presets || []).map((p) => {
          const opt = VIDEO_PRAISE_OPTIONS.find((o) => o.id === p.presetId);
          return {
            ...p,
            title: opt?.title.ru ?? "",
            desc: opt?.desc.ru ?? "",
            phraseBoy: opt?.phrase.ru.boy ?? "",
            phraseGirl: opt?.phrase.ru.girl ?? "",
          };
        }),
      };
    }
    if (blk.blockType === "photoUploadField") {
      return {
        ...blk,
        label: "Фото в «Книге добрых дел»",
        consentText:
          "Я — родитель или законный опекун ребёнка и даю согласие на временную обработку фото для создания видео. Знаю, что метаданные EXIF удаляются, а загруженное фото стирается сразу после рендера.",
        privacyNote:
          "EXIF-метаданные очищаются автоматически; фото удаляется сразу после сборки.",
      };
    }
    return blk;
  });

  await payload.update({
    collection: "video-templates" as never,
    id: templateId,
    locale: "ru",
    overrideAccess: true,
    data: {
      cardBadge: "Персонаж • ~49 секунд",
      cardTitle: "Святой Николай — «Тёплая резиденция и Книга добрых дел»",
      cardDescription:
        "Обращается к ребёнку по имени, показывает его фото и имя в старинной книге, хвалит за успехи и зажигает искры на подарке.",
      parentAdviceTitle: "Совет родителям:",
      parentAdviceText:
        "в ролике Николай показывает волшебную коробку с подарком. После показа видео рекомендуем вручить ребёнку подготовленный подарок и сказать, что его передал Святой Николай — тогда у ребёнка не возникнет вопроса «а где же подарок?».",
      formFields: formFieldsRu,
    } as never,
  });
  console.log(`[seed-video] Updated VideoTemplate #${templateId} (ru)`);

  // 8. Link `st-nicholas-room` ServiceVariation -> VideoTemplate
  const variationRes = await payload.find({
    collection: "service-variations",
    where: { variationSlug: { equals: "st-nicholas-room" } },
    limit: 1,
    overrideAccess: true,
  });

  if (variationRes.docs.length > 0) {
    const vDoc = variationRes.docs[0] as unknown as { id: number | string };
    await payload.update({
      collection: "service-variations",
      id: vDoc.id,
      overrideAccess: true,
      data: {
        videoTemplate: templateId,
      } as never,
    });
    console.log(
      `[seed-video] Linked ServiceVariation st-nicholas-room (#${vDoc.id}) -> VideoTemplate #${templateId}`
    );
  } else {
    console.warn(
      "[seed-video] ServiceVariation st-nicholas-room not found (run npm run seed:stage-b first)"
    );
  }

  console.log("[seed-video] Done.");
  process.exit(0);
}

seedVideoTemplate().catch((err) => {
  console.error("[seed-video] Error:", err);
  process.exit(1);
});
