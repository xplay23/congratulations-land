import type { VideoShotConfig, VoiceLineConfig } from "@/lib/video/template-schema";
import type { Lang } from "@/lib/types";

export type SamplePresetKey = "short" | "medium" | "max";

export interface PipelineAssetSummary {
  id: number;
  label: string;
  filename: string;
  assetKind: string;
  lang: string;
  durationSec?: number | null;
  width?: number | null;
  height?: number | null;
  fps?: number | null;
}

export interface DynamicPreviewAudioEntry {
  blobUrl: string;
  durationSec: number;
  renderedText: string;
}

/**
 * Estimates the simulated duration of a voice line in seconds using:
 * 1) live audition preview duration if generated in this session,
 * 2) cached sampleDurationSec or asset duration,
 * 3) rough character-count fallback (~13 chars/sec).
 */
export function estimateVoiceLineDuration(
  vl: VoiceLineConfig,
  liveDurationSec?: number,
  assetDurationSec?: number
): number {
  if (typeof liveDurationSec === "number" && liveDurationSec > 0) {
    return liveDurationSec / Math.max(0.5, vl.atempo || 1);
  }
  if (vl.audioSegments && vl.audioSegments.length > 0) {
    return vl.audioSegments.reduce(
      (sum, seg) => sum + Math.max(0.05, seg.end - seg.start) / Math.max(0.5, seg.atempo || 1),
      0
    );
  }
  if (typeof vl.trimEnd === "number" && vl.trimEnd > (vl.trimStart || 0)) {
    return (vl.trimEnd - (vl.trimStart || 0)) / Math.max(0.5, vl.atempo || 1);
  }
  if (typeof vl.sampleDurationSec === "number" && vl.sampleDurationSec > 0) {
    return vl.sampleDurationSec;
  }
  if (typeof assetDurationSec === "number" && assetDurationSec > 0) {
    return assetDurationSec / Math.max(0.5, vl.atempo || 1);
  }
  const chars = (vl.text || "").trim().length;
  return Math.max(1.2, Math.min(9.5, chars / 13.5));
}

export interface SimulatedShotMetrics {
  durationSec: number;
  minDurSec: number;
  maxDurSec: number;
  sourceAvailableSec: number;
  isDynamic: boolean;
  isOverflow: boolean;
}

export function computeSimulatedShotMetrics(
  shot: VideoShotConfig,
  lang: Lang,
  liveAudioMap: Record<string, DynamicPreviewAudioEntry>,
  assetMap: Record<number, PipelineAssetSummary>
): SimulatedShotMetrics {
  const asset = shot.videoAssetId ? assetMap[Number(shot.videoAssetId)] : undefined;
  const srcDur = asset?.durationSec ?? shot.sourceDurationSec ?? 8.0;
  const sourceAvailableSec = Math.max(0.5, srcDur - (shot.trimStart || 0));

  if (shot.speedSegments && shot.speedSegments.length > 0) {
    const dur = shot.speedSegments.reduce(
      (sum, seg) => sum + Math.max(0.05, seg.end - seg.start) * (seg.factor || 1),
      0
    );
    return {
      durationSec: Math.round(dur * 100) / 100,
      minDurSec: dur,
      maxDurSec: dur,
      sourceAvailableSec,
      isDynamic: false,
      isOverflow: false,
    };
  }

  if (shot.durationMode === "fit_to_speech") {
    const fit = shot.fitToSpeech || {
      minDur: 2.5,
      maxDur: sourceAvailableSec,
      padAfterSpeech: 0.2,
      overflowStrategy: "clamp" as const,
    };
    const lines = shot.voiceLines[lang] || [];
    const target =
      lines.find((l) => l.id === fit.voiceLineId) || lines[0] || null;
    let desired = fit.minDur;
    if (target) {
      const live = liveAudioMap[`${lang}:${target.id}`];
      const aAsset = target.audioAssetId
        ? assetMap[Number(target.audioAssetId)]
        : undefined;
      const vDur = estimateVoiceLineDuration(
        target,
        live?.durationSec,
        aAsset?.durationSec ?? undefined
      );
      const effOffset =
        typeof fit.longSpeechThresholdSec === "number" &&
        typeof fit.longSpeechOffsetSec === "number" &&
        vDur > fit.longSpeechThresholdSec
          ? fit.longSpeechOffsetSec
          : target.offsetSec;
      desired = effOffset + vDur + fit.padAfterSpeech;
    }

    const clamped = Math.min(fit.maxDur, Math.max(fit.minDur, desired));
    const isOverflow = desired > Math.min(fit.maxDur, sourceAvailableSec) + 0.05;
    return {
      durationSec: Math.round(clamped * 100) / 100,
      minDurSec: fit.minDur,
      maxDurSec: Math.min(fit.maxDur, fit.overflowStrategy === "slow_video" ? sourceAvailableSec * 1.35 : sourceAvailableSec),
      sourceAvailableSec,
      isDynamic: true,
      isOverflow,
    };
  }

  const fixedDur = Math.min(shot.fixedDuration ?? sourceAvailableSec, sourceAvailableSec);
  return {
    durationSec: Math.round(fixedDur * 100) / 100,
    minDurSec: fixedDur,
    maxDurSec: fixedDur,
    sourceAvailableSec,
    isDynamic: false,
    isOverflow: false,
  };
}
