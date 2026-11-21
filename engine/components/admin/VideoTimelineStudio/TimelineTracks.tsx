"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Music,
  Sparkles,
  Zap,
} from "lucide-react";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";
import type { VideoShotConfig, VoiceLineConfig } from "@/lib/video/template-schema";
import type { Lang } from "@/lib/types";
import {
  estimateVoiceLineDuration,
  type DynamicPreviewAudioEntry,
  type PipelineAssetSummary,
  type SimulatedShotMetrics,
} from "./types";

interface TimelineTracksProps {
  shots: VideoShotConfig[];
  metricsByShotId: Record<string, SimulatedShotMetrics>;
  activeLang: Lang;
  selectedShotId: string | null;
  selectedVoiceLineId: string | null;
  liveAudioMap: Record<string, DynamicPreviewAudioEntry>;
  assetMap: Record<number, PipelineAssetSummary>;
  onSelectShot: (shotId: string) => void;
  onSelectVoiceLine: (shotId: string, lineId: string) => void;
  onMoveShot: (shotIndex: number, dir: -1 | 1) => void;
  onChangeVoiceOffset: (shotId: string, lineId: string, nextOffsetSec: number) => void;
  onTrimShot: (shotId: string, trimStart: number, fixedDuration: number) => void;
  onSeekPreviewFrame?: (shotId: string, sourceSec: number) => void;
  bgmSummary: string;
}

const PX_PER_SEC = 28;
const MIN_SHOT_WIDTH = 104;
const MIN_CLIP_DUR = 0.3;

