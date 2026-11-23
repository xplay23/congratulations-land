"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bike,
  BookOpen,
  Check,
  Gift,
  Heart,
  Home,
  Loader2,
  Minus,
  Palette,
  Pencil,
  Plus,
  Sparkles,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import {
  GenderAvatar,
  ImageLightbox,
  LanguageGlyph,
  SectionHeading,
  type LightboxItem,
} from "@/components/VisualOptionCards";
import { formatAgeWithUnit } from "@/lib/i18n";
import {
  validateDynamicVideoSubmission,
  type PublicAgeStepperField,
  type PublicGenderField,
  type PublicOverlayMockup,
  type PublicPhotoUploadField,
  type PublicPraisePreset,
  type PublicPraisePresetsField,
  type PublicSelectCardsField,
  type PublicTextField,
  type PublicVideoTemplateConfig,
} from "@/lib/video/form-config";
import { buildTemplateVars, interpolateVideoText } from "@/lib/video/template-vars";
import type { ChildGender, Lang } from "@/lib/types";

function renderPresetIcon(icon: PublicPraisePreset["icon"]) {
  const cls = "h-5 w-5 text-amber-300 shrink-0";
  switch (icon) {
    case "bike":
      return <Bike className={cls} />;
    case "book":
      return <BookOpen className={cls} />;
    case "home":
      return <Home className={cls} />;
    case "palette":
      return <Palette className={cls} />;
    case "sparkles":
      return <Sparkles className={cls} />;
    case "heart":
    default:
      return <Heart className={cls} />;
  }
}

interface DynamicVideoFormProps {
  template: PublicVideoTemplateConfig;
  variationSlug?: string;
  videoPrice: number;
  videoLang: Lang;
  onLangSwitch: (next: Lang) => void;
}

