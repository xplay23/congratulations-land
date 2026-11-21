import { z } from "zod";

export const SpeedSegmentSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  factor: z.number().min(0.25).max(4.0),
});

export const AudioTrimSegmentSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  atempo: z.number().min(0.5).max(2.0).default(1.0),
});

export const VoiceLineConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  mode: z.enum(["static", "dynamic"]),
  offsetSec: z.number().min(0).default(0),
  text: z.string().default(""),
  audioAssetId: z.union([z.number(), z.string()]).nullable().optional(),
  sampleDurationSec: z.number().min(0).optional(),
  trimStart: z.number().min(0).optional(),
  trimEnd: z.number().min(0).optional(),
  trimSilenceEnd: z.boolean().default(true),
  audioSegments: z.array(AudioTrimSegmentSchema).optional(),
  atempo: z.number().min(0.5).max(2.0).default(1.0),
  autoFitMaxTempo: z.number().min(1.0).max(1.5).optional(),
  autoFitTargetSec: z.number().min(1.0).max(30.0).optional(),
  volume: z.number().min(0).max(3.0).default(1.25),
});

export const VideoOverlayCaptionSchema = z.object({
  offsetY: z.number().default(18),
  maxWidth: z.number().min(40).max(1200).default(275),
  maxFontSize: z.number().min(12).max(160).default(58),
  minFontSize: z.number().min(10).max(120).default(34),
  color: z.string().default("#442610"),
  underline: z.boolean().default(true),
});

export const VideoOverlayConfigSchema = z.object({
  id: z.string().min(1),
  type: z.literal("photo_card").default("photo_card"),
  photoFieldKey: z.string().min(1).default("photo"),
  captionFieldKey: z.string().optional(),
  cx: z.number().min(0).max(1920).default(822),
  cy: z.number().min(0).max(1080).default(286),
  width: z.number().min(32).max(1280).default(244),
  height: z.number().min(32).max(720).default(244),
  borderRadius: z.number().min(0).max(200).default(12),
  rotation: z.number().min(-45).max(45).default(0),
  framePreset: z
    .enum(["antique_book", "polaroid", "gold_frame", "none"])
    .default("antique_book"),
  warmTint: z.boolean().default(true),
  fadeInStart: z.number().min(0).max(15).default(0.15),
  fadeInDuration: z.number().min(0).max(5).default(0.45),
  caption: VideoOverlayCaptionSchema.optional(),
});

export const FitToSpeechConfigSchema = z.object({
  voiceLineId: z.string().optional(),
  minDur: z.number().min(0.5).max(60).default(2.5),
  maxDur: z.number().min(0.5).max(60).default(8.0),
  padAfterSpeech: z.number().min(-2.0).max(5.0).default(0.2),
  longSpeechThresholdSec: z.number().min(1).max(30).optional(),
  longSpeechOffsetSec: z.number().min(0).max(5).optional(),
  overflowStrategy: z.enum(["clamp", "slow_video"]).default("clamp"),
});

export const VideoShotConfigSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  label: z.string().optional(),
  videoAssetId: z.union([z.number(), z.string()]).nullable().optional(),
  sourceDurationSec: z.number().min(0).optional(),
  trimStart: z.number().min(0).default(0),
  durationMode: z.enum(["fixed", "fit_to_speech"]).default("fixed"),
  fixedDuration: z.number().min(0.2).max(60).optional(),
  fitToSpeech: FitToSpeechConfigSchema.optional(),
  keepClipAudioVolume: z.number().min(0).max(2.0).default(0),
  fadeIn: z
    .object({
      duration: z.number().min(0).max(5),
      color: z.string().optional(),
    })
    .optional(),
  fadeOut: z
    .object({
      duration: z.number().min(0).max(5),
      color: z.string().optional(),
    })
    .optional(),
  speedSegments: z.array(SpeedSegmentSchema).optional(),
  transitionIn: z
    .object({
      type: z.enum(["fade", "dissolve", "none"]).default("fade"),
      duration: z.number().min(0).max(3.0).default(0.25),
      spark: z.boolean().default(false),
    })
    .optional(),
  overlays: z.array(VideoOverlayConfigSchema).optional(),
  voiceLines: z
    .object({
      uk: z.array(VoiceLineConfigSchema).default([]),
      ru: z.array(VoiceLineConfigSchema).default([]),
    })
    .default({ uk: [], ru: [] }),
});

const SamplePresetLocaleMapSchema = z.object({
  uk: z.record(z.string(), z.string()).default({}),
  ru: z.record(z.string(), z.string()).default({}),
});

