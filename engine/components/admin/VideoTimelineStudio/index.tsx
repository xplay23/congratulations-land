"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDocumentInfo, useField, useFormFields } from "@payloadcms/ui";
import { Film, Loader2, Play, Plus, X } from "lucide-react";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";
import {
  EMPTY_TIMELINE_CONFIG,
  type VideoOverlayConfig,
  type VideoShotConfig,
  type VideoTimelineConfig,
  type VoiceLineConfig,
} from "@/lib/video/template-schema";
import type { Lang } from "@/lib/types";
import { AssetPickerModal } from "./AssetPickerModal";
import { ShotInspector } from "./ShotInspector";
import { ShotPreviewPlayer } from "./ShotPreviewPlayer";
import { TimelineTracks } from "./TimelineTracks";
import {
  computeSimulatedShotMetrics,
  type DynamicPreviewAudioEntry,
  type PipelineAssetSummary,
  type SamplePresetKey,
  type SimulatedShotMetrics,
} from "./types";
import "./studio.css";

interface Props {
  path: string;
}

function normalizeTimeline(val: unknown): VideoTimelineConfig {
  if (!val || typeof val !== "object") return EMPTY_TIMELINE_CONFIG;
  const obj = val as Partial<VideoTimelineConfig>;
  return {
    schemaVersion: 1,
    samplePresets: {
      short: {
        uk: obj.samplePresets?.short?.uk || {},
        ru: obj.samplePresets?.short?.ru || {},
      },
      medium: {
        uk: obj.samplePresets?.medium?.uk || {},
        ru: obj.samplePresets?.medium?.ru || {},
      },
      max: {
        uk: obj.samplePresets?.max?.uk || {},
        ru: obj.samplePresets?.max?.ru || {},
      },
    },
    shots: Array.isArray(obj.shots) ? obj.shots : [],
  };
}

