"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileEdit,
  Loader2,
  RotateCcw,
  Save,
  Server,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { usePricing } from "@/components/PricingContext";
import { DEFAULT_PRICING_CONFIG, SERVICE_ORDER } from "@/lib/pricing-defaults";
import type {
  AiRatesConfig,
  PlatformLimitsConfig,
  PricingConfig,
  ServiceId,
} from "@/lib/types";

interface SystemHealth {
  hasOpenAI: boolean;
  textModel: string;
  directorModel: string;
  imageModel: string;
  imageQuality: string;
  visionQaEnabled: boolean;
  hasElevenLabs: boolean;
  elevenLabsVoiceId: string;
  monoSandbox: boolean;
  monoTokenConfigured: boolean;
  emailTransport: string;
  telegramBotUsername: string | null;
  adminAuthMethods: { password: boolean; email: boolean };
}

export function AdminSettingsTab() {
  const { lang } = useLanguage();
  const { refreshPricing } = usePricing();
  const isUk = lang === "uk";

  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [limits, setLimits] = useState<PlatformLimitsConfig | null>(null);
  const [aiRates, setAiRates] = useState<AiRatesConfig | null>(null);
  const [system, setSystem] = useState<SystemHealth | null>(null);
  const [expandedTexts, setExpandedTexts] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed loading settings");
      setPricing(data.pricing);
      setLimits(data.limits);
      setAiRates(data.aiRates);
      setSystem(data.system);
      setDirty(false);
    } catch (err) {
      setNotice({
        ok: false,
        text: err instanceof Error ? err.message : "Failed loading settings",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateServiceField = (
    id: ServiceId,
    patch: Partial<PricingConfig["services"][ServiceId]>
  ) => {
    if (!pricing) return;
    setDirty(true);
    setPricing({
      ...pricing,
      services: {
        ...pricing.services,
        [id]: {
          ...pricing.services[id],
          ...patch,
        },
      },
    });
  };

  const updateServiceTier = (id: ServiceId, tierKey: string, value: number) => {
    if (!pricing) return;
    setDirty(true);
    const cur = pricing.services[id];
    setPricing({
      ...pricing,
      services: {
        ...pricing.services,
        [id]: {
          ...cur,
          tiers: {
            ...(cur.tiers || {}),
            [tierKey]: value,
          },
        },
      },
    });
  };

  const updateServiceBilingual = (
    id: ServiceId,
    field: "title" | "description" | "badgeLabel" | "ctaLabel",
    locale: "uk" | "ru",
    val: string
  ) => {
    if (!pricing) return;
    setDirty(true);
    const cur = pricing.services[id];
    const def = DEFAULT_PRICING_CONFIG.services[id];
    const currentPair = cur[field] || def[field] || { uk: "", ru: "" };
    setPricing({
      ...pricing,
      services: {
        ...pricing.services,
        [id]: {
          ...cur,
          [field]: {
            ...currentPair,
            [locale]: val,
          },
        },
      },
    });
  };

  const updateServiceFeatures = (
    id: ServiceId,
    locale: "uk" | "ru",
    multilineText: string
  ) => {
    if (!pricing) return;
    setDirty(true);
    const cur = pricing.services[id];
    const def = DEFAULT_PRICING_CONFIG.services[id];
    const currentFeatures = cur.features || def.features || { uk: [], ru: [] };
    setPricing({
      ...pricing,
      services: {
        ...pricing.services,
        [id]: {
          ...cur,
          features: {
            ...currentFeatures,
            [locale]: multilineText.split("\n"),
          },
        },
      },
    });
  };

  const resetServiceTextsToDefault = (id: ServiceId) => {
    if (!pricing) return;
    const def = DEFAULT_PRICING_CONFIG.services[id];
    const cur = pricing.services[id];
    setDirty(true);
    setPricing({
      ...pricing,
      services: {
        ...pricing.services,
        [id]: {
          ...cur,
          title: { ...def.title },
          description: { ...def.description },
          badgeLabel: def.badgeLabel ? { ...def.badgeLabel } : undefined,
          ctaLabel: def.ctaLabel ? { ...def.ctaLabel } : undefined,
          features: def.features
            ? { uk: [...def.features.uk], ru: [...def.features.ru] }
            : undefined,
        },
      },
    });
  };

  const handleSaveAll = async () => {
    if (!pricing || !limits || !aiRates) return;
    setSaving(true);
    setNotice(null);
    try {
      // Trim empty lines from features arrays before saving
      const cleanedServices = { ...pricing.services };
      for (const id of SERVICE_ORDER) {
        const svc = cleanedServices[id];
        if (svc.features) {
          cleanedServices[id] = {
            ...svc,
            features: {
              uk: svc.features.uk.map((s) => s.trim()).filter(Boolean),
              ru: svc.features.ru.map((s) => s.trim()).filter(Boolean),
            },
          };
        }
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricing: { ...pricing, services: cleanedServices },
          limits,
          aiRates,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed saving settings");
      setPricing(data.pricing);
      setLimits(data.limits);
      setAiRates(data.aiRates);
      setSystem(data.system);
      setDirty(false);
      await refreshPricing();
      setNotice({
        ok: true,
        text: isUk
          ? "Налаштування збережено в SQLite (app_state) та застосовано на вітрині."
          : "Настройки сохранены в SQLite (app_state) и применены на витрине.",
      });
    } catch (err) {
      setNotice({
        ok: false,
        text: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !pricing || !limits || !aiRates || !system) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-300">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-300" />
        {isUk ? "Завантаження конфігурації..." : "Загрузка конфигурации..."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            notice.ok
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-400/40 bg-rose-500/10 text-rose-200"
          }`}
        >
          {notice.text}
        </div>
      )}

      {dirty && (
        <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/50 bg-[#1a2548]/95 px-4 py-3 text-xs text-amber-100 shadow-xl backdrop-blur-md">
          <span>
            {isUk
              ? "Є незбережені зміни — натисніть «Зберегти», щоб оновити вітрину."
              : "Есть несохранённые изменения — нажмите «Сохранить», чтобы обновить витрину."}
          </span>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSaveAll()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-1.5 font-bold text-[#0b1020] hover:bg-amber-300 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isUk ? "Зберегти зараз" : "Сохранить сейчас"}
          </button>
        </div>
      )}

      {/* Services & Dynamic Pricing */}
      <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-serif-book text-xl font-bold text-amber-100">
              <Sparkles className="h-5 w-5 text-amber-300" />
              {isUk
                ? "Тарифи, видимість та тексти послуг (app_state)"
                : "Тарифы, видимость и тексты услуг (app_state)"}
            </h2>
            <p className="text-xs text-slate-400">
              {isUk
                ? "Після збереження зміни миттєво оновлюють головну сторінку, навігацію, конструктори та нові замовлення."
                : "После сохранения изменения мгновенно обновляют главную страницу, навигацию, конструкторы и новые заказы."}
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSaveAll()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-5 py-2.5 text-xs font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 hover:brightness-105 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isUk ? "Зберегти всі налаштування" : "Сохранить все настройки"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {SERVICE_ORDER.map((id) => {
            const svc = pricing.services[id];
            const def = DEFAULT_PRICING_CONFIG.services[id];
            const textsOpen = Boolean(expandedTexts[id]);
            return (
              <div
                key={id}
                className={`rounded-2xl border p-4 space-y-3 ${
                  svc.enabled
                    ? "border-amber-300/25 bg-white/[0.03]"
                    : "border-white/10 bg-white/[0.01] opacity-80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                        {isUk ? `Етап ${svc.stage}` : `Этап ${svc.stage}`} · {id}
                      </span>
                      {svc.comingSoon && (
                        <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
                          {isUk ? "Заплановано" : "Запланировано"}
                        </span>
                      )}
                      {!svc.enabled && (
                        <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-200">
                          {isUk ? "Приховано" : "Скрыто"}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 text-sm font-bold text-white">
                      {svc.title[lang]}
                    </h3>
                    <p className="text-[11px] text-slate-400">{svc.description[lang]}</p>
                  </div>

                  <label className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-slate-200 shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={svc.enabled}
                      onChange={(e) =>
                        updateServiceField(id, { enabled: e.target.checked })
                      }
                    />
                    <span>{svc.enabled ? "ON" : "OFF"}</span>
                  </label>
                </div>

                {id === "storybook" && svc.tiers ? (
                  <div className="grid grid-cols-3 gap-2">
                    {(["4", "6", "8"] as const).map((tier) => (
                      <div key={tier}>
                        <label className="block text-[10px] text-slate-400 mb-1">
                          {tier} {isUk ? "стор. (₴)" : "стр. (₴)"}
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={svc.tiers?.[tier] ?? svc.basePriceUah}
                          onChange={(e) =>
                            updateServiceTier(id, tier, Number(e.target.value))
                          }
                          className="h-9 w-full rounded-lg border border-white/15 bg-[#0b1020] px-2.5 text-xs font-mono text-white"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {isUk ? "Базова ціна (₴)" : "Базовая цена (₴)"}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={svc.basePriceUah}
                        onChange={(e) =>
                          updateServiceField(id, {
                            basePriceUah: Number(e.target.value),
                          })
                        }
                        className="h-9 w-full rounded-lg border border-white/15 bg-[#0b1020] px-2.5 text-xs font-mono text-white"
                      />
                    </div>
                    {svc.tiers &&
                      Object.entries(svc.tiers).map(([tk, tv]) => (
                        <div key={tk}>
                          <label className="block text-[10px] text-slate-400 mb-1">
                            Tier: {tk} (₴)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={tv}
                            onChange={(e) =>
                              updateServiceTier(id, tk, Number(e.target.value))
                            }
                            className="h-9 w-full rounded-lg border border-white/15 bg-[#0b1020] px-2.5 text-xs font-mono text-white"
                          />
                        </div>
                      ))}
                  </div>
                )}

                {/* Collapsible Bilingual Texts Editor */}
                <div className="border-t border-white/10 pt-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTexts((prev) => ({
                          ...prev,
                          [id]: !prev[id],
                        }))
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200 hover:text-amber-100"
                    >
                      <FileEdit className="h-3.5 w-3.5" />
                      {isUk ? "Тексти послуги (UA / RU)" : "Тексты услуги (UA / RU)"}
                      {textsOpen ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {textsOpen && (
                      <button
                        type="button"
                        onClick={() => resetServiceTextsToDefault(id)}
                        className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/10"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {isUk ? "За замовчуванням" : "По умолчанию"}
                      </button>
                    )}
                  </div>

                  {textsOpen && (
                    <div className="mt-3 space-y-3 text-[11px]">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Заголовок (UA)
                          </label>
                          <input
                            value={svc.title.uk}
                            onChange={(e) =>
                              updateServiceBilingual(id, "title", "uk", e.target.value)
                            }
                            className="h-8 w-full rounded-lg border border-white/15 bg-[#0b1020] px-2.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Заголовок (RU)
                          </label>
                          <input
                            value={svc.title.ru}
                            onChange={(e) =>
                              updateServiceBilingual(id, "title", "ru", e.target.value)
                            }
                            className="h-8 w-full rounded-lg border border-white/15 bg-[#0b1020] px-2.5 text-white"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Бейдж (UA)
                          </label>
                          <input
                            value={svc.badgeLabel?.uk ?? def.badgeLabel?.uk ?? ""}
                            onChange={(e) =>
                              updateServiceBilingual(
                                id,
                                "badgeLabel",
                                "uk",
                                e.target.value
                              )
                            }
                            className="h-8 w-full rounded-lg border border-white/15 bg-[#0b1020] px-2.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Бейдж (RU)
                          </label>
                          <input
                            value={svc.badgeLabel?.ru ?? def.badgeLabel?.ru ?? ""}
                            onChange={(e) =>
                              updateServiceBilingual(
                                id,
                                "badgeLabel",
                                "ru",
                                e.target.value
                              )
                            }
                            className="h-8 w-full rounded-lg border border-white/15 bg-[#0b1020] px-2.5 text-white"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Опис (UA)
                          </label>
                          <textarea
                            rows={2}
                            value={svc.description.uk}
                            onChange={(e) =>
                              updateServiceBilingual(
                                id,
                                "description",
                                "uk",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-white/15 bg-[#0b1020] p-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Описание (RU)
                          </label>
                          <textarea
                            rows={2}
                            value={svc.description.ru}
                            onChange={(e) =>
                              updateServiceBilingual(
                                id,
                                "description",
                                "ru",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-white/15 bg-[#0b1020] p-2 text-white"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Кнопка CTA (UA)
                          </label>
                          <input
                            value={svc.ctaLabel?.uk ?? def.ctaLabel?.uk ?? ""}
                            onChange={(e) =>
                              updateServiceBilingual(id, "ctaLabel", "uk", e.target.value)
                            }
                            className="h-8 w-full rounded-lg border border-white/15 bg-[#0b1020] px-2.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Кнопка CTA (RU)
                          </label>
                          <input
                            value={svc.ctaLabel?.ru ?? def.ctaLabel?.ru ?? ""}
                            onChange={(e) =>
                              updateServiceBilingual(id, "ctaLabel", "ru", e.target.value)
                            }
                            className="h-8 w-full rounded-lg border border-white/15 bg-[#0b1020] px-2.5 text-white"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="block text-slate-400 mb-1">
                            {isUk
                              ? "Пункти переваг (UA, по 1 на рядок)"
                              : "Пункты преимуществ (UA, по 1 на строку)"}
                          </label>
                          <textarea
                            rows={3}
                            value={(svc.features?.uk ?? def.features?.uk ?? []).join("\n")}
                            onChange={(e) =>
                              updateServiceFeatures(id, "uk", e.target.value)
                            }
                            className="w-full rounded-lg border border-white/15 bg-[#0b1020] p-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">
                            {isUk
                              ? "Пункти переваг (RU, по 1 на рядок)"
                              : "Пункты преимуществ (RU, по 1 на строку)"}
                          </label>
                          <textarea
                            rows={3}
                            value={(svc.features?.ru ?? def.features?.ru ?? []).join("\n")}
                            onChange={(e) =>
                              updateServiceFeatures(id, "ru", e.target.value)
                            }
                            className="w-full rounded-lg border border-white/15 bg-[#0b1020] p-2 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Limits + AI Rates */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-6 space-y-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-amber-100">
            <Sliders className="h-4 w-4 text-amber-300" />
            {isUk ? "Ліміти платформи" : "Лимиты платформы"}
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">
                {isUk ? "Макс. прев'ю на сесію" : "Макс. превью на сессию"}
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={limits.maxPreviewOrdersPerSession}
                onChange={(e) => {
                  setDirty(true);
                  setLimits({
                    ...limits,
                    maxPreviewOrdersPerSession: Number(e.target.value),
                  });
                }}
                className="h-9 w-full rounded-lg border border-white/15 bg-[#0b1020] px-3 font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                {isUk ? "ІІ-правок на казку" : "ИИ-правок на сказку"}
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={limits.maxAiEditsPerBook}
                onChange={(e) => {
                  setDirty(true);
                  setLimits({
                    ...limits,
                    maxAiEditsPerBook: Number(e.target.value),
                  });
                }}
                className="h-9 w-full rounded-lg border border-white/15 bg-[#0b1020] px-3 font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                {isUk ? "ІІ-правок на відео" : "ИИ-правок на видео"}
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={limits.maxAiEditsPerVideo}
                onChange={(e) => {
                  setDirty(true);
                  setLimits({
                    ...limits,
                    maxAiEditsPerVideo: Number(e.target.value),
                  });
                }}
                className="h-9 w-full rounded-lg border border-white/15 bg-[#0b1020] px-3 font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                {isUk ? "Зберігання файлів (днів)" : "Хранение файлов (дней)"}
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={limits.orderRetentionDays}
                onChange={(e) => {
                  setDirty(true);
                  setLimits({
                    ...limits,
                    orderRetentionDays: Number(e.target.value),
                  });
                }}
                className="h-9 w-full rounded-lg border border-white/15 bg-[#0b1020] px-3 font-mono text-white"
              />
            </div>
          </div>
        </div>

        {/* AI Rates */}
        <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-6 space-y-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-amber-100">
            <Cpu className="h-4 w-4 text-sky-300" />
            {isUk
              ? "Курси та тарифи ШІ (для розрахунку маржі)"
              : "Курсы и тарифы ИИ (для расчёта маржи)"}
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">USD → UAH</label>
              <input
                type="number"
                step="0.1"
                value={aiRates.usdToUah}
                onChange={(e) => {
                  setDirty(true);
                  setAiRates({ ...aiRates, usdToUah: Number(e.target.value) });
                }}
                className="h-9 w-full rounded-lg border border-white/15 bg-[#0b1020] px-3 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">
                ElevenLabs ($ / 1k chars)
              </label>
              <input
                type="number"
                step="0.01"
                value={aiRates.elevenLabsPer1kCharsUsd}
                onChange={(e) => {
                  setDirty(true);
                  setAiRates({
                    ...aiRates,
                    elevenLabsPer1kCharsUsd: Number(e.target.value),
                  });
                }}
                className="h-9 w-full rounded-lg border border-white/15 bg-[#0b1020] px-3 font-mono text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            {(
              [
                "medium:1024x1024",
                "medium:1536x1024",
                "medium:1024x1536",
              ] as const
            ).map((k) => (
              <div key={k}>
                <label className="block text-slate-400 mb-1">{k} ($)</label>
                <input
                  type="number"
                  step="0.001"
                  value={aiRates.imagePerCallUsd[k] ?? 0.042}
                  onChange={(e) => {
                    setDirty(true);
                    setAiRates({
                      ...aiRates,
                      imagePerCallUsd: {
                        ...aiRates.imagePerCallUsd,
                        [k]: Number(e.target.value),
                      },
                    });
                  }}
                  className="h-8 w-full rounded-lg border border-white/15 bg-[#0b1020] px-2 font-mono text-white"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health (Read-Only, no secrets) */}
      <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-6 space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-amber-100">
          <Server className="h-4 w-4 text-emerald-400" />
          {isUk ? "Стан інтеграцій (.env.local)" : "Состояние интеграций (.env.local)"}
        </h3>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-slate-400">OpenAI</div>
            <div className="mt-1 flex items-center gap-1.5 font-semibold text-white">
              <CheckCircle2
                className={`h-3.5 w-3.5 ${
                  system.hasOpenAI ? "text-emerald-400" : "text-amber-300"
                }`}
              />
              {system.hasOpenAI ? system.textModel : "Demo mode"}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-400">
              {system.directorModel} · {system.imageModel} ({system.imageQuality})
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-slate-400">ElevenLabs</div>
            <div className="mt-1 font-semibold text-white">
              {system.hasElevenLabs ? "Connected" : "Fallback audio"}
            </div>
            <div className="mt-0.5 truncate text-[10px] text-slate-400">
              Voice: {system.elevenLabsVoiceId}
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-slate-400">Plata by mono</div>
            <div className="mt-1 font-semibold text-white">
              {system.monoSandbox ? "Sandbox mode" : "Live merchant"}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-400">
              Token: {system.monoTokenConfigured ? "configured" : "missing"}
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-slate-400">Email & Telegram</div>
            <div className="mt-1 font-semibold text-white">{system.emailTransport}</div>
            <div className="mt-0.5 text-[10px] text-slate-400">
              TG: {system.telegramBotUsername ? `@${system.telegramBotUsername}` : "not set"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
