"use client";

import React, { useEffect, useState } from "react";
import {
  Film,
  Loader2,
  Mic,
  Plus,
  Trash2,
  Volume2,
} from "lucide-react";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";
import type {
  VideoOverlayConfig,
  VideoShotConfig,
  VoiceLineConfig,
} from "@/lib/video/template-schema";
import { buildTemplateVars, interpolateVideoText } from "@/lib/video/template-vars";
import type { Lang } from "@/lib/types";
import type {
  DynamicPreviewAudioEntry,
  PipelineAssetSummary,
  SimulatedShotMetrics,
} from "./types";

interface ShotInspectorProps {
  shot: VideoShotConfig | null;
  shotIndex: number;
  metrics: SimulatedShotMetrics | null;
  activeLang: Lang;
  selectedVoiceLineId: string | null;
  availableVars: string[];
  sampleFields: Record<string, string>;
  assetMap: Record<number, PipelineAssetSummary>;
  liveAudioMap: Record<string, DynamicPreviewAudioEntry>;
  onUpdateShot: (next: VideoShotConfig) => void;
  onDeleteShot: () => void;
  onSelectVoiceLine: (lineId: string) => void;
  onOpenAssetPicker: (
    kind: "video" | "voice_static",
    currentId: number | null | undefined,
    onPicked: (asset: PipelineAssetSummary) => void
  ) => void;
  onSynthesizeStaticLine: (vl: VoiceLineConfig) => Promise<void>;
  onAuditionDynamicLine: (vl: VoiceLineConfig) => Promise<void>;
  ttsBusyLineId: string | null;
  voiceFocusNonce?: number;
}