export function TimelineTracks({
  shots,
  metricsByShotId,
  activeLang,
  selectedShotId,
  selectedVoiceLineId,
  liveAudioMap,
  assetMap,
  onSelectShot,
  onSelectVoiceLine,
  onMoveShot,
  onChangeVoiceOffset,
  onTrimShot,
  onSeekPreviewFrame,
  bgmSummary,
}: TimelineTracksProps) {
  const adminLang = useAdminLang();
  const [activeTrimInfo, setActiveTrimInfo] = useState<{
    shotId: string;
    label: string;
  } | null>(null);

  function startVoiceDrag(
    e: React.MouseEvent,
    shot: VideoShotConfig,
    vl: VoiceLineConfig,
    trackWidthPx: number,
    shotDurSec: number
  ) {
    e.preventDefault();
    e.stopPropagation();
    onSelectVoiceLine(shot.id, vl.id);

    const startX = e.clientX;
    const origOffset = vl.offsetSec;
    const secPerPx = shotDurSec / Math.max(40, trackWidthPx);

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const raw = origOffset + dx * secPerPx;
      const clamped = Math.max(0, Math.min(Math.max(0, shotDurSec - 0.1), raw));
      const snapped = Math.round(clamped * 100) / 100;
      onChangeVoiceOffset(shot.id, vl.id, snapped);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function startShotTrimDrag(
    e: React.MouseEvent,
    shot: VideoShotConfig,
    mode: "left" | "right" | "slip",
    srcDur: number,
    barWidthPx: number
  ) {
    e.preventDefault();
    e.stopPropagation();
    onSelectShot(shot.id);

    const startX = e.clientX;
    const origTrimStart = shot.trimStart || 0;
    const origDur = Math.min(
      shot.fixedDuration ?? Math.max(MIN_CLIP_DUR, srcDur - origTrimStart),
      Math.max(MIN_CLIP_DUR, srcDur - origTrimStart)
    );
    const origTrimEnd = Math.min(srcDur, origTrimStart + origDur);

    const secPerPx =
      mode === "slip"
        ? srcDur / Math.max(40, barWidthPx)
        : 1 / PX_PER_SEC;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dt = dx * secPerPx;

      let nextStart = origTrimStart;
      let nextDur = origDur;
      let previewSec = origTrimStart;

      if (mode === "left") {
        // Move in-point while keeping out-point anchored
        nextStart = Math.max(0, Math.min(origTrimEnd - MIN_CLIP_DUR, origTrimStart + dt));
        nextDur = origTrimEnd - nextStart;
        previewSec = nextStart;
      } else if (mode === "right") {
        // Move out-point while keeping in-point anchored
        const maxDur = Math.max(MIN_CLIP_DUR, srcDur - origTrimStart);
        nextDur = Math.max(MIN_CLIP_DUR, Math.min(maxDur, origDur + dt));
        previewSec = origTrimStart + nextDur;
      } else {
        // Slip edit: slide active window across full source footage keeping duration fixed
        const maxStart = Math.max(0, srcDur - origDur);
        nextStart = Math.max(0, Math.min(maxStart, origTrimStart + dt));
        nextDur = origDur;
        previewSec = nextStart;
      }

      nextStart = Math.round(nextStart * 100) / 100;
      nextDur = Math.round(nextDur * 100) / 100;
      const nextEnd = Math.round((nextStart + nextDur) * 100) / 100;

      onTrimShot(shot.id, nextStart, nextDur);
      onSeekPreviewFrame?.(shot.id, previewSec);
      setActiveTrimInfo({
        shotId: shot.id,
        label: `${nextStart.toFixed(2)}–${nextEnd.toFixed(2)}s (${nextDur.toFixed(2)}/${srcDur.toFixed(1)}s)`,
      });
    };

    const onUp = () => {
      setActiveTrimInfo(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div className="vts-timeline-wrap">
      <div className="vts-timeline-header">
        <span>
          {tAdmin(
            adminLang,
            "Таймлайн (фикс. шоты: тяните края для подрезки и полосу снизу для сдвига отрезка; блоки голоса — для липсинка)",
            "Таймлайн (фікс. шоти: тягніть краї для підрізки й смугу знизу для зсуву відрізку; блоки голосу — для ліпсінку)"
          )}
        </span>
        <span style={{ fontSize: 11, fontWeight: 500 }}>
          <span style={{ color: "#3b82f6", marginRight: 10 }}>■ Static MP3</span>
          <span style={{ color: "#d97706" }}>▤ Dynamic TTS</span>
        </span>
      </div>

      <div className="vts-timeline-scroll">
        <div className="vts-lane-row">
          <div
            className="vts-lane-label"
            style={{
              flexDirection: "column",
              justifyContent: "space-around",
              alignItems: "flex-start",
            }}
          >
            <span>{tAdmin(adminLang, "Видео", "Відео")}</span>
            <span>
              {tAdmin(adminLang, "Голос", "Голос")} ({activeLang.toUpperCase()})
            </span>
          </div>

          {shots.map((shot, idx) => {
            const m = metricsByShotId[shot.id] || {
              durationSec: 4,
              minDurSec: 4,
              maxDurSec: 4,
              sourceAvailableSec: 8,
              isDynamic: false,
              isOverflow: false,
            };

            const asset = shot.videoAssetId ? assetMap[Number(shot.videoAssetId)] : undefined;
            const srcDur = asset?.durationSec ?? shot.sourceDurationSec ?? 8.0;
            const canTrimOnTimeline =
              shot.durationMode === "fixed" && !(shot.speedSegments && shot.speedSegments.length > 0);

            const displaySec = m.isDynamic
              ? Math.max(m.durationSec, Math.min(m.maxDurSec, m.durationSec + 1.2))
              : m.durationSec;
            const colWidth = Math.max(MIN_SHOT_WIDTH, Math.round(displaySec * PX_PER_SEC));
            const elasticPercent =
              m.isDynamic && displaySec > m.durationSec
                ? Math.round(((displaySec - m.durationSec) / displaySec) * 100)
                : 0;

            const isShotSelected = shot.id === selectedShotId;
            const lines = shot.voiceLines[activeLang] || [];
            const hasOverlay = (shot.overlays?.length ?? 0) > 0;
            const tr = idx > 0 ? shot.transitionIn : undefined;

            const trimStartPct = Math.min(95, ((shot.trimStart || 0) / Math.max(0.5, srcDur)) * 100);
            const trimWidthPct = Math.max(
              6,
              Math.min(100 - trimStartPct, (m.durationSec / Math.max(0.5, srcDur)) * 100)
            );
            const trimEndSec = Math.min(srcDur, (shot.trimStart || 0) + m.durationSec);

            return (
              <div
                key={shot.id}
                className="vts-shot-col"
                style={{ width: colWidth }}
              >
                {idx > 0 && tr && tr.type !== "none" && (
                  <div
                    className={`vts-transition-pill${tr.spark ? " has-spark" : ""}`}
                    title={`${tr.type} ${tr.duration.toFixed(2)}s${tr.spark ? " + искры" : ""}`}
                  >
                    {tr.spark ? <Sparkles size={10} /> : "~"}
                  </div>
                )}

                {/* Lane 1: Video Shot Card */}
                <div
                  className={`vts-shot-card${isShotSelected ? " is-selected" : ""}${
                    m.isDynamic ? " is-dynamic" : ""
                  }`}
                  onClick={() => onSelectShot(shot.id)}
                >
                  {canTrimOnTimeline && (
                    <>
                      <div
                        className="vts-trim-handle vts-trim-handle--left"
                        onMouseDown={(e) =>
                          startShotTrimDrag(e, shot, "left", srcDur, colWidth)
                        }
                        onClick={(e) => e.stopPropagation()}
                        title={tAdmin(
                          adminLang,
                          "Подрезать начало клипа (trimStart)",
                          "Підрізати початок кліпу (trimStart)"
                        )}
                      />
                      <div
                        className="vts-trim-handle vts-trim-handle--right"
                        onMouseDown={(e) =>
                          startShotTrimDrag(e, shot, "right", srcDur, colWidth)
                        }
                        onClick={(e) => e.stopPropagation()}
                        title={tAdmin(
                          adminLang,
                          "Подрезать конец клипа (длительность)",
                          "Підрізати кінець кліпу (тривалість)"
                        )}
                      />
                    </>
                  )}

                  {elasticPercent > 0 && (
                    <div
                      className="vts-shot-elastic-zone"
                      style={{ width: `${elasticPercent}%` }}
                      title={tAdmin(
                        adminLang,
                        `Эластичная зона: ${m.minDurSec.toFixed(1)}–${m.maxDurSec.toFixed(1)}s`,
                        `Еластична зона: ${m.minDurSec.toFixed(1)}–${m.maxDurSec.toFixed(1)}s`
                      )}
                    />
                  )}

                  <div className="vts-shot-top">
                    <span className="vts-shot-key">
                      {shot.key}
                      {m.isDynamic && (
                        <Zap
                          size={11}
                          style={{
                            display: "inline",
                            marginLeft: 3,
                            color: "#d97706",
                            verticalAlign: "-1px",
                          }}
                        />
                      )}
                      {hasOverlay && (
                        <ImageIcon
                          size={11}
                          style={{
                            display: "inline",
                            marginLeft: 3,
                            color: "#0ea5e9",
                            verticalAlign: "-1px",
                          }}
                        />
                      )}
                      {m.isOverflow && (
                        <AlertTriangle
                          size={11}
                          style={{
                            display: "inline",
                            marginLeft: 3,
                            color: "#ef4444",
                            verticalAlign: "-1px",
                          }}
                        />
                      )}
                    </span>

                    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: 10.5, fontFamily: "monospace", opacity: 0.85 }}>
                        {m.durationSec.toFixed(1)}s
                      </span>
                      {isShotSelected && (
                        <>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveShot(idx, -1);
                            }}
                            style={{
                              border: "none",
                              background: "transparent",
                              cursor: idx === 0 ? "default" : "pointer",
                              opacity: idx === 0 ? 0.25 : 0.8,
                              padding: 0,
                              color: "inherit",
                            }}
                            title="Move left"
                          >
                            <ChevronLeft size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === shots.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveShot(idx, 1);
                            }}
                            style={{
                              border: "none",
                              background: "transparent",
                              cursor: idx === shots.length - 1 ? "default" : "pointer",
                              opacity: idx === shots.length - 1 ? 0.25 : 0.8,
                              padding: 0,
                              color: "inherit",
                            }}
                            title="Move right"
                          >
                            <ChevronRight size={12} />
                          </button>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="vts-shot-meta">
                    {shot.label || (shot.videoAssetId ? `Asset #${shot.videoAssetId}` : "—")}
                  </div>

                  {/* Interactive Source Slip Bar for fixed-duration shots */}
                  {canTrimOnTimeline && (
                    <div
                      className="vts-slip-track"
                      onClick={(e) => e.stopPropagation()}
                      title={tAdmin(
                        adminLang,
                        `Отрезок ${(shot.trimStart || 0).toFixed(2)}–${trimEndSec.toFixed(2)}s из ${srcDur.toFixed(1)}s — тяните жёлтую полосу для сдвига окна`,
                        `Відрізок ${(shot.trimStart || 0).toFixed(2)}–${trimEndSec.toFixed(2)}s із ${srcDur.toFixed(1)}s — тягніть жовту смугу для зсуву вікна`
                      )}
                    >
                      <div
                        className="vts-slip-window"
                        style={{
                          left: `${trimStartPct}%`,
                          width: `${trimWidthPct}%`,
                        }}
                        onMouseDown={(e) =>
                          startShotTrimDrag(e, shot, "slip", srcDur, colWidth - 20)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {activeTrimInfo?.shotId === shot.id && (
                    <div className="vts-trim-badge">{activeTrimInfo.label}</div>
                  )}
                </div>

                {/* Lane 2: Voice Lines anchored to this shot */}
                <div
                  className="vts-voice-track"
                  onClick={() => onSelectShot(shot.id)}
                >
                  {lines.map((vl) => {
                    const live = liveAudioMap[`${activeLang}:${vl.id}`];
                    const aAsset = vl.audioAssetId
                      ? assetMap[Number(vl.audioAssetId)]
                      : undefined;
                    const vDur = estimateVoiceLineDuration(
                      vl,
                      live?.durationSec,
                      aAsset?.durationSec ?? undefined
                    );
                    const leftPct = Math.min(95, (vl.offsetSec / Math.max(0.2, displaySec)) * 100);
                    const widthPct = Math.max(
                      12,
                      Math.min(100 - leftPct, (vDur / Math.max(0.2, displaySec)) * 100)
                    );
                    const overflow = vl.offsetSec + vDur > m.maxDurSec + 0.15;
                    const isSelected = isShotSelected && vl.id === selectedVoiceLineId;

                    return (
                      <div
                        key={vl.id}
                        className={`vts-voice-block ${
                          vl.mode === "dynamic" ? "is-dynamic" : "is-static"
                        }${isSelected ? " is-selected" : ""}${overflow ? " is-overflow" : ""}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        onMouseDown={(e) =>
                          startVoiceDrag(e, shot, vl, colWidth, displaySec)
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectVoiceLine(shot.id, vl.id);
                        }}
                        title={`${vl.label || vl.id} | +${vl.offsetSec.toFixed(2)}s | ~${vDur.toFixed(2)}s`}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                          {vl.label || vl.id}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lane 3: Master BGM / Ambient Strip */}
        <div className="vts-lane-row" style={{ marginTop: 2 }}>
          <div className="vts-lane-label">
            <Music size={12} style={{ marginRight: 4 }} /> BGM
          </div>
          <div className="vts-bgm-bar">{bgmSummary}</div>
        </div>
      </div>
    </div>
  );
}