export function VideoTimelineStudio({ path }: Props) {
  const adminLang = useAdminLang();
  const { id: docId } = useDocumentInfo();
  const { value, setValue } = useField<VideoTimelineConfig>({ path });

  // Read sibling fields from the same Payload document for voice/audio/formFields context
  const siblingContext = useFormFields(([fields]) => {
    const voiceId = (fields.elevenLabsVoiceId?.value as string) || "";
    const modelId = (fields.elevenLabsModelId?.value as string) || "";
    const stability =
      typeof fields.stability?.value === "number" ? fields.stability.value : undefined;
    const similarityBoost =
      typeof fields.similarityBoost?.value === "number"
        ? fields.similarityBoost.value
        : undefined;
    const bgmVolume =
      typeof fields.bgmVolume?.value === "number" ? fields.bgmVolume.value : 0.38;
    const ambientMode = (fields.ambientMode?.value as string) || "none";
    const duckingPreset = (fields.duckingPreset?.value as string) || "standard";
    const slug = (fields.slug?.value as string) || "template";

    // Extract custom field keys from formFields blocks
    const fieldKeys: string[] = [];
    for (const [k, f] of Object.entries(fields)) {
      if (k.startsWith("formFields.") && k.endsWith(".fieldKey") && typeof f?.value === "string") {
        const key = f.value.trim();
        if (key) fieldKeys.push(key);
      }
      if (
        k.startsWith("formFields.") &&
        k.endsWith(".vocativeFieldKey") &&
        typeof f?.value === "string"
      ) {
        const key = f.value.trim();
        if (key) fieldKeys.push(key);
      }
    }

    return {
      voiceId,
      modelId,
      stability,
      similarityBoost,
      bgmVolume,
      ambientMode,
      duckingPreset,
      slug,
      fieldKeys: Array.from(new Set(fieldKeys)),
    };
  });

  const timeline = useMemo(() => normalizeTimeline(value), [value]);

  const [activeLang, setActiveLang] = useState<Lang>("uk");
  const [samplePreset, setSamplePreset] = useState<SamplePresetKey>("medium");
  const [selectedShotId, setSelectedShotId] = useState<string | null>(
    () => timeline.shots[0]?.id || null
  );
  const [selectedVoiceLineId, setSelectedVoiceLineId] = useState<string | null>(null);
  const [voiceFocusNonce, setVoiceFocusNonce] = useState(0);
  const [externalSeek, setExternalSeek] = useState<{
    shotId: string;
    sourceSec: number;
    nonce: number;
  } | null>(null);

  const [assets, setAssets] = useState<PipelineAssetSummary[]>([]);
  const [liveAudioMap, setLiveAudioMap] = useState<Record<string, DynamicPreviewAudioEntry>>({});
  const [ttsBusyLineId, setTtsBusyLineId] = useState<string | null>(null);
  const [studioStatus, setStudioStatus] = useState<string | null>(null);
  const [studioError, setStudioError] = useState<string | null>(null);

  // Asset Picker Modal state
  const [pickerState, setPickerState] = useState<{
    open: boolean;
    kind: "video" | "voice_static";
    currentId?: number | null;
    onPicked?: (asset: PipelineAssetSummary) => void;
  }>({ open: false, kind: "video" });

  // Server FFmpeg previews
  const [renderingShot, setRenderingShot] = useState(false);
  const [renderedShotUrls, setRenderedShotUrls] = useState<Record<string, string>>({});
  const [renderingFull, setRenderingFull] = useState(false);
  const [fullPreviewModal, setFullPreviewModal] = useState<{
    videoUrl: string;
    durationSec: number;
    buildSec: number;
    warnings: string[];
  } | null>(null);

  // Load PipelineAssets list once
  useEffect(() => {
    let active = true;
    fetch("/api/pipeline-assets?limit=200&sort=-updatedAt", {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((data: { docs?: PipelineAssetSummary[] }) => {
        if (!active) return;
        const docs = Array.isArray(data.docs)
          ? data.docs.map((d) => ({
              ...d,
              id: Number(d.id),
            }))
          : [];
        setAssets(docs);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Ensure valid selectedShotId
  useEffect(() => {
    if (timeline.shots.length === 0) {
      setSelectedShotId(null);
      return;
    }
    if (!selectedShotId || !timeline.shots.some((s) => s.id === selectedShotId)) {
      setSelectedShotId(timeline.shots[0].id);
    }
  }, [timeline.shots, selectedShotId]);

  const assetMap = useMemo(() => {
    const m: Record<number, PipelineAssetSummary> = {};
    for (const a of assets) m[a.id] = a;
    return m;
  }, [assets]);

  const metricsByShotId = useMemo(() => {
    const m: Record<string, SimulatedShotMetrics> = {};
    for (const shot of timeline.shots) {
      m[shot.id] = computeSimulatedShotMetrics(shot, activeLang, liveAudioMap, assetMap);
    }
    return m;
  }, [timeline.shots, activeLang, liveAudioMap, assetMap]);

  const totalEstimatedSec = useMemo(() => {
    let total = 0;
    timeline.shots.forEach((shot, i) => {
      const m = metricsByShotId[shot.id];
      const d = m?.durationSec ?? 4;
      const ov = i > 0 && shot.transitionIn && shot.transitionIn.type !== "none" ? shot.transitionIn.duration : 0;
      total += d - Math.min(d * 0.4, ov);
    });
    return Math.max(0, Math.round(total * 10) / 10);
  }, [timeline.shots, metricsByShotId]);

  const selectedShotIndex = timeline.shots.findIndex((s) => s.id === selectedShotId);
  const selectedShot = selectedShotIndex >= 0 ? timeline.shots[selectedShotIndex] : null;
  const selectedMetrics = selectedShot ? metricsByShotId[selectedShot.id] || null : null;

  const sampleFields = timeline.samplePresets[samplePreset]?.[activeLang] || {};

  const availableVars = useMemo(() => {
    const base = new Set<string>([
      "{voc}",
      "{childName}",
      "{agePrefix}",
      "{age}",
      "{achievement}",
      "{gender:молодец|умница}",
    ]);
    for (const k of siblingContext.fieldKeys) {
      base.add(`{${k}}`);
    }
    return Array.from(base);
  }, [siblingContext.fieldKeys]);

  function commitTimeline(next: VideoTimelineConfig) {
    setValue(next);
  }

  function updateShotAt(index: number, nextShot: VideoShotConfig) {
    const shots = [...timeline.shots];
    shots[index] = nextShot;
    commitTimeline({ ...timeline, shots });
  }

  function addShot() {
    const nextNum = timeline.shots.length + 1;
    const key = String(nextNum).padStart(2, "0");
    const newShot: VideoShotConfig = {
      id: `shot_${key}_${Date.now().toString(36).slice(-4)}`,
      key,
      label: tAdmin(adminLang, `Новый шот ${key}`, `Новий шот ${key}`),
      videoAssetId: null,
      trimStart: 0,
      durationMode: "fixed",
      fixedDuration: 4.0,
      keepClipAudioVolume: 0,
      transitionIn: timeline.shots.length > 0 ? { type: "fade", duration: 0.25, spark: false } : undefined,
      voiceLines: { uk: [], ru: [] },
    };
    commitTimeline({ ...timeline, shots: [...timeline.shots, newShot] });
    setSelectedShotId(newShot.id);
    setSelectedVoiceLineId(null);
  }

  function deleteSelectedShot() {
    if (!selectedShot) return;
    const shots = timeline.shots.filter((s) => s.id !== selectedShot.id);
    commitTimeline({ ...timeline, shots });
    setSelectedShotId(shots[0]?.id || null);
    setSelectedVoiceLineId(null);
  }

  function moveShot(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= timeline.shots.length) return;
    const shots = [...timeline.shots];
    const [moved] = shots.splice(index, 1);
    shots.splice(target, 0, moved);
    commitTimeline({ ...timeline, shots });
  }

  function handleChangeVoiceOffset(shotId: string, lineId: string, nextOffsetSec: number) {
    const idx = timeline.shots.findIndex((s) => s.id === shotId);
    if (idx < 0) return;
    const shot = timeline.shots[idx];
    const nextLines = (shot.voiceLines[activeLang] || []).map((l) =>
      l.id === lineId ? { ...l, offsetSec: nextOffsetSec } : l
    );
    updateShotAt(idx, {
      ...shot,
      voiceLines: { ...shot.voiceLines, [activeLang]: nextLines },
    });
  }

  function handleTrimShot(shotId: string, trimStart: number, fixedDuration: number) {
    const idx = timeline.shots.findIndex((s) => s.id === shotId);
    if (idx < 0) return;
    const shot = timeline.shots[idx];
    updateShotAt(idx, {
      ...shot,
      trimStart,
      fixedDuration,
    });
  }

  function handleNudgeVoiceLine(lineId: string, deltaSec: number) {
    if (!selectedShot || selectedShotIndex < 0) return;
    const vl = (selectedShot.voiceLines[activeLang] || []).find((l) => l.id === lineId);
    if (!vl) return;
    const nextOffset = Math.max(0, Math.round((vl.offsetSec + deltaSec) * 100) / 100);
    handleChangeVoiceOffset(selectedShot.id, lineId, nextOffset);
  }

  function handleUpdateOverlay(nextOverlay: VideoOverlayConfig) {
    if (!selectedShot || selectedShotIndex < 0) return;
    updateShotAt(selectedShotIndex, {
      ...selectedShot,
      overlays: [nextOverlay],
    });
  }

  async function handleSynthesizeStaticLine(vl: VoiceLineConfig) {
    if (!selectedShot || selectedShotIndex < 0) return;
    setTtsBusyLineId(vl.id);
    setStudioError(null);
    setStudioStatus(null);
    try {
      const res = await fetch("/api/admin/video-templates/tts-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mode: "single",
          lang: activeLang,
          lineId: vl.id,
          label: `${siblingContext.slug}_${activeLang}_${vl.id}`,
          text: vl.text,
          voiceId: siblingContext.voiceId || undefined,
          modelId: siblingContext.modelId || undefined,
          stability: siblingContext.stability,
          similarityBoost: siblingContext.similarityBoost,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        assetId?: number;
        durationSec?: number;
        filename?: string;
      };
      if (!res.ok || !data.assetId) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const newAsset: PipelineAssetSummary = {
        id: data.assetId,
        label: `${siblingContext.slug}_${activeLang}_${vl.id}`,
        filename: data.filename || `${vl.id}.mp3`,
        assetKind: "voice_static",
        lang: activeLang,
        durationSec: data.durationSec,
      };
      setAssets((prev) => [newAsset, ...prev]);

      const nextLines = (selectedShot.voiceLines[activeLang] || []).map((l) =>
        l.id === vl.id
          ? {
              ...l,
              audioAssetId: data.assetId,
              sampleDurationSec: data.durationSec ?? l.sampleDurationSec,
              trimStart: undefined,
              trimEnd: undefined,
              audioSegments: undefined,
              trimSilenceEnd: true,
            }
          : l
      );
      updateShotAt(selectedShotIndex, {
        ...selectedShot,
        voiceLines: { ...selectedShot.voiceLines, [activeLang]: nextLines },
      });
      setStudioStatus(
        tAdmin(
          adminLang,
          `Реплика озвучена (${data.durationSec?.toFixed(2) ?? "?"}s) и сохранена в PipelineAssets #${data.assetId}. Не забудьте нажать «Сохранить» шаблон.`,
          `Репліку озвучено (${data.durationSec?.toFixed(2) ?? "?"}s) та збережено у PipelineAssets #${data.assetId}. Не забудьте натиснути «Зберегти» шаблон.`
        )
      );
    } catch (err) {
      setStudioError(err instanceof Error ? err.message : "TTS failed");
    } finally {
      setTtsBusyLineId(null);
    }
  }

  async function handleAuditionDynamicLine(vl: VoiceLineConfig) {
    if (!selectedShot || selectedShotIndex < 0) return;
    setTtsBusyLineId(vl.id);
    setStudioError(null);
    setStudioStatus(null);
    try {
      const res = await fetch("/api/admin/video-templates/tts-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          lang: activeLang,
          templateText: vl.text,
          sampleFields,
          voiceId: siblingContext.voiceId || undefined,
          modelId: siblingContext.modelId || undefined,
          stability: siblingContext.stability,
          similarityBoost: siblingContext.similarityBoost,
        }),
      });
      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const durHeader = Number(res.headers.get("X-Audio-Duration-Sec") || "0");
      const renderedText = decodeURIComponent(res.headers.get("X-Rendered-Text") || "");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      setLiveAudioMap((prev) => ({
        ...prev,
        [`${activeLang}:${vl.id}`]: {
          blobUrl,
          durationSec: durHeader,
          renderedText,
        },
      }));

      // Play immediately
      const audio = new Audio(blobUrl);
      void audio.play().catch(() => {});

      // Update cached sampleDurationSec on the line so timeline scales right away
      if (durHeader > 0) {
        const nextLines = (selectedShot.voiceLines[activeLang] || []).map((l) =>
          l.id === vl.id ? { ...l, sampleDurationSec: durHeader } : l
        );
        updateShotAt(selectedShotIndex, {
          ...selectedShot,
          voiceLines: { ...selectedShot.voiceLines, [activeLang]: nextLines },
        });
      }

      setStudioStatus(
        `${tAdmin(adminLang, "Тест-прослушивание", "Тест-прослуховування")}: ${durHeader.toFixed(2)}s — «${renderedText}»`
      );
    } catch (err) {
      setStudioError(err instanceof Error ? err.message : "Audition failed");
    } finally {
      setTtsBusyLineId(null);
    }
  }

  async function handleRenderShotFfmpeg(): Promise<string | null> {
    if (!docId || !selectedShot) {
      setStudioError(
        tAdmin(
          adminLang,
          "Сначала сохраните шаблон, чтобы получить ID для серверного рендера.",
          "Спочатку збережіть шаблон, щоб отримати ID для серверного рендеру."
        )
      );
      return null;
    }
    setRenderingShot(true);
    setStudioError(null);
    try {
      const res = await fetch("/api/admin/video-templates/render-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          templateId: docId,
          lang: activeLang,
          mode: "shot",
          shotKey: selectedShot.key,
          timelineConfig: timeline,
          sampleFields,
          synthesizeDynamic: false,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        videoUrl?: string;
        durationSec?: number;
        buildSec?: number;
      };
      if (!res.ok || !data.videoUrl) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const key = `${activeLang}:${selectedShot.id}`;
      setRenderedShotUrls((prev) => ({ ...prev, [key]: data.videoUrl! }));
      setStudioStatus(
        `FFmpeg шот ${selectedShot.key}: ${data.durationSec?.toFixed(2)}s (сборка ${data.buildSec?.toFixed(2)}s)`
      );
      return data.videoUrl;
    } catch (err) {
      setStudioError(err instanceof Error ? err.message : "Shot render failed");
      return null;
    } finally {
      setRenderingShot(false);
    }
  }

  async function handleRenderFullVideo() {
    if (!docId) {
      setStudioError(
        tAdmin(
          adminLang,
          "Сначала сохраните шаблон, чтобы запустить полную сборку.",
          "Спочатку збережіть шаблон, щоб запустити повну збірку."
        )
      );
      return;
    }
    setRenderingFull(true);
    setStudioError(null);
    try {
      const res = await fetch("/api/admin/video-templates/render-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          templateId: docId,
          lang: activeLang,
          mode: "full",
          timelineConfig: timeline,
          sampleFields,
          synthesizeDynamic: false,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        videoUrl?: string;
        durationSec?: number;
        buildSec?: number;
        warnings?: string[];
      };
      if (!res.ok || !data.videoUrl) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setFullPreviewModal({
        videoUrl: data.videoUrl,
        durationSec: data.durationSec || 0,
        buildSec: data.buildSec || 0,
        warnings: data.warnings || [],
      });
    } catch (err) {
      setStudioError(err instanceof Error ? err.message : "Full render failed");
    } finally {
      setRenderingFull(false);
    }
  }

  const bgmSummary = `BGM vol=${siblingContext.bgmVolume} • Ambient=${siblingContext.ambientMode} • Ducking=${siblingContext.duckingPreset}`;

  return (
    <div className="vts-root">
      {/* Top Toolbar */}
      <div className="vts-toolbar">
        <div className="vts-toolbar-group">
          <div className="vts-segmented" title="Язык дорожки озвучки">
            <button
              type="button"
              className={activeLang === "uk" ? "is-active" : ""}
              onClick={() => setActiveLang("uk")}
            >
              🇺🇦 UA
            </button>
            <button
              type="button"
              className={activeLang === "ru" ? "is-active" : ""}
              onClick={() => setActiveLang("ru")}
            >
              🇷🇺 RU
            </button>
          </div>

          <div className="vts-segmented" title="Тестовый пресет динамических полей">
            {(["short", "medium", "max"] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={samplePreset === p ? "is-active" : ""}
                onClick={() => setSamplePreset(p)}
              >
                {p === "short"
                  ? tAdmin(adminLang, "Короткий", "Короткий")
                  : p === "medium"
                  ? tAdmin(adminLang, "Средний", "Середній")
                  : tAdmin(adminLang, "Макс.", "Макс.")}
              </button>
            ))}
          </div>

          <span className="vts-badge">
            <Film size={12} /> {timeline.shots.length}{" "}
            {tAdmin(adminLang, "шотов", "шотів")} • ~{totalEstimatedSec.toFixed(1)}s
          </span>
        </div>

        <div className="vts-toolbar-group">
          <button type="button" className="vts-btn" onClick={addShot}>
            <Plus size={14} /> {tAdmin(adminLang, "Добавить шот", "Додати шот")}
          </button>
          <button
            type="button"
            className="vts-btn vts-btn--primary"
            disabled={renderingFull || timeline.shots.length === 0}
            onClick={() => void handleRenderFullVideo()}
          >
            {renderingFull ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            {renderingFull
              ? tAdmin(adminLang, "Сборка MP4…", "Збірка MP4…")
              : tAdmin(adminLang, "Собрать полный MP4", "Зібрати повний MP4")}
          </button>
        </div>
      </div>

      {studioError && (
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 7,
            background: "rgba(220, 38, 38, 0.12)",
            border: "1px solid rgba(220, 38, 38, 0.35)",
            color: "var(--theme-error-500, #dc2626)",
            fontSize: 12,
          }}
        >
          {studioError}
        </div>
      )}

      {studioStatus && (
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 7,
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            fontSize: 12,
          }}
        >
          {studioStatus}
        </div>
      )}

      {/* Workspace: Left Shot Player + Right Shot Inspector */}
      <div className="vts-workspace">
        <ShotPreviewPlayer
          shot={selectedShot}
          metrics={selectedMetrics}
          activeLang={activeLang}
          selectedVoiceLineId={selectedVoiceLineId}
          sampleFields={sampleFields}
          liveAudioMap={liveAudioMap}
          onUpdateOverlay={handleUpdateOverlay}
          onNudgeVoiceLine={handleNudgeVoiceLine}
          onRenderShotFfmpeg={handleRenderShotFfmpeg}
          renderingShot={renderingShot}
          renderedShotUrl={
            selectedShot
              ? renderedShotUrls[`${activeLang}:${selectedShot.id}`] || null
              : null
          }
          externalSeek={externalSeek}
        />

        <ShotInspector
          shot={selectedShot}
          shotIndex={selectedShotIndex}
          metrics={selectedMetrics}
          activeLang={activeLang}
          selectedVoiceLineId={selectedVoiceLineId}
          availableVars={availableVars}
          sampleFields={sampleFields}
          assetMap={assetMap}
          liveAudioMap={liveAudioMap}
          onUpdateShot={(next) => {
            if (selectedShotIndex >= 0) updateShotAt(selectedShotIndex, next);
          }}
          onDeleteShot={deleteSelectedShot}
          onSelectVoiceLine={(lineId) => setSelectedVoiceLineId(lineId)}
          onOpenAssetPicker={(kind, currentId, onPicked) =>
            setPickerState({ open: true, kind, currentId, onPicked })
          }
          onSynthesizeStaticLine={handleSynthesizeStaticLine}
          onAuditionDynamicLine={handleAuditionDynamicLine}
          ttsBusyLineId={ttsBusyLineId}
          voiceFocusNonce={voiceFocusNonce}
        />
      </div>

      {/* Bottom 2-Lane Shot-Anchored Timeline */}
      <TimelineTracks
        shots={timeline.shots}
        metricsByShotId={metricsByShotId}
        activeLang={activeLang}
        selectedShotId={selectedShotId}
        selectedVoiceLineId={selectedVoiceLineId}
        liveAudioMap={liveAudioMap}
        assetMap={assetMap}
        onSelectShot={(id) => {
          if (id !== selectedShotId) {
            setSelectedShotId(id);
            const s = timeline.shots.find((item) => item.id === id);
            setSelectedVoiceLineId(s?.voiceLines[activeLang]?.[0]?.id || null);
          }
        }}
        onSelectVoiceLine={(shotId, lineId) => {
          setSelectedShotId(shotId);
          setSelectedVoiceLineId(lineId);
          setVoiceFocusNonce((n) => n + 1);
        }}
        onMoveShot={moveShot}
        onChangeVoiceOffset={handleChangeVoiceOffset}
        onTrimShot={handleTrimShot}
        onSeekPreviewFrame={(shotId, sourceSec) =>
          setExternalSeek((prev) => ({
            shotId,
            sourceSec,
            nonce: (prev?.nonce ?? 0) + 1,
          }))
        }
        bgmSummary={bgmSummary}
      />

      {/* Asset Picker Modal */}
      <AssetPickerModal
        open={pickerState.open}
        filterKind={pickerState.kind}
        selectedId={pickerState.currentId}
        assets={assets}
        onClose={() => setPickerState((s) => ({ ...s, open: false }))}
        onSelect={(asset) => pickerState.onPicked?.(asset)}
        onAssetUploaded={(asset) => setAssets((prev) => [asset, ...prev])}
      />

      {/* Full Video Preview Modal */}
      {fullPreviewModal && (
        <div className="vts-modal-backdrop" onClick={() => setFullPreviewModal(null)}>
          <div className="vts-modal" style={{ width: "min(860px, 96vw)" }} onClick={(e) => e.stopPropagation()}>
            <div className="vts-modal-header">
              <span>
                {tAdmin(adminLang, "Полный тест-рендер", "Повний тест-рендер")} ({activeLang.toUpperCase()}) •{" "}
                {fullPreviewModal.durationSec.toFixed(2)}s ({tAdmin(adminLang, "сборка", "збірка")}{" "}
                {fullPreviewModal.buildSec.toFixed(1)}s)
              </span>
              <button
                type="button"
                className="vts-btn vts-btn--sm"
                onClick={() => setFullPreviewModal(null)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="vts-modal-body">
              <video
                src={fullPreviewModal.videoUrl}
                controls
                autoPlay
                playsInline
                style={{ width: "100%", borderRadius: 8, background: "#000" }}
              />
              {fullPreviewModal.warnings.length > 0 && (
                <div style={{ fontSize: 12, color: "#b45309" }}>
                  {fullPreviewModal.warnings.map((w, i) => (
                    <div key={i}>⚠ {w}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoTimelineStudio;