export const VideoTimelineConfigSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  samplePresets: z
    .object({
      short: SamplePresetLocaleMapSchema.default({ uk: {}, ru: {} }),
      medium: SamplePresetLocaleMapSchema.default({ uk: {}, ru: {} }),
      max: SamplePresetLocaleMapSchema.default({ uk: {}, ru: {} }),
    })
    .default({
      short: { uk: {}, ru: {} },
      medium: { uk: {}, ru: {} },
      max: { uk: {}, ru: {} },
    }),
  shots: z.array(VideoShotConfigSchema).default([]),
});

export type SpeedSegment = z.infer<typeof SpeedSegmentSchema>;
export type AudioTrimSegment = z.infer<typeof AudioTrimSegmentSchema>;
export type VoiceLineConfig = z.infer<typeof VoiceLineConfigSchema>;
export type VideoOverlayCaption = z.infer<typeof VideoOverlayCaptionSchema>;
export type VideoOverlayConfig = z.infer<typeof VideoOverlayConfigSchema>;
export type FitToSpeechConfig = z.infer<typeof FitToSpeechConfigSchema>;
export type VideoShotConfig = z.infer<typeof VideoShotConfigSchema>;
export type VideoTimelineConfig = z.infer<typeof VideoTimelineConfigSchema>;

export const EMPTY_TIMELINE_CONFIG: VideoTimelineConfig = {
  schemaVersion: 1,
  samplePresets: {
    short: { uk: {}, ru: {} },
    medium: { uk: {}, ru: {} },
    max: { uk: {}, ru: {} },
  },
  shots: [],
};

export function parseTimelineConfig(input: unknown): VideoTimelineConfig {
  if (!input || typeof input !== "object") {
    return EMPTY_TIMELINE_CONFIG;
  }
  return VideoTimelineConfigSchema.parse(input);
}

/**
 * Extracts all numeric/string PipelineAsset IDs referenced by timelineConfig
 * so Payload can store them in `usedAssets` relationship for integrity tracking.
 */
export function extractTimelineAssetIds(timeline: VideoTimelineConfig): number[] {
  const ids = new Set<number>();
  const addId = (val: number | string | null | undefined) => {
    if (val === null || val === undefined || val === "") return;
    const n = Number(val);
    if (Number.isInteger(n) && n > 0) ids.add(n);
  };

  for (const shot of timeline.shots) {
    addId(shot.videoAssetId);
    for (const line of shot.voiceLines.uk) {
      addId(line.audioAssetId);
    }
    for (const line of shot.voiceLines.ru) {
      addId(line.audioAssetId);
    }
  }
  return Array.from(ids);
}

/**
 * Resolved JSON manifest passed to stateless `video-pipeline/scripts/assemble_video.py`.
 */
export interface AssembleManifestVoiceLine {
  id: string;
  audioPath: string;
  offsetSec: number;
  trimStart?: number;
  trimEnd?: number;
  trimSilenceEnd: boolean;
  audioSegments?: AudioTrimSegment[];
  atempo: number;
  autoFitMaxTempo?: number;
  autoFitTargetSec?: number;
  volume: number;
}

export interface AssembleManifestOverlay {
  id: string;
  type: "photo_card";
  photoPath: string;
  captionText: string;
  cx: number;
  cy: number;
  width: number;
  height: number;
  borderRadius: number;
  rotation: number;
  framePreset: "antique_book" | "polaroid" | "gold_frame" | "none";
  warmTint: boolean;
  fadeInStart: number;
  fadeInDuration: number;
  caption?: VideoOverlayCaption;
}

export interface AssembleManifestShot {
  id: string;
  key: string;
  videoPath: string;
  trimStart: number;
  durationMode: "fixed" | "fit_to_speech";
  fixedDuration?: number;
  fitToSpeech?: FitToSpeechConfig;
  keepClipAudioVolume: number;
  fadeIn?: { duration: number; color?: string };
  fadeOut?: { duration: number; color?: string };
  speedSegments?: SpeedSegment[];
  transitionIn?: {
    type: "fade" | "dissolve" | "none";
    duration: number;
    spark: boolean;
  };
  overlays: AssembleManifestOverlay[];
  voiceLines: AssembleManifestVoiceLine[];
}

export interface AssembleManifest {
  version: 1;
  tag: string;
  lang: "uk" | "ru";
  output: {
    width: number;
    height: number;
    fps: number;
    endFadeColor?: string;
    endFadeDuration?: number;
  };
  audio: {
    bgmPath?: string;
    bgmVolume: number;
    ambientMode: "none" | "asset" | "extract_from_shot";
    ambientPath?: string;
    ambientSourceShotKey?: string;
    ambientExtractStart?: number;
    ambientExtractEnd?: number;
    ambientStartShotKey?: string;
    ambientVolume: number;
    duckingPreset: "gentle" | "standard" | "strong";
  };
  fontFallbackPath: string;
  shots: AssembleManifestShot[];
}