export function ShotInspector({
  shot,
  shotIndex,
  metrics,
  activeLang,
  selectedVoiceLineId,
  availableVars,
  sampleFields,
  assetMap,
  liveAudioMap,
  onUpdateShot,
  onDeleteShot,
  onSelectVoiceLine,
  onOpenAssetPicker,
  onSynthesizeStaticLine,
  onAuditionDynamicLine,
  ttsBusyLineId,
  voiceFocusNonce,
}: ShotInspectorProps) {
  const adminLang = useAdminLang();
  const [subTab, setSubTab] = useState<"shot" | "voice" | "overlay">("shot");

  useEffect(() => {
    if (voiceFocusNonce && voiceFocusNonce > 0) {
      setSubTab("voice");
    }
  }, [voiceFocusNonce]);

  if (!shot) {
    return (
      <div className="vts-panel" style={{ minHeight: 280, justifyContent: "center", alignItems: "center" }}>
        <span style={{ color: "var(--theme-elevation-500)" }}>
          {tAdmin(adminLang, "Выберите или добавьте шот на таймлайне", "Оберіть або додайте шот на таймлайні")}
        </span>
      </div>
    );
  }

  const videoAsset = shot.videoAssetId ? assetMap[Number(shot.videoAssetId)] : undefined;
  const lines = shot.voiceLines[activeLang] || [];
  const activeVl =
    lines.find((l) => l.id === selectedVoiceLineId) || lines[0] || null;
  const overlay = shot.overlays?.[0] ?? null;

  const vars = buildTemplateVars({ lang: activeLang, fields: sampleFields });

  function updateVoiceLine(lineId: string, patch: Partial<VoiceLineConfig>) {
    const nextLangLines = lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l));
    onUpdateShot({
      ...shot!,
      voiceLines: {
        ...shot!.voiceLines,
        [activeLang]: nextLangLines,
      },
    });
  }

  function addVoiceLine() {
    const newId = `line_${shot!.key}_${Date.now().toString(36).slice(-4)}`;
    const nextLine: VoiceLineConfig = {
      id: newId,
      label: tAdmin(adminLang, "Новая реплика", "Нова репліка"),
      mode: "static",
      offsetSec: 0.3,
      text: "",
      trimSilenceEnd: true,
      atempo: 1.0,
      volume: 1.25,
    };
    onUpdateShot({
      ...shot!,
      voiceLines: {
        ...shot!.voiceLines,
        [activeLang]: [...lines, nextLine],
      },
    });
    onSelectVoiceLine(newId);
    setSubTab("voice");
  }

  function deleteVoiceLine(lineId: string) {
    onUpdateShot({
      ...shot!,
      voiceLines: {
        ...shot!.voiceLines,
        [activeLang]: lines.filter((l) => l.id !== lineId),
      },
    });
  }

  function updateOverlay(nextOverlay: VideoOverlayConfig | null) {
    onUpdateShot({
      ...shot!,
      overlays: nextOverlay ? [nextOverlay] : [],
    });
  }

  return (
    <div className="vts-panel">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div className="vts-inspector-tabs" style={{ borderBottom: "none", paddingBottom: 0 }}>
          <button
            type="button"
            className={subTab === "shot" ? "is-active" : ""}
            onClick={() => setSubTab("shot")}
          >
            {tAdmin(adminLang, "Шот", "Шот")}
          </button>
          <button
            type="button"
            className={subTab === "voice" ? "is-active" : ""}
            onClick={() => setSubTab("voice")}
          >
            {tAdmin(adminLang, "Озвучка", "Озвучка")} ({lines.length})
          </button>
          <button
            type="button"
            className={subTab === "overlay" ? "is-active" : ""}
            onClick={() => setSubTab("overlay")}
          >
            {tAdmin(adminLang, "Оверлей", "Оверлей")} {overlay ? "•" : ""}
          </button>
        </div>

        <button
          type="button"
          className="vts-btn vts-btn--danger vts-btn--sm"
          onClick={onDeleteShot}
          title={tAdmin(adminLang, "Удалить шот", "Видалити шот")}
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div style={{ borderTop: "1px solid var(--theme-elevation-150)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* ── TAB 1: SHOT SETTINGS ── */}
        {subTab === "shot" && (
          <>
            <div className="vts-grid-2">
              <div className="vts-field">
                <label>{tAdmin(adminLang, "Ключ шота", "Ключ шоту")}</label>
                <input
                  className="vts-input"
                  value={shot.key}
                  onChange={(e) => onUpdateShot({ ...shot, key: e.target.value.trim() || shot.key })}
                />
              </div>
              <div className="vts-field">
                <label>{tAdmin(adminLang, "Название", "Назва")}</label>
                <input
                  className="vts-input"
                  value={shot.label || ""}
                  onChange={(e) => onUpdateShot({ ...shot, label: e.target.value })}
                />
              </div>
            </div>

            <div className="vts-field">
              <label>{tAdmin(adminLang, "Видеоклип (PipelineAssets)", "Відеокліп (PipelineAssets)")}</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div
                  className="vts-input"
                  style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {videoAsset
                    ? `#${videoAsset.id} ${videoAsset.label} (${videoAsset.durationSec?.toFixed(2) ?? "?"}s)`
                    : shot.videoAssetId
                    ? `Asset #${shot.videoAssetId}`
                    : tAdmin(adminLang, "Не выбран", "Не обрано")}
                </div>
                <button
                  type="button"
                  className="vts-btn vts-btn--sm"
                  onClick={() =>
                    onOpenAssetPicker("video", Number(shot.videoAssetId) || null, (asset) => {
                      onUpdateShot({
                        ...shot,
                        videoAssetId: asset.id,
                        sourceDurationSec: asset.durationSec ?? shot.sourceDurationSec,
                      });
                    })
                  }
                >
                  <Film size={13} /> {tAdmin(adminLang, "Выбрать", "Обрати")}
                </button>
              </div>
            </div>

            <div className="vts-grid-3">
              <div className="vts-field">
                <label>{tAdmin(adminLang, "Режим длины", "Режим довжини")}</label>
                <select
                  className="vts-select"
                  value={shot.durationMode}
                  onChange={(e) => {
                    const mode = e.target.value === "fit_to_speech" ? "fit_to_speech" : "fixed";
                    onUpdateShot({
                      ...shot,
                      durationMode: mode,
                      fitToSpeech:
                        mode === "fit_to_speech"
                          ? shot.fitToSpeech || {
                              minDur: 2.5,
                              maxDur: metrics?.sourceAvailableSec ?? 7.5,
                              padAfterSpeech: 0.2,
                              overflowStrategy: "clamp",
                            }
                          : shot.fitToSpeech,
                    });
                  }}
                >
                  <option value="fixed">{tAdmin(adminLang, "Фиксированная", "Фіксована")}</option>
                  <option value="fit_to_speech">{tAdmin(adminLang, "Под речь (динамич.)", "Під мову (динаміч.)")}</option>
                </select>
              </div>

              <div className="vts-field">
                <label>Trim Start (s)</label>
                <input
                  type="number"
                  step={0.05}
                  min={0}
                  className="vts-input"
                  value={shot.trimStart}
                  onChange={(e) =>
                    onUpdateShot({ ...shot, trimStart: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </div>

              {shot.durationMode === "fixed" ? (
                <div className="vts-field">
                  <label>{tAdmin(adminLang, "Длительность (s)", "Тривалість (s)")}</label>
                  <input
                    type="number"
                    step={0.05}
                    min={0.2}
                    className="vts-input"
                    value={shot.fixedDuration ?? metrics?.durationSec ?? 4}
                    onChange={(e) =>
                      onUpdateShot({
                        ...shot,
                        fixedDuration: Math.max(0.2, Number(e.target.value) || 1),
                      })
                    }
                  />
                </div>
              ) : (
                <div className="vts-field">
                  <label>{tAdmin(adminLang, "Переполнение", "Переповнення")}</label>
                  <select
                    className="vts-select"
                    value={shot.fitToSpeech?.overflowStrategy || "clamp"}
                    onChange={(e) =>
                      onUpdateShot({
                        ...shot,
                        fitToSpeech: {
                          minDur: shot.fitToSpeech?.minDur ?? 2.5,
                          maxDur: shot.fitToSpeech?.maxDur ?? 8.0,
                          padAfterSpeech: shot.fitToSpeech?.padAfterSpeech ?? 0.2,
                          ...shot.fitToSpeech,
                          overflowStrategy: e.target.value === "slow_video" ? "slow_video" : "clamp",
                        },
                      })
                    }
                  >
                    <option value="clamp">{tAdmin(adminLang, "Обрезать по макс.", "Обрізати по макс.")}</option>
                    <option value="slow_video">{tAdmin(adminLang, "Замедлить клип (до 1.35x)", "Сповільнити кліп (до 1.35x)")}</option>
                  </select>
                </div>
              )}
            </div>

            {shot.durationMode === "fit_to_speech" && (
              <div className="vts-grid-3">
                <div className="vts-field">
                  <label>Min (s)</label>
                  <input
                    type="number"
                    step={0.1}
                    className="vts-input"
                    value={shot.fitToSpeech?.minDur ?? 2.5}
                    onChange={(e) =>
                      onUpdateShot({
                        ...shot,
                        fitToSpeech: {
                          maxDur: 8,
                          padAfterSpeech: 0.2,
                          overflowStrategy: "clamp",
                          ...shot.fitToSpeech,
                          minDur: Number(e.target.value) || 2,
                        },
                      })
                    }
                  />
                </div>
                <div className="vts-field">
                  <label>Max (s)</label>
                  <input
                    type="number"
                    step={0.1}
                    className="vts-input"
                    value={shot.fitToSpeech?.maxDur ?? 8.0}
                    onChange={(e) =>
                      onUpdateShot({
                        ...shot,
                        fitToSpeech: {
                          minDur: 2.5,
                          padAfterSpeech: 0.2,
                          overflowStrategy: "clamp",
                          ...shot.fitToSpeech,
                          maxDur: Number(e.target.value) || 8,
                        },
                      })
                    }
                  />
                </div>
                <div className="vts-field">
                  <label>Pad after speech (s)</label>
                  <input
                    type="number"
                    step={0.05}
                    className="vts-input"
                    value={shot.fitToSpeech?.padAfterSpeech ?? 0.2}
                    onChange={(e) =>
                      onUpdateShot({
                        ...shot,
                        fitToSpeech: {
                          minDur: 2.5,
                          maxDur: 8,
                          overflowStrategy: "clamp",
                          ...shot.fitToSpeech,
                          padAfterSpeech: Number(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="vts-grid-3">
              <div className="vts-field">
                <label>{tAdmin(adminLang, "Звук клипа (0..1)", "Звук кліпу (0..1)")}</label>
                <input
                  type="number"
                  step={0.05}
                  min={0}
                  max={1.5}
                  className="vts-input"
                  value={shot.keepClipAudioVolume}
                  onChange={(e) =>
                    onUpdateShot({
                      ...shot,
                      keepClipAudioVolume: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </div>

              {shotIndex > 0 && (
                <>
                  <div className="vts-field">
                    <label>{tAdmin(adminLang, "Входной переход (s)", "Вхідний перехід (s)")}</label>
                    <input
                      type="number"
                      step={0.05}
                      min={0}
                      max={2}
                      className="vts-input"
                      value={shot.transitionIn?.duration ?? 0.25}
                      onChange={(e) =>
                        onUpdateShot({
                          ...shot,
                          transitionIn: {
                            type: "fade",
                            spark: false,
                            ...shot.transitionIn,
                            duration: Math.max(0, Number(e.target.value) || 0),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="vts-field" style={{ justifyContent: "flex-end" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", paddingBottom: 7 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(shot.transitionIn?.spark)}
                        onChange={(e) =>
                          onUpdateShot({
                            ...shot,
                            transitionIn: {
                              type: "fade",
                              duration: 0.35,
                              ...shot.transitionIn,
                              spark: e.target.checked,
                            },
                          })
                        }
                      />
                      {tAdmin(adminLang, "Золотые искры ✦", "Золоті іскри ✦")}
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* Collapsible Speed Segments */}
            <details>
              <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--theme-elevation-600)" }}>
                {tAdmin(adminLang, "Сегменты скорости (Speed Ramps)", "Сегменти швидкості (Speed Ramps)")}{" "}
                ({shot.speedSegments?.length || 0})
              </summary>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {(shot.speedSegments || []).map((seg, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 6 }}>
                    <input
                      type="number"
                      step={0.05}
                      className="vts-input"
                      value={seg.start}
                      placeholder="start"
                      onChange={(e) => {
                        const next = [...(shot.speedSegments || [])];
                        next[i] = { ...seg, start: Number(e.target.value) || 0 };
                        onUpdateShot({ ...shot, speedSegments: next });
                      }}
                    />
                    <input
                      type="number"
                      step={0.05}
                      className="vts-input"
                      value={seg.end}
                      placeholder="end"
                      onChange={(e) => {
                        const next = [...(shot.speedSegments || [])];
                        next[i] = { ...seg, end: Number(e.target.value) || 0 };
                        onUpdateShot({ ...shot, speedSegments: next });
                      }}
                    />
                    <input
                      type="number"
                      step={0.02}
                      className="vts-input"
                      value={seg.factor}
                      placeholder="1.14"
                      onChange={(e) => {
                        const next = [...(shot.speedSegments || [])];
                        next[i] = { ...seg, factor: Number(e.target.value) || 1 };
                        onUpdateShot({ ...shot, speedSegments: next });
                      }}
                    />
                    <button
                      type="button"
                      className="vts-btn vts-btn--danger vts-btn--sm"
                      onClick={() => {
                        const next = (shot.speedSegments || []).filter((_, idx) => idx !== i);
                        onUpdateShot({ ...shot, speedSegments: next.length ? next : undefined });
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="vts-btn vts-btn--sm"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => {
                    const prev = shot.speedSegments || [];
                    const lastEnd = prev.length > 0 ? prev[prev.length - 1].end : 0;
                    onUpdateShot({
                      ...shot,
                      speedSegments: [...prev, { start: lastEnd, end: Math.min(7.93, lastEnd + 3), factor: 1.0 }],
                    });
                  }}
                >
                  <Plus size={12} /> {tAdmin(adminLang, "Добавить сегмент", "Додати сегмент")}
                </button>
              </div>
            </details>
          </>
        )}

        {/* ── TAB 2: VOICE LINES ── */}
        {subTab === "voice" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {lines.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={`vts-btn vts-btn--sm${activeVl?.id === l.id ? " vts-btn--primary" : ""}`}
                    onClick={() => onSelectVoiceLine(l.id)}
                  >
                    {l.mode === "dynamic" ? "⚡ " : ""}
                    {l.label || l.id}
                  </button>
                ))}
              </div>
              <button type="button" className="vts-btn vts-btn--sm" onClick={addVoiceLine}>
                <Plus size={12} /> {tAdmin(adminLang, "Реплика", "Репліка")} ({activeLang.toUpperCase()})
              </button>
            </div>

            {activeVl ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <div className="vts-grid-3">
                  <div className="vts-field">
                    <label>{tAdmin(adminLang, "Режим", "Режим")}</label>
                    <select
                      className="vts-select"
                      value={activeVl.mode}
                      onChange={(e) =>
                        updateVoiceLine(activeVl.id, {
                          mode: e.target.value === "dynamic" ? "dynamic" : "static",
                        })
                      }
                    >
                      <option value="static">{tAdmin(adminLang, "Статичная (кэш MP3)", "Статична (кеш MP3)")}</option>
                      <option value="dynamic">{tAdmin(adminLang, "Динамическая (TTS на заказ)", "Динамічна (TTS на замовлення)")}</option>
                    </select>
                  </div>
                  <div className="vts-field">
                    <label>Offset (s)</label>
                    <input
                      type="number"
                      step={0.02}
                      min={0}
                      className="vts-input"
                      value={activeVl.offsetSec}
                      onChange={(e) =>
                        updateVoiceLine(activeVl.id, {
                          offsetSec: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                  <div className="vts-field">
                    <label>Tempo (atempo)</label>
                    <input
                      type="number"
                      step={0.01}
                      min={0.6}
                      max={1.5}
                      className="vts-input"
                      value={activeVl.atempo}
                      onChange={(e) =>
                        updateVoiceLine(activeVl.id, {
                          atempo: Math.max(0.6, Math.min(1.5, Number(e.target.value) || 1)),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="vts-field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>
                      {tAdmin(adminLang, "Текст реплики", "Текст репліки")} ({activeLang.toUpperCase()})
                    </label>
                    <button
                      type="button"
                      className="vts-btn vts-btn--danger vts-btn--sm"
                      onClick={() => deleteVoiceLine(activeVl.id)}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <textarea
                    className="vts-textarea"
                    value={activeVl.text}
                    onChange={(e) => updateVoiceLine(activeVl.id, { text: e.target.value })}
                  />
                  {activeVl.mode === "dynamic" && (
                    <div className="vts-chips">
                      {availableVars.map((token) => (
                        <button
                          key={token}
                          type="button"
                          className="vts-chip"
                          onClick={() =>
                            updateVoiceLine(activeVl.id, {
                              text: `${activeVl.text}${activeVl.text.endsWith(" ") || !activeVl.text ? "" : " "}${token}`,
                            })
                          }
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {activeVl.mode === "dynamic" && (
                  <div
                    style={{
                      padding: "7px 9px",
                      borderRadius: 6,
                      background: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      fontSize: 12,
                    }}
                  >
                    <strong>{tAdmin(adminLang, "На тесте прозвучит:", "На тесті прозвучить:")}</strong>{" "}
                    {interpolateVideoText(activeVl.text, vars) || "—"}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {activeVl.mode === "static" ? (
                    <>
                      <button
                        type="button"
                        className="vts-btn vts-btn--primary vts-btn--sm"
                        disabled={ttsBusyLineId === activeVl.id || !activeVl.text.trim()}
                        onClick={() => void onSynthesizeStaticLine(activeVl)}
                      >
                        {ttsBusyLineId === activeVl.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Mic size={13} />
                        )}
                        {tAdmin(adminLang, "Озвучить в ElevenLabs", "Озвучити в ElevenLabs")}
                      </button>
                      <button
                        type="button"
                        className="vts-btn vts-btn--sm"
                        onClick={() =>
                          onOpenAssetPicker(
                            "voice_static",
                            Number(activeVl.audioAssetId) || null,
                            (asset) =>
                              updateVoiceLine(activeVl.id, {
                                audioAssetId: asset.id,
                                sampleDurationSec: asset.durationSec ?? activeVl.sampleDurationSec,
                              })
                          )
                        }
                      >
                        {tAdmin(adminLang, "Выбрать MP3", "Обрати MP3")}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="vts-btn vts-btn--amber vts-btn--sm"
                      disabled={ttsBusyLineId === activeVl.id || !activeVl.text.trim()}
                      onClick={() => void onAuditionDynamicLine(activeVl)}
                    >
                      {ttsBusyLineId === activeVl.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Volume2 size={13} />
                      )}
                      {tAdmin(adminLang, "Тест-прослушивание (ElevenLabs)", "Тест-прослуховування (ElevenLabs)")}
                    </button>
                  )}

                  {activeVl.sampleDurationSec ? (
                    <span
                      className={`vts-badge${
                        metrics && activeVl.offsetSec + activeVl.sampleDurationSec > metrics.maxDurSec + 0.15
                          ? " vts-badge--warn"
                          : " vts-badge--ok"
                      }`}
                    >
                      ~{activeVl.sampleDurationSec.toFixed(2)}s
                      {metrics ? ` / max ${metrics.maxDurSec.toFixed(1)}s` : ""}
                    </span>
                  ) : null}
                </div>

                {/* Inline audio preview player */}
                {(() => {
                  const live = liveAudioMap[`${activeLang}:${activeVl.id}`];
                  const srcUrl =
                    activeVl.mode === "dynamic" && live?.blobUrl
                      ? live.blobUrl
                      : activeVl.audioAssetId
                      ? `/api/admin/pipeline-assets/${activeVl.audioAssetId}/stream`
                      : null;
                  return srcUrl ? (
                    <audio key={srcUrl} src={srcUrl} controls style={{ width: "100%", height: 32 }} />
                  ) : null;
                })()}

                <div className="vts-grid-3">
                  <div className="vts-field">
                    <label>Volume</label>
                    <input
                      type="number"
                      step={0.05}
                      min={0}
                      max={2.5}
                      className="vts-input"
                      value={activeVl.volume}
                      onChange={(e) =>
                        updateVoiceLine(activeVl.id, { volume: Number(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="vts-field">
                    <label>AutoFit Max Tempo</label>
                    <input
                      type="number"
                      step={0.02}
                      min={1}
                      max={1.4}
                      placeholder="1.16"
                      className="vts-input"
                      value={activeVl.autoFitMaxTempo ?? ""}
                      onChange={(e) =>
                        updateVoiceLine(activeVl.id, {
                          autoFitMaxTempo: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="vts-field">
                    <label>AutoFit Target (s)</label>
                    <input
                      type="number"
                      step={0.1}
                      min={1}
                      placeholder="6.35"
                      className="vts-input"
                      value={activeVl.autoFitTargetSec ?? ""}
                      onChange={(e) =>
                        updateVoiceLine(activeVl.id, {
                          autoFitTargetSec: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--theme-elevation-500)", padding: "8px 0" }}>
                {tAdmin(adminLang, "На этом шоте пока нет реплик. Нажмите «+ Реплика» выше.", "На цьому шоті поки немає реплік. Натисніть «+ Репліка» вище.")}
              </div>
            )}
          </>
        )}

        {/* ── TAB 3: PHOTO + CAPTION OVERLAY ── */}
        {subTab === "overlay" && (
          <>
            {!overlay ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, color: "var(--theme-elevation-500)" }}>
                  {tAdmin(
                    adminLang,
                    "На этот шот можно наложить фото ребёнка и подпись прямо поверх кадра (координаты настраиваются мышкой на видео слева).",
                    "На цей шот можна накласти фото дитини та підпис прямо поверх кадру (координати налаштовуються мишкою на відео ліворуч)."
                  )}
                </div>
                <button
                  type="button"
                  className="vts-btn vts-btn--primary vts-btn--sm"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() =>
                    updateOverlay({
                      id: `overlay_${shot.key}`,
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
                    })
                  }
                >
                  <Plus size={13} /> {tAdmin(adminLang, "Включить оверлей фото/подписи", "Увімкнути оверлей фото/підпису")}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="vts-badge">ID: {overlay.id}</span>
                  <button
                    type="button"
                    className="vts-btn vts-btn--danger vts-btn--sm"
                    onClick={() => updateOverlay(null)}
                  >
                    <Trash2 size={12} /> {tAdmin(adminLang, "Убрать оверлей", "Прибрати оверлей")}
                  </button>
                </div>

                <div className="vts-grid-2">
                  <div className="vts-field">
                    <label>{tAdmin(adminLang, "Поле фото (fieldKey)", "Поле фото (fieldKey)")}</label>
                    <input
                      className="vts-input"
                      value={overlay.photoFieldKey}
                      onChange={(e) => updateOverlay({ ...overlay, photoFieldKey: e.target.value.trim() })}
                    />
                  </div>
                  <div className="vts-field">
                    <label>{tAdmin(adminLang, "Поле подписи (опц.)", "Поле підпису (опц.)")}</label>
                    <input
                      className="vts-input"
                      value={overlay.captionFieldKey || ""}
                      onChange={(e) =>
                        updateOverlay({ ...overlay, captionFieldKey: e.target.value.trim() || undefined })
                      }
                    />
                  </div>
                </div>

                <div className="vts-grid-3">
                  <div className="vts-field">
                    <label>{tAdmin(adminLang, "Стиль рамки", "Стиль рамки")}</label>
                    <select
                      className="vts-select"
                      value={overlay.framePreset}
                      onChange={(e) =>
                        updateOverlay({
                          ...overlay,
                          framePreset: e.target.value as VideoOverlayConfig["framePreset"],
                        })
                      }
                    >
                      <option value="antique_book">Старинная книга</option>
                      <option value="polaroid">Полароид</option>
                      <option value="gold_frame">Золотая рамка</option>
                      <option value="none">Без рамки</option>
                    </select>
                  </div>
                  <div className="vts-field">
                    <label>Rotation (°)</label>
                    <input
                      type="number"
                      step={1}
                      min={-45}
                      max={45}
                      className="vts-input"
                      value={overlay.rotation ?? 0}
                      onChange={(e) =>
                        updateOverlay({ ...overlay, rotation: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="vts-field" style={{ justifyContent: "flex-end" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", paddingBottom: 7 }}>
                      <input
                        type="checkbox"
                        checked={overlay.warmTint}
                        onChange={(e) => updateOverlay({ ...overlay, warmTint: e.target.checked })}
                      />
                      Warm Tint
                    </label>
                  </div>
                </div>

                <div className="vts-grid-3">
                  <div className="vts-field">
                    <label>Center X (1280)</label>
                    <input
                      type="number"
                      className="vts-input"
                      value={overlay.cx}
                      onChange={(e) => updateOverlay({ ...overlay, cx: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="vts-field">
                    <label>Center Y (720)</label>
                    <input
                      type="number"
                      className="vts-input"
                      value={overlay.cy}
                      onChange={(e) => updateOverlay({ ...overlay, cy: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="vts-field">
                    <label>Radius (px)</label>
                    <input
                      type="number"
                      className="vts-input"
                      value={overlay.borderRadius}
                      onChange={(e) =>
                        updateOverlay({ ...overlay, borderRadius: Math.max(0, Number(e.target.value) || 0) })
                      }
                    />
                  </div>
                </div>

                <div className="vts-grid-3">
                  <div className="vts-field">
                    <label>Width (px)</label>
                    <input
                      type="number"
                      className="vts-input"
                      value={overlay.width}
                      onChange={(e) =>
                        updateOverlay({ ...overlay, width: Math.max(32, Number(e.target.value) || 100) })
                      }
                    />
                  </div>
                  <div className="vts-field">
                    <label>Height (px)</label>
                    <input
                      type="number"
                      className="vts-input"
                      value={overlay.height}
                      onChange={(e) =>
                        updateOverlay({ ...overlay, height: Math.max(32, Number(e.target.value) || 100) })
                      }
                    />
                  </div>
                  <div className="vts-field">
                    <label>Caption Color</label>
                    <input
                      type="color"
                      className="vts-input"
                      style={{ height: 32, padding: 2 }}
                      value={overlay.caption?.color || "#442610"}
                      onChange={(e) =>
                        updateOverlay({
                          ...overlay,
                          caption: {
                            offsetY: 18,
                            maxWidth: 275,
                            maxFontSize: 58,
                            minFontSize: 34,
                            underline: true,
                            ...overlay.caption,
                            color: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
