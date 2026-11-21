"use client";

import React, { useMemo, useRef, useState } from "react";
import { Film, Music, Upload, Volume2, X } from "lucide-react";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";
import type { PipelineAssetSummary } from "./types";

interface AssetPickerModalProps {
  open: boolean;
  filterKind?: "video" | "voice_static" | "bgm" | "ambient" | "any";
  selectedId?: number | null;
  assets: PipelineAssetSummary[];
  onClose: () => void;
  onSelect: (asset: PipelineAssetSummary) => void;
  onAssetUploaded: (asset: PipelineAssetSummary) => void;
}

export function AssetPickerModal({
  open,
  filterKind = "any",
  selectedId,
  assets,
  onClose,
  onSelect,
  onAssetUploaded,
}: AssetPickerModalProps) {
  const lang = useAdminLang();
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (filterKind !== "any" && a.assetKind !== filterKind) return false;
      if (!q) return true;
      return (
        a.label.toLowerCase().includes(q) ||
        a.filename.toLowerCase().includes(q) ||
        a.lang.toLowerCase().includes(q)
      );
    });
  }, [assets, filterKind, query]);

  if (!open) return null;

  async function handleFileUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const guessedKind =
        filterKind !== "any"
          ? filterKind
          : file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
          ? "voice_static"
          : "image";
      fd.append(
        "_payload",
        JSON.stringify({
          label: file.name.replace(/\.[^.]+$/, ""),
          assetKind: guessedKind,
          lang: "any",
        })
      );

      const res = await fetch("/api/pipeline-assets", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json()) as {
        doc?: PipelineAssetSummary;
        errors?: Array<{ message?: string }>;
      };
      if (!res.ok || !data.doc) {
        throw new Error(data.errors?.[0]?.message || `Upload HTTP ${res.status}`);
      }
      const created: PipelineAssetSummary = {
        id: Number(data.doc.id),
        label: data.doc.label,
        filename: data.doc.filename,
        assetKind: data.doc.assetKind,
        lang: data.doc.lang,
        durationSec: data.doc.durationSec,
        width: data.doc.width,
        height: data.doc.height,
        fps: data.doc.fps,
      };
      onAssetUploaded(created);
      onSelect(created);
      onClose();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="vts-modal-backdrop" onClick={onClose}>
      <div className="vts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vts-modal-header">
          <span>
            {filterKind === "video"
              ? tAdmin(lang, "Выбор видеоклипа (PipelineAssets)", "Вибір відеокліпу (PipelineAssets)")
              : filterKind === "voice_static"
              ? tAdmin(lang, "Выбор аудио-реплики", "Вибір аудіо-репліки")
              : tAdmin(lang, "Выбор ассета пайплайна", "Вибір асету пайплайну")}
          </span>
          <button type="button" className="vts-btn vts-btn--sm" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="vts-modal-body">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              className="vts-input"
              style={{ flex: 1, minWidth: 200 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tAdmin(lang, "Поиск по названию или файлу…", "Пошук за назвою або файлом…")}
            />
            <input
              ref={fileRef}
              type="file"
              style={{ display: "none" }}
              accept={
                filterKind === "video"
                  ? "video/mp4,video/quicktime"
                  : filterKind === "voice_static" || filterKind === "bgm"
                  ? "audio/mpeg,audio/wav"
                  : undefined
              }
              onChange={(e) => void handleFileUpload(e.target.files?.[0])}
            />
            <button
              type="button"
              className="vts-btn vts-btn--primary"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={14} />
              {uploading
                ? tAdmin(lang, "Загрузка…", "Завантаження…")
                : tAdmin(lang, "Загрузить новый файл", "Завантажити новий файл")}
            </button>
          </div>

          {uploadError && (
            <div style={{ color: "var(--theme-error-500, #dc2626)", fontSize: 12 }}>
              {uploadError}
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--theme-elevation-500)" }}>
              {tAdmin(lang, "Нет подходящих ассетов. Загрузите файл кнопкой выше.", "Немає відповідних асетів. Завантажте файл кнопкою вище.")}
            </div>
          ) : (
            <div className="vts-asset-list">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`vts-asset-item${Number(selectedId) === a.id ? " is-selected" : ""}`}
                  onClick={() => {
                    onSelect(a);
                    onClose();
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12 }}>
                    {a.assetKind === "video" ? (
                      <Film size={13} />
                    ) : a.assetKind === "bgm" ? (
                      <Music size={13} />
                    ) : (
                      <Volume2 size={13} />
                    )}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--theme-elevation-500)" }}>
                    #{a.id} • {a.durationSec ? `${a.durationSec.toFixed(2)}s` : "—"}
                    {a.lang !== "any" ? ` • ${a.lang.toUpperCase()}` : ""}
                    {a.width && a.height ? ` • ${a.width}×${a.height}` : ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
