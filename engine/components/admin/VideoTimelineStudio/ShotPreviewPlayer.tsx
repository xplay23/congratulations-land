"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  FastForward,
  Loader2,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";
import type {
  VideoOverlayConfig,
  VideoShotConfig,
  VoiceLineConfig,
} from "@/lib/video/template-schema";
import type { Lang } from "@/lib/types";
import type {
  DynamicPreviewAudioEntry,
  SimulatedShotMetrics,
} from "./types";

interface ShotPreviewPlayerProps {
  shot: VideoShotConfig | null;
  metrics: SimulatedShotMetrics | null;
  activeLang: Lang;
  selectedVoiceLineId: string | null;
  sampleFields: Record<string, string>;
  liveAudioMap: Record<string, DynamicPreviewAudioEntry>;
  onUpdateOverlay: (overlay: VideoOverlayConfig) => void;
  onNudgeVoiceLine: (lineId: string, deltaSec: number) => void;
  onRenderShotFfmpeg: () => Promise<string | null>;
  renderingShot: boolean;
  renderedShotUrl: string | null;
  externalSeek?: { shotId: string; sourceSec: number; nonce: number } | null;
}

export function ShotPreviewPlayer({
  shot,
  metrics,
  activeLang,
  selectedVoiceLineId,
  sampleFields,
  liveAudioMap,
  onUpdateOverlay,
  onNudgeVoiceLine,
  onRenderShotFfmpeg,
  renderingShot,
  renderedShotUrl,
  externalSeek,
}: ShotPreviewPlayerProps) {
  const adminLang = useAdminLang();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());

  const [playing, setPlaying] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [viewMode, setViewMode] = useState<"live" | "ffmpeg">("live");
  const [audioSyncStatus, setAudioSyncStatus] = useState<string | null>(null);

  const trimStart = shot?.trimStart ?? 0;
  const clipDuration = metrics?.durationSec ?? 5.0;
  const voiceLines: VoiceLineConfig[] = shot ? shot.voiceLines[activeLang] || [] : [];
  const primaryOverlay = shot?.overlays?.[0] ?? null;

  // Reset to live mode when switching shots
  useEffect(() => {
    stopScheduledAudio();
    setPlaying(false);
    setLocalTime(0);
    setViewMode("live");
  }, [shot?.id, activeLang]);

  useEffect(() => {
    if (renderedShotUrl) {
      setViewMode("ffmpeg");
    }
  }, [renderedShotUrl]);

  // Live video frame scrub when dragging trim handles / slip window on timeline
  useEffect(() => {
    if (!externalSeek || !shot || externalSeek.shotId !== shot.id) return;
    if (viewMode !== "live") setViewMode("live");
    const v = videoRef.current;
    if (v && Number.isFinite(externalSeek.sourceSec)) {
      v.pause();
      stopScheduledAudio();
      setPlaying(false);
      v.currentTime = Math.max(0, externalSeek.sourceSec);
      setLocalTime(Math.max(0, externalSeek.sourceSec - trimStart));
    }
  }, [externalSeek, shot, trimStart, viewMode]);

  useEffect(() => {
    return () => {
      stopScheduledAudio();
    };
  }, []);

  function stopScheduledAudio() {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // already stopped
      }
    }
    activeSourcesRef.current = [];
  }

  async function loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    const ctx = audioCtxRef.current;
    const cached = bufferCacheRef.current.get(url);
    if (cached) return cached;
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arr);
      bufferCacheRef.current.set(url, decoded);
      return decoded;
    } catch {
      return null;
    }
  }

  async function startSyncedPlayback(fromLocalSec: number) {
    const v = videoRef.current;
    if (!v || !shot) return;

    stopScheduledAudio();
    setAudioSyncStatus(null);

    v.currentTime = trimStart + fromLocalSec;
    v.muted = (shot.keepClipAudioVolume ?? 0) <= 0.01;
    v.volume = Math.min(1, Math.max(0, shot.keepClipAudioVolume ?? 0));

    // Pre-decode voice lines for this shot
    const toPlay: Array<{ vl: VoiceLineConfig; buf: AudioBuffer }> = [];
    for (const vl of voiceLines) {
      const liveEntry = liveAudioMap[`${activeLang}:${vl.id}`];
      const url =
        vl.mode === "dynamic" && liveEntry?.blobUrl
          ? liveEntry.blobUrl
          : vl.audioAssetId
          ? `/api/admin/pipeline-assets/${vl.audioAssetId}/stream`
          : null;
      if (!url) continue;
      const buf = await loadAudioBuffer(url);
      if (buf) toPlay.push({ vl, buf });
    }

    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    await v.play().catch(() => {});
    setPlaying(true);

    if (audioCtxRef.current && toPlay.length > 0) {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      for (const { vl, buf } of toPlay) {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const rate = Math.max(0.5, Math.min(2.0, vl.atempo || 1.0));
        src.playbackRate.value = rate;

        const gain = ctx.createGain();
        gain.gain.value = Math.min(1.5, Math.max(0.1, vl.volume ?? 1.0));
        src.connect(gain);
        gain.connect(ctx.destination);

        const audioStartInBuf = vl.trimStart ?? 0;
        const relDelay = vl.offsetSec - fromLocalSec;
        if (relDelay >= 0) {
          src.start(now + relDelay, audioStartInBuf);
          activeSourcesRef.current.push(src);
        } else {
          const skip = -relDelay * rate;
          if (audioStartInBuf + skip < buf.duration - 0.05) {
            src.start(now, audioStartInBuf + skip);
            activeSourcesRef.current.push(src);
          }
        }
      }
      setAudioSyncStatus(`${toPlay.length} ${tAdmin(adminLang, "репл. синхр.", "репл. синхр.")}`);
    }
  }

  function pauseSyncedPlayback() {
    stopScheduledAudio();
    videoRef.current?.pause();
    setPlaying(false);
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || viewMode !== "live") return;
    const rel = Math.max(0, v.currentTime - trimStart);
    if (rel >= clipDuration) {
      pauseSyncedPlayback();
      v.currentTime = trimStart;
      setLocalTime(0);
    } else {
      setLocalTime(rel);
    }
  }

  function handleScrub(nextSec: number) {
    setLocalTime(nextSec);
    if (videoRef.current) {
      videoRef.current.currentTime = trimStart + nextSec;
    }
    if (playing) {
      void startSyncedPlayback(nextSec);
    }
  }

  // Interactive drag / resize of overlay box on top of the 16:9 stage
  function beginOverlayDrag(
    e: React.MouseEvent,
    mode: "move" | "resize"
  ) {
    if (!primaryOverlay || !stageRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = stageRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const origCx = primaryOverlay.cx;
    const origCy = primaryOverlay.cy;
    const origW = primaryOverlay.width;
    const origH = primaryOverlay.height;

    const onMove = (ev: MouseEvent) => {
      const dxPx = ((ev.clientX - startX) / rect.width) * 1280;
      const dyPx = ((ev.clientY - startY) / rect.height) * 720;

      if (mode === "move") {
        onUpdateOverlay({
          ...primaryOverlay,
          cx: Math.round(Math.max(40, Math.min(1240, origCx + dxPx))),
          cy: Math.round(Math.max(40, Math.min(680, origCy + dyPx))),
        });
      } else {
        const nextW = Math.round(Math.max(48, Math.min(900, origW + dxPx * 2)));
        const nextH = ev.shiftKey
          ? Math.round(Math.max(48, Math.min(680, origH + dyPx * 2)))
          : nextW; // square by default unless Shift held
        onUpdateOverlay({
          ...primaryOverlay,
          width: nextW,
          height: nextH,
        });
      }
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const videoStreamUrl = shot?.videoAssetId
    ? `/api/admin/pipeline-assets/${shot.videoAssetId}/stream`
    : null;

  const activeVoiceLine =
    voiceLines.find((vl) => vl.id === selectedVoiceLineId) || voiceLines[0] || null;

  const captionSample =
    (primaryOverlay?.captionFieldKey
      ? sampleFields[primaryOverlay.captionFieldKey]
      : "") ||
    sampleFields.childName ||
    (activeLang === "uk" ? "Андрійко" : "Андрей");

  return (
    <div className="vts-panel">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 12.5 }}>
          {shot
            ? `${tAdmin(adminLang, "Шот", "Шот")} ${shot.key}${shot.label ? ` — ${shot.label}` : ""}`
            : tAdmin(adminLang, "Выберите шот на таймлайне", "Оберіть шот на таймлайні")}
        </div>
        <div className="vts-segmented">
          <button
            type="button"
            className={viewMode === "live" ? "is-active" : ""}
            onClick={() => setViewMode("live")}
          >
            {tAdmin(adminLang, "Live-превью", "Live-прев'ю")}
          </button>
          <button
            type="button"
            disabled={!renderedShotUrl}
            className={viewMode === "ffmpeg" ? "is-active" : ""}
            onClick={() => setViewMode("ffmpeg")}
          >
            FFmpeg
          </button>
        </div>
      </div>

      <div ref={stageRef} className="vts-player-stage">
        {viewMode === "ffmpeg" && renderedShotUrl ? (
          <video key={renderedShotUrl} src={renderedShotUrl} controls autoPlay playsInline />
        ) : videoStreamUrl ? (
          <>
            <video
              key={videoStreamUrl}
              ref={videoRef}
              src={videoStreamUrl}
              playsInline
              preload="auto"
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = trimStart;
                }
              }}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => pauseSyncedPlayback()}
            />
            {primaryOverlay && (
              <div className="vts-overlay-layer">
                <div
                  className="vts-overlay-box"
                  style={{
                    left: `${((primaryOverlay.cx - primaryOverlay.width / 2) / 1280) * 100}%`,
                    top: `${((primaryOverlay.cy - primaryOverlay.height / 2) / 720) * 100}%`,
                    width: `${(primaryOverlay.width / 1280) * 100}%`,
                    height: `${(primaryOverlay.height / 720) * 100}%`,
                    transform: primaryOverlay.rotation
                      ? `rotate(${primaryOverlay.rotation}deg)`
                      : undefined,
                  }}
                  onMouseDown={(e) => beginOverlayDrag(e, "move")}
                  title={tAdmin(
                    adminLang,
                    "Перетащите фото. Угол справа снизу — размер (Shift = свободные пропорции).",
                    "Перетягніть фото. Кут праворуч знизу — розмір (Shift = вільні пропорції)."
                  )}
                >
                  <div
                    className="vts-overlay-photo-frame"
                    style={{
                      borderRadius: `${Math.round((primaryOverlay.borderRadius / 244) * 12)}px`,
                    }}
                  >
                    {primaryOverlay.photoFieldKey} ({primaryOverlay.width}×{primaryOverlay.height})
                  </div>
                  <div
                    className="vts-overlay-resize-handle"
                    onMouseDown={(e) => beginOverlayDrag(e, "resize")}
                  />
                  {primaryOverlay.captionFieldKey && (
                    <div
                      className="vts-overlay-caption-preview"
                      style={{
                        top: `calc(100% + ${Math.round(((primaryOverlay.caption?.offsetY ?? 18) / 720) * 100)}% )`,
                        color: primaryOverlay.caption?.color || "#442610",
                        fontSize: "clamp(10px, 1.5vw, 18px)",
                      }}
                    >
                      {captionSample}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            {tAdmin(adminLang, "Выберите видеоклип для этого шота в инспекторе →", "Оберіть відеокліп для цього шоту в інспекторі →")}
          </div>
        )}
      </div>

      {viewMode === "live" && shot && (
        <>
          <div className="vts-controls-bar">
            <button
              type="button"
              className="vts-btn vts-btn--primary vts-btn--sm"
              disabled={!videoStreamUrl}
              onClick={() => {
                if (playing) pauseSyncedPlayback();
                else void startSyncedPlayback(localTime);
              }}
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
              {playing
                ? tAdmin(adminLang, "Пауза", "Пауза")
                : tAdmin(adminLang, "Играть шот", "Грати шот")}
            </button>

            <button
              type="button"
              className="vts-btn vts-btn--sm"
              onClick={() => handleScrub(0)}
              title={tAdmin(adminLang, "В начало шота", "На початок шоту")}
            >
              <RotateCcw size={13} />
            </button>

            <input
              type="range"
              className="vts-scrubber"
              min={0}
              max={Math.max(0.1, clipDuration)}
              step={0.02}
              value={Math.min(localTime, clipDuration)}
              onChange={(e) => handleScrub(Number(e.target.value))}
            />

            <span className="vts-timecode">
              {localTime.toFixed(2)} / {clipDuration.toFixed(2)}s
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            {activeVoiceLine ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11.5, color: "var(--theme-elevation-600)" }}>
                  <Volume2 size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: 3 }} />
                  {activeVoiceLine.label || activeVoiceLine.id} ({activeVoiceLine.offsetSec.toFixed(2)}s):
                </span>
                <button
                  type="button"
                  className="vts-btn vts-btn--sm"
                  onClick={() => onNudgeVoiceLine(activeVoiceLine.id, -0.05)}
                >
                  <Rewind size={11} /> −0.05s
                </button>
                <button
                  type="button"
                  className="vts-btn vts-btn--sm"
                  onClick={() => onNudgeVoiceLine(activeVoiceLine.id, 0.05)}
                >
                  +0.05s <FastForward size={11} />
                </button>
                {audioSyncStatus && <span className="vts-badge">{audioSyncStatus}</span>}
              </div>
            ) : (
              <span style={{ fontSize: 11.5, color: "var(--theme-elevation-500)" }}>
                {tAdmin(adminLang, "В этом шоте нет реплик (SFX / музыка)", "У цьому шоті немає реплік (SFX / музика)")}
              </span>
            )}

            <button
              type="button"
              className="vts-btn vts-btn--amber vts-btn--sm"
              disabled={renderingShot || !videoStreamUrl}
              onClick={() => void onRenderShotFfmpeg()}
            >
              {renderingShot ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {renderingShot
                ? tAdmin(adminLang, "Рендер шота…", "Рендер шоту…")
                : tAdmin(adminLang, "Превью шота (FFmpeg, ~2с)", "Прев'ю шоту (FFmpeg, ~2с)")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