export function DynamicVideoForm({
  template,
  variationSlug,
  videoPrice,
  videoLang,
  onLangSwitch,
}: DynamicVideoFormProps) {
  const router = useRouter();
  const { lang, l } = useLanguage();
  const isUk = lang === "uk";

  // Unified dynamic form state
  const [fields, setFields] = useState<Record<string, string>>({});
  const [ageNums, setAgeNums] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const f of template.formFields) {
      if (f.blockType === "ageStepperField") {
        init[f.fieldKey] = f.defaultAge;
      }
    }
    return init;
  });
  const [omitAges, setOmitAges] = useState<Record<string, boolean>>({});
  const [praiseChoices, setPraiseChoices] = useState<Record<string, string>>({});
  const [touchedCustom, setTouchedCustom] = useState<Record<string, boolean>>({});
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [uploadPreviews, setUploadPreviews] = useState<
    Record<string, { url: string; name: string }>
  >({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [parentalConsent, setParentalConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

  // Sync age fields into `fields` map whenever ageNums / omitAges / videoLang changes
  useEffect(() => {
    setFields((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const f of template.formFields) {
        if (f.blockType === "ageStepperField") {
          const omit = Boolean(omitAges[f.fieldKey]);
          const num = ageNums[f.fieldKey] ?? f.defaultAge;
          const formatted = omit ? "" : formatAgeWithUnit(num, videoLang);
          if (next[f.fieldKey] !== formatted) {
            next[f.fieldKey] = formatted;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [ageNums, omitAges, videoLang, template.formFields]);

  // Update praise preset text when language or gender switches (unless user hand-edited custom text)
  const genderField = template.formFields.find(
    (f): f is PublicGenderField => f.blockType === "genderField"
  );
  const currentGender = genderField
    ? (fields[genderField.fieldKey] as ChildGender | undefined) || null
    : null;

  useEffect(() => {
    if (!currentGender) return;
    setFields((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const f of template.formFields) {
        if (f.blockType !== "praisePresetsField" || f.presets.length === 0) continue;
        const choice = praiseChoices[f.fieldKey] || "custom";
        if (choice !== "custom") {
          const found = f.presets.find((p) => p.presetId === choice);
          if (found) {
            const phrase =
              currentGender === "girl" ? found.phraseGirl : found.phraseBoy;
            if (next[f.fieldKey] !== phrase) {
              next[f.fieldKey] = phrase;
              changed = true;
            }
          }
        } else if (!touchedCustom[f.fieldKey]) {
          const first = f.presets[0];
          const phrase =
            currentGender === "girl" ? first.phraseGirl : first.phraseBoy;
          if (next[f.fieldKey] !== phrase) {
            next[f.fieldKey] = phrase;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [currentGender, videoLang, template.formFields, praiseChoices, touchedCustom]);

  function setFieldValue(key: string, val: string) {
    setFields((prev) => ({ ...prev, [key]: val }));
    if (errorField === key) {
      setErrorField(null);
      setError(null);
    }
  }

  async function handlePhotoUpload(fieldKey: string, file: File | undefined) {
    if (!file) return;
    setError(null);
    const localUrl = URL.createObjectURL(file);
    setUploadingKey(fieldKey);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "child");
      if (uploads[fieldKey]) fd.append("replaceUploadId", uploads[fieldKey]);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploads((prev) => ({ ...prev, [fieldKey]: data.uploadId }));
      setUploadPreviews((prev) => ({
        ...prev,
        [fieldKey]: { url: localUrl, name: file.name },
      }));
      if (errorField === fieldKey) setErrorField(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleClearPhoto(fieldKey: string) {
    const oldId = uploads[fieldKey];
    setUploads((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    setUploadPreviews((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    if (oldId) {
      await fetch(`/api/uploads?uploadId=${encodeURIComponent(oldId)}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorField(null);

    const check = validateDynamicVideoSubmission({
      formFields: template.formFields,
      fields,
      uploads,
      parentalConsent,
      lang: videoLang,
    });

    if (!check.ok) {
      setErrorField(check.fieldKey);
      setError(check.error);
      return;
    }

    setSubmitting(true);
    try {
      const f = check.normalizedFields;
      const u = check.normalizedUploads;
      const res = await fetch("/api/orders/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: videoLang,
          character: template.slug,
          variationSlug: variationSlug || undefined,
          templateSlug: template.slug,
          childName: f.childName || f.name || "",
          childNameVocative: f.childNameVocative || f.voc || undefined,
          gender: f.gender === "girl" ? "girl" : "boy",
          age: f.age || "",
          achievement: f.achievement || "",
          photoUploadId: u.photo || Object.values(u)[0] || "",
          parentalConsent,
          fields: f,
          uploads: u,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldKey) setErrorField(data.fieldKey);
        throw new Error(data.error || "Failed creating video order");
      }
      router.push(l(`/orders/${data.orderId}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setSubmitting(false);
    }
  }

  const computedVars = buildTemplateVars({ lang: videoLang, fields });

  function renderTextField(field: PublicTextField) {
    const val = fields[field.fieldKey] || "";
    const vocKey = field.vocativeFieldKey || "childNameVocative";
    const vocVal = fields[vocKey] || "";
    const hasErr = errorField === field.fieldKey;

    if (field.enableVocative) {
      return (
        <div key={field.fieldKey} className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-amber-100">
              {field.label}
              {field.required ? " *" : ""}
            </label>
            <input
              maxLength={field.maxLength}
              value={val}
              onChange={(e) => setFieldValue(field.fieldKey, e.target.value)}
              placeholder={field.placeholder || ""}
              className={`h-11 w-full rounded-xl border px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                hasErr
                  ? "border-rose-400 bg-rose-500/10 ring-1 ring-rose-400/40"
                  : "border-white/15 bg-white/5 focus:border-amber-400"
              }`}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-amber-100">
              {field.vocativeLabel ||
                (videoLang === "uk" ? "Кличний відмінок" : "Обращение в речи (опц.)")}
            </label>
            <input
              maxLength={field.vocativeMaxLength || 17}
              value={vocVal}
              onChange={(e) => setFieldValue(vocKey, e.target.value)}
              placeholder={field.vocativePlaceholder || ""}
              className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      );
    }

    return (
      <div key={field.fieldKey}>
        <label className="mb-2 block text-sm font-semibold text-amber-100">
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <input
          maxLength={field.maxLength}
          value={val}
          onChange={(e) => setFieldValue(field.fieldKey, e.target.value)}
          placeholder={field.placeholder || ""}
          className={`h-11 w-full rounded-xl border px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
            hasErr
              ? "border-rose-400 bg-rose-500/10 ring-1 ring-rose-400/40"
              : "border-white/15 bg-white/5 focus:border-amber-400"
          }`}
        />
      </div>
    );
  }

  function renderAgeField(field: PublicAgeStepperField) {
    const num = ageNums[field.fieldKey] ?? field.defaultAge;
    const omit = Boolean(omitAges[field.fieldKey]);

    return (
      <div key={field.fieldKey}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="text-sm font-semibold text-amber-100">{field.label}</label>
          {field.allowOmit && (
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={omit}
                onChange={(e) =>
                  setOmitAges((prev) => ({
                    ...prev,
                    [field.fieldKey]: e.target.checked,
                  }))
                }
              />
              {field.omitLabel || (isUk ? "Не озвучувати вік" : "Не озвучивать возраст")}
            </label>
          )}
        </div>

        <div
          className={`flex h-11 items-center justify-between rounded-xl border px-2 transition ${
            omit
              ? "border-white/10 bg-white/[0.02] opacity-50"
              : "border-white/15 bg-white/5"
          }`}
        >
          <button
            type="button"
            disabled={omit || num <= field.minAge}
            onClick={() =>
              setAgeNums((prev) => ({
                ...prev,
                [field.fieldKey]: Math.max(field.minAge, num - 1),
              }))
            }
            aria-label="Decrease age"
            className="icon-button flex h-8 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={field.minAge}
              max={field.maxAge}
              disabled={omit}
              value={num}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v)) {
                  setAgeNums((prev) => ({
                    ...prev,
                    [field.fieldKey]: Math.min(field.maxAge, Math.max(field.minAge, v)),
                  }));
                }
              }}
              className="w-10 bg-transparent text-center text-base font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-sm font-medium text-amber-200">
              {omit
                ? isUk
                  ? "без віку"
                  : "без возраста"
                : formatAgeWithUnit(num, videoLang).replace(/^\d+\s*/, "")}
            </span>
          </div>

          <button
            type="button"
            disabled={omit || num >= field.maxAge}
            onClick={() =>
              setAgeNums((prev) => ({
                ...prev,
                [field.fieldKey]: Math.min(field.maxAge, num + 1),
              }))
            }
            aria-label="Increase age"
            className="icon-button flex h-8 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  function renderPraiseField(field: PublicPraisePresetsField) {
    const val = fields[field.fieldKey] || "";
    const choice = praiseChoices[field.fieldKey] || "custom";
    const len = val.trim().length;
    const optimal = len >= field.optimalMin && len <= field.optimalMax;
    const valid = len >= field.minLength && len <= field.maxLength;
    const hasErr = errorField === field.fieldKey;

    const spokenPreview = interpolateVideoText(
      field.spokenPreviewTemplate || "{agePrefix} {achievement}…",
      {
        ...computedVars,
        [field.fieldKey]: val.trim() || "…",
        achievement: val.trim() || "…",
      }
    );

    return (
      <div key={field.fieldKey} className="space-y-4">
        <SectionHeading title={field.label} badge={`${len}/${field.maxLength}`} />

        <div className="grid gap-3 sm:grid-cols-3">
          {field.presets.map((opt) => {
            const active = choice === opt.presetId;
            return (
              <button
                key={opt.presetId}
                type="button"
                onClick={() => {
                  setPraiseChoices((prev) => ({ ...prev, [field.fieldKey]: opt.presetId }));
                  setTouchedCustom((prev) => ({ ...prev, [field.fieldKey]: false }));
                  setFieldValue(
                    field.fieldKey,
                    currentGender === "girl" ? opt.phraseGirl : opt.phraseBoy
                  );
                }}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                  active
                    ? "border-amber-400 bg-amber-400/15 text-amber-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                }`}
              >
                <span className="mt-0.5">{renderPresetIcon(opt.icon)}</span>
                <div>
                  <div className="text-xs font-bold">{opt.title}</div>
                  {opt.desc && (
                    <div className="mt-0.5 text-[11px] text-slate-400">{opt.desc}</div>
                  )}
                </div>
              </button>
            );
          })}

          {field.allowCustom && (
            <button
              type="button"
              onClick={() =>
                setPraiseChoices((prev) => ({ ...prev, [field.fieldKey]: "custom" }))
              }
              className={`flex items-start gap-3 rounded-xl border border-dashed p-3.5 text-left transition ${
                choice === "custom"
                  ? "border-amber-400 bg-amber-400/15 text-amber-100"
                  : "border-white/20 bg-white/[0.02] text-slate-300 hover:border-white/35"
              }`}
            >
              <Pencil className="mt-0.5 h-5 w-5 text-amber-300 shrink-0" />
              <div>
                <div className="text-xs font-bold">
                  {isUk ? "Свій варіант" : "Свой вариант"}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {isUk ? "Вписати чи підправити" : "Вписать или поправить"}
                </div>
              </div>
            </button>
          )}
        </div>

        {choice === "custom" && field.allowCustom && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">
                {isUk
                  ? `Текст (оптимум ${field.optimalMin}–${field.optimalMax} символів, макс. ${field.maxLength}):`
                  : `Текст (оптимум ${field.optimalMin}–${field.optimalMax} символов, макс. ${field.maxLength}):`}
              </span>
              <span
                className={`font-mono font-bold ${
                  optimal ? "text-emerald-400" : valid ? "text-amber-300" : "text-rose-400"
                }`}
              >
                {len}/{field.maxLength}
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={field.maxLength}
              value={val}
              onChange={(e) => {
                setFieldValue(field.fieldKey, e.target.value);
                setTouchedCustom((prev) => ({ ...prev, [field.fieldKey]: true }));
              }}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                hasErr
                  ? "border-rose-400 bg-rose-500/10 ring-1 ring-rose-400/40"
                  : "border-amber-300/40 bg-white/5 focus:border-amber-400"
              }`}
            />
          </div>
        )}

        {field.showSpokenPreview && (
          <div className="rounded-xl border border-amber-300/20 bg-amber-400/5 px-4 py-3 text-xs text-slate-200">
            <span className="font-semibold text-amber-300">
              {isUk ? "Так звучатиме в озвучці:" : "Так прозвучит в озвучке:"}
            </span>{" "}
            <span className="italic text-amber-50">«{spokenPreview}»</span>
          </div>
        )}
      </div>
    );
  }

  function renderSelectCardsField(field: PublicSelectCardsField) {
    const val = fields[field.fieldKey] || "";
    const hasErr = errorField === field.fieldKey;

    return (
      <div key={field.fieldKey} className="space-y-3">
        <SectionHeading
          title={field.label + (field.required ? " *" : "")}
          badge={
            field.required
              ? isUk
                ? "обов'язково"
                : "обязательно"
              : isUk
              ? "опційно"
              : "опционально"
          }
        />
        <div
          className={`grid gap-3 sm:grid-cols-3 ${
            hasErr ? "rounded-xl border border-rose-400/70 p-2" : ""
          }`}
        >
          {field.options.map((opt) => {
            const spokenVal =
              currentGender === "girl" && opt.spokenGirl
                ? opt.spokenGirl
                : opt.spokenBoy || opt.value;
            const active = val === spokenVal || val === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFieldValue(field.fieldKey, active && !field.required ? "" : spokenVal)}
                className={`rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-amber-400 bg-amber-400/15 text-amber-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                {opt.desc && <div className="mt-0.5 text-[11px] text-slate-400">{opt.desc}</div>}
              </button>
            );
          })}
        </div>
        {field.allowCustom && (
          <input
            value={val}
            onChange={(e) => setFieldValue(field.fieldKey, e.target.value)}
            placeholder={isUk ? "Або впишіть свій варіант…" : "Или впишите свой вариант…"}
            className="h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
        )}
      </div>
    );
  }

  function renderOverlayMockup(mockup: PublicOverlayMockup, previewUrl: string | null) {
    const captionVal =
      (mockup.captionFieldKey ? fields[mockup.captionFieldKey] : "") ||
      fields.childName ||
      (isUk ? "Ім'я" : "Имя");

    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-amber-300/30 bg-[#0b1020] shadow-lg">
        <img
          src={mockup.frameUrl}
          alt="Frame mockup"
          className="h-full w-full object-cover"
        />
        <div
          className="absolute flex flex-col items-center justify-center"
          style={{
            left: `${((mockup.cx - mockup.width / 2) / 1280) * 100}%`,
            top: `${((mockup.cy - mockup.height / 2) / 720) * 100}%`,
            width: `${(mockup.width / 1280) * 100}%`,
            height: `${(mockup.height / 720) * 100}%`,
            transform: mockup.rotation ? `rotate(${mockup.rotation}deg)` : undefined,
          }}
        >
          <div
            className="h-full w-full overflow-hidden border-2 border-amber-700/70 bg-amber-100/80 shadow-md flex items-center justify-center"
            style={{
              borderRadius: `${Math.max(4, Math.round((mockup.borderRadius / 244) * 10))}px`,
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <span className="px-1 text-center text-[9px] font-semibold text-amber-900/75">
                {isUk ? "Ваше фото" : "Ваше фото"}
              </span>
            )}
          </div>
          {mockup.captionFieldKey && (
            <div
              className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-serif-book italic font-semibold drop-shadow-xs"
              style={{
                top: `calc(100% + ${Math.max(2, Math.round((mockup.captionOffsetY / 720) * 100))}%)`,
                color: mockup.captionColor || "#442610",
                fontSize: "clamp(9px, 1.2vw, 13px)",
              }}
            >
              {captionVal}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderPhotoField(field: PublicPhotoUploadField) {
    const preview = uploadPreviews[field.fieldKey] || null;
    const isUploading = uploadingKey === field.fieldKey;
    const mockup = field.showOverlayMockup
      ? template.overlayMockups[field.fieldKey]
      : undefined;
    const hasPhotoErr = errorField === field.fieldKey;
    const hasConsentErr = errorField === "consent";

    return (
      <div key={field.fieldKey} className="space-y-3">
        <SectionHeading
          title={field.label}
          badge={
            field.required
              ? isUk
                ? "обов'язково"
                : "обязательно"
              : isUk
              ? "опційно"
              : "опционально"
          }
        />

        <div
          className={`grid gap-5 rounded-2xl border p-5 items-center ${
            mockup ? "md:grid-cols-[1fr_290px]" : ""
          } ${
            hasPhotoErr
              ? "border-rose-400/80 bg-rose-500/10"
              : "border-white/10 bg-white/[0.03]"
          }`}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {preview && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-amber-300/40">
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="h-full w-full object-cover object-top"
                  />
                  <button
                    type="button"
                    onClick={() => void handleClearPhoto(field.fieldKey)}
                    aria-label="Remove photo"
                    className="icon-button absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-white hover:bg-rose-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <label className="site-button inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/20">
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {preview
                  ? isUk
                    ? "Замінити фото"
                    : "Заменить фото"
                  : isUk
                  ? "Завантажити фото (JPG/PNG)"
                  : "Загрузить фото (JPG/PNG)"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => void handlePhotoUpload(field.fieldKey, e.target.files?.[0])}
                />
              </label>

              {preview && (
                <span className="text-xs text-emerald-300 truncate max-w-[200px]">
                  ✓ {preview.name}
                </span>
              )}
            </div>

            {field.privacyNote && (
              <p className="text-xs text-slate-400">{field.privacyNote}</p>
            )}

            {field.requireConsent && (
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-xs transition ${
                  hasConsentErr
                    ? "border-rose-400/80 bg-rose-500/15 text-rose-100"
                    : "border-white/10 bg-white/[0.02] text-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={parentalConsent}
                  onChange={(e) => {
                    setParentalConsent(e.target.checked);
                    if (errorField === "consent") {
                      setErrorField(null);
                      setError(null);
                    }
                  }}
                  className="mt-0.5 shrink-0"
                />
                <span>
                  {field.consentText ||
                    (isUk
                      ? "Я — батько/мати або законний опікун та даю згоду на тимчасову обробку фото. Метадані EXIF видаляються, фото стирається одразу після рендеру."
                      : "Я — родитель или законный опекун и даю согласие на временную обработку фото. Метаданные EXIF удаляются, фото стирается сразу после рендера.")}
                </span>
              </label>
            )}
          </div>

          {mockup && (
            <div className="space-y-1.5">
              {renderOverlayMockup(mockup, preview?.url || null)}
              <div className="text-center text-[11px] text-slate-400">
                {isUk
                  ? "Попередній макет врізки в кадр"
                  : "Предварительный макет врезки в кадр"}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pair up remaining fields (excluding genderField which sits beside Language selector)
  const otherFields = template.formFields.filter((f) => f.blockType !== "genderField");
  const rows: React.ReactNode[] = [];
  for (let i = 0; i < otherFields.length; i++) {
    const f = otherFields[i];
    const next = otherFields[i + 1];

    if (
      (f.blockType === "textField" && f.width === "half" && next?.blockType === "ageStepperField") ||
      (f.blockType === "textField" && f.width === "half" && next?.blockType === "textField" && next.width === "half")
    ) {
      rows.push(
        <div key={`${f.fieldKey}_${next.fieldKey}`} className="grid gap-5 md:grid-cols-2 items-start">
          {renderTextField(f)}
          {next.blockType === "ageStepperField" ? renderAgeField(next) : renderTextField(next)}
        </div>
      );
      i += 1;
      continue;
    }

    if (f.blockType === "textField") rows.push(renderTextField(f));
    else if (f.blockType === "ageStepperField") rows.push(renderAgeField(f));
    else if (f.blockType === "praisePresetsField") rows.push(renderPraiseField(f));
    else if (f.blockType === "photoUploadField") rows.push(renderPhotoField(f));
    else if (f.blockType === "selectCardsField") rows.push(renderSelectCardsField(f));
  }

  return (
    <>
      <ImageLightbox item={lightbox} onClose={() => setLightbox(null)} />

      {/* Character Presentation Showcase Card (from VideoTemplate) */}
      <div className="grid gap-4 rounded-2xl border border-amber-300/35 bg-[#121a30]/95 p-4 sm:grid-cols-[240px_1fr] items-center shadow-lg">
        <div className="group relative aspect-video overflow-hidden rounded-xl border border-amber-300/30 bg-slate-900">
          <img
            src={template.cardPreviewUrl}
            alt={template.cardTitle}
            className="h-full w-full object-cover object-top scale-[1.01] transform-gpu will-change-transform transition-transform duration-300 ease-out group-hover:scale-[1.1]"
          />
          <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-[#0b1020]">
            <Check className="h-3.5 w-3.5" />
          </span>
          <button
            type="button"
            aria-label={isUk ? "Збільшити кадр" : "Увеличить кадр"}
            onClick={() =>
              setLightbox({
                src: template.cardPreviewUrl,
                title: template.cardTitle,
                desc: template.cardDescription,
              })
            }
            className="icon-button absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur-xs transition hover:bg-amber-400 hover:text-[#0b1020]"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {template.cardBadge && (
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-0.5 text-[11px] font-semibold text-amber-200">
                {template.cardBadge}
              </div>
            )}
            <div className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-0.5 text-[11px] font-bold text-amber-200">
              {videoPrice} ₴
            </div>
          </div>
          <h2 className="font-serif-book text-xl font-bold text-white">
            {template.cardTitle}
          </h2>
          {template.cardDescription && (
            <p className="text-xs leading-relaxed text-slate-300">
              {template.cardDescription}
            </p>
          )}
          {template.parentAdviceText && (
            <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-amber-300/25 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-100">
              <Gift className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <span>
                {template.parentAdviceTitle && (
                  <strong className="font-semibold text-amber-200">
                    {template.parentAdviceTitle}{" "}
                  </strong>
                )}
                {template.parentAdviceText}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-7 rounded-2xl border border-white/10 bg-[#121a30]/95 p-6 shadow-xl sm:p-8"
      >
        {/* Row 1: Voice Language + Gender (when present in template) */}
        <div className={`grid gap-5 ${genderField ? "md:grid-cols-2" : ""}`}>
          <div>
            <SectionHeading title={isUk ? "Мова озвучки" : "Язык озвучки"} />
            <div className="grid grid-cols-2 gap-3">
              {(["uk", "ru"] as const).map((code) => {
                const active = videoLang === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onLangSwitch(code)}
                    className={`flex h-[68px] items-center gap-3 rounded-xl border px-3.5 text-left transition ${
                      active
                        ? "border-amber-400 bg-amber-400/15 text-amber-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                    }`}
                  >
                    <LanguageGlyph lang={code} active={active} />
                    <div>
                      <div className="text-sm font-bold">
                        {code === "uk" ? "Українська" : "Русский"}
                      </div>
                      <div className="text-[11px] text-slate-400">ElevenLabs</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {genderField && (
            <div
              className={
                errorField === genderField.fieldKey
                  ? "rounded-2xl border border-rose-400/80 bg-rose-500/10 p-3 -m-3 ring-1 ring-rose-400/40 transition"
                  : ""
              }
            >
              <SectionHeading
                title={`${genderField.label}${genderField.required ? " *" : ""}`}
                badge={
                  genderField.required
                    ? isUk
                      ? "обов'язково"
                      : "обязательно"
                    : undefined
                }
              />
              <div className="grid grid-cols-2 gap-3">
                {(["boy", "girl"] as const).map((g) => {
                  const active = currentGender === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFieldValue(genderField.fieldKey, g)}
                      className={`flex h-[68px] items-center gap-3 rounded-xl border px-3.5 text-left transition ${
                        active
                          ? "border-amber-400 bg-amber-400/15 text-amber-100"
                          : errorField === genderField.fieldKey
                          ? "border-rose-400/60 bg-rose-500/10 text-rose-100 hover:border-rose-300"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                      }`}
                    >
                      <GenderAvatar gender={g} active={active} />
                      <div>
                        <div className="text-sm font-bold">
                          {g === "boy"
                            ? genderField.boyLabel || (isUk ? "Хлопчик" : "Мальчик")
                            : genderField.girlLabel || (isUk ? "Дівчинка" : "Девочка")}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {g === "boy" ? genderField.boyHint : genderField.girlHint}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Template Fields */}
        {rows}

        {/* Submit */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <div className="space-y-0.5">
            <div className="text-xs text-slate-400">
              {isUk ? "Безкоштовне прев'ю до оплати" : "Бесплатное превью до оплаты"}
            </div>
            <div className="text-lg font-bold text-amber-300">
              {videoPrice} ₴{" "}
              <span className="text-xs font-normal text-slate-400">
                {isUk ? "за чисте HD 720p відео" : "за чистое HD 720p видео"}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || Boolean(uploadingKey)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {submitting
              ? isUk
                ? "Створюємо відео…"
                : "Создаём видео…"
              : isUk
              ? "Створити безкоштовне прев'ю"
              : "Создать бесплатное превью"}
          </button>
        </div>
      </form>
    </>
  );
}
