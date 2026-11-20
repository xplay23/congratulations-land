"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileEdit,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  Alert,
  Button,
  C,
  Card,
  Checkbox,
  Input,
  SectionLabel,
} from "@engine/components/admin/ui";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";
import { usePricing } from "@/components/PricingContext";
import { DEFAULT_PRICING_CONFIG, SERVICE_ORDER } from "@/lib/pricing-defaults";
import type { AiRatesConfig, PricingConfig, ServiceId } from "@/lib/types";

function FieldLabelText({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="adm-caption"
      style={{
        display: "block",
        color: C.muted,
        marginBottom: "6px",
        fontWeight: 500,
      }}
    >
      {children}
    </label>
  );
}

const TEXTAREA_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "var(--adm-radius-sm)",
  border: "1px solid var(--theme-border-color, rgba(255,255,255,0.1))",
  background: "var(--theme-elevation-50, #18181b)",
  color: "var(--theme-text)",
  fontSize: "var(--adm-fs-caption)",
  lineHeight: 1.5,
  resize: "vertical",
  fontFamily: "inherit",
};

export function AdminSettingsTab() {
  const lang = useAdminLang();
  const isUk = lang === "uk";
  const { refreshPricing } = usePricing();

  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [aiRates, setAiRates] = useState<AiRatesConfig | null>(null);
  const [expandedTexts, setExpandedTexts] = useState<Record<string, boolean>>(
    {}
  );
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed loading settings");
      setPricing(data.pricing);
      setAiRates(data.aiRates);
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
    if (!pricing || !aiRates) return;
    setSaving(true);
    setNotice(null);
    try {
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
          aiRates,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed saving settings");
      setPricing(data.pricing);
      setAiRates(data.aiRates);
      setDirty(false);
      await refreshPricing();
      setNotice({
        ok: true,
        text: tAdmin(
          lang,
          "Настройки сохранены и применены на витрине.",
          "Налаштування збережено та застосовано на вітрині."
        ),
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

  if (loading || !pricing || !aiRates) {
    return (
      <Card style={{ padding: "48px 24px", textAlign: "center", color: C.muted }}>
        <span className="adm-body">
          {tAdmin(lang, "Загрузка конфигурации…", "Завантаження конфігурації…")}
        </span>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {notice && (
        <Alert
          variant={notice.ok ? "success" : "error"}
          onDismiss={() => setNotice(null)}
        >
          {notice.text}
        </Alert>
      )}

      {dirty && (
        <div
          style={{
            position: "sticky",
            top: "12px",
            zIndex: 30,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "14px 18px",
            borderRadius: "var(--adm-radius-lg)",
            background: C.card,
            border: `1px solid ${C.blue}`,
            boxShadow: "0 8px 28px rgba(0, 0, 0, 0.35)",
          }}
        >
          <span className="adm-body" style={{ color: C.text, fontWeight: 500 }}>
            {tAdmin(
              lang,
              "Есть несохранённые изменения — нажмите «Сохранить», чтобы обновить витрину.",
              "Є незбережені зміни — натисніть «Зберегти», щоб оновити вітрину."
            )}
          </span>
          <Button
            variant="primary"
            disabled={saving}
            onClick={() => void handleSaveAll()}
          >
            <Save size={14} />
            {saving
              ? tAdmin(lang, "Сохранение…", "Збереження…")
              : tAdmin(lang, "Сохранить сейчас", "Зберегти зараз")}
          </Button>
        </div>
      )}

      {/* Services & Dynamic Pricing */}
      <Card>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "var(--adm-fs-heading)",
                fontWeight: 700,
                color: C.text,
              }}
            >
              {tAdmin(
                lang,
                "Тарифы, видимость и тексты услуг",
                "Тарифи, видимість та тексти послуг"
              )}
            </h2>
            <p
              className="adm-caption"
              style={{ margin: "4px 0 0", color: C.muted }}
            >
              {tAdmin(
                lang,
                "Изменения сразу обновляют главную страницу, навигацию, конструкторы и новые заказы.",
                "Зміни миттєво оновлюють головну сторінку, навігацію, конструктори та нові замовлення."
              )}
            </p>
          </div>

          <Button
            variant="primary"
            disabled={saving}
            onClick={() => void handleSaveAll()}
          >
            <Save size={14} />
            {saving
              ? tAdmin(lang, "Сохранение…", "Збереження…")
              : tAdmin(lang, "Сохранить все настройки", "Зберегти всі налаштування")}
          </Button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "16px",
          }}
        >
          {SERVICE_ORDER.map((id) => {
            const svc = pricing.services[id];
            const def = DEFAULT_PRICING_CONFIG.services[id];
            const textsOpen = Boolean(expandedTexts[id]);

            return (
              <div
                key={id}
                style={{
                  padding: "16px 18px",
                  borderRadius: "var(--adm-radius-lg)",
                  background: C.surface,
                  border: `1px solid ${C.cardBorder}`,
                  opacity: svc.enabled ? 1 : 0.72,
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        className="adm-badge"
                        style={{
                          padding: "2px 8px",
                          borderRadius: "var(--adm-radius-pill)",
                          background: "var(--theme-elevation-150)",
                          color: C.muted,
                          fontFamily: "monospace",
                        }}
                      >
                        {id}
                      </span>
                      {svc.comingSoon && (
                        <span
                          className="adm-badge"
                          style={{
                            padding: "2px 8px",
                            borderRadius: "var(--adm-radius-pill)",
                            background: `color-mix(in srgb, ${C.blue} 14%, transparent)`,
                            color: C.blue,
                          }}
                        >
                          {tAdmin(lang, "Запланировано", "Заплановано")}
                        </span>
                      )}
                      {!svc.enabled && (
                        <span
                          className="adm-badge"
                          style={{
                            padding: "2px 8px",
                            borderRadius: "var(--adm-radius-pill)",
                            background: `color-mix(in srgb, ${C.red} 14%, transparent)`,
                            color: C.red,
                          }}
                        >
                          {tAdmin(lang, "Скрыто", "Приховано")}
                        </span>
                      )}
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "var(--adm-fs-card-h3)",
                        fontWeight: 700,
                        color: C.text,
                      }}
                    >
                      {svc.title[isUk ? "uk" : "ru"]}
                    </h3>
                    <p
                      className="adm-caption"
                      style={{ margin: "4px 0 0", color: C.muted }}
                    >
                      {svc.description[isUk ? "uk" : "ru"]}
                    </p>
                  </div>

                  <Checkbox
                    checked={svc.enabled}
                    onChange={(checked) =>
                      updateServiceField(id, { enabled: checked })
                    }
                    label={svc.enabled ? "ON" : "OFF"}
                  />
                </div>

                {/* Prices */}
                {id === "storybook" && svc.tiers ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "10px",
                    }}
                  >
                    {(["4", "6", "8"] as const).map((tier) => (
                      <div key={tier}>
                        <FieldLabelText>
                          {tier} {tAdmin(lang, "стр. (₴)", "стор. (₴)")}
                        </FieldLabelText>
                        <Input
                          type="number"
                          min={1}
                          value={svc.tiers?.[tier] ?? svc.basePriceUah}
                          onChange={(val) =>
                            updateServiceTier(id, tier, Number(val))
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <FieldLabelText>
                        {tAdmin(lang, "Базовая цена (₴)", "Базова ціна (₴)")}
                      </FieldLabelText>
                      <Input
                        type="number"
                        min={1}
                        value={svc.basePriceUah}
                        onChange={(val) =>
                          updateServiceField(id, {
                            basePriceUah: Number(val),
                          })
                        }
                      />
                    </div>
                    {svc.tiers &&
                      Object.entries(svc.tiers).map(([tk, tv]) => (
                        <div key={tk}>
                          <FieldLabelText>Tier: {tk} (₴)</FieldLabelText>
                          <Input
                            type="number"
                            min={1}
                            value={tv}
                            onChange={(val) =>
                              updateServiceTier(id, tk, Number(val))
                            }
                          />
                        </div>
                      ))}
                  </div>
                )}

                {/* Collapsible Texts Editor */}
                <div
                  style={{
                    borderTop: `1px solid ${C.cardBorder}`,
                    paddingTop: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setExpandedTexts((prev) => ({
                          ...prev,
                          [id]: !prev[id],
                        }))
                      }
                    >
                      <FileEdit size={14} />
                      {tAdmin(
                        lang,
                        "Тексты услуги (UA / RU)",
                        "Тексти послуги (UA / RU)"
                      )}
                      {textsOpen ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </Button>

                    {textsOpen && (
                      <Button
                        variant="ghost"
                        onClick={() => resetServiceTextsToDefault(id)}
                      >
                        <RotateCcw size={13} />
                        {tAdmin(lang, "Сбросить", "Скинути")}
                      </Button>
                    )}
                  </div>

                  {textsOpen && (
                    <div
                      style={{
                        marginTop: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <FieldLabelText>Заголовок (UA)</FieldLabelText>
                          <Input
                            value={svc.title.uk}
                            onChange={(v) =>
                              updateServiceBilingual(id, "title", "uk", v)
                            }
                          />
                        </div>
                        <div>
                          <FieldLabelText>Заголовок (RU)</FieldLabelText>
                          <Input
                            value={svc.title.ru}
                            onChange={(v) =>
                              updateServiceBilingual(id, "title", "ru", v)
                            }
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <FieldLabelText>Бейдж (UA)</FieldLabelText>
                          <Input
                            value={
                              svc.badgeLabel?.uk ?? def.badgeLabel?.uk ?? ""
                            }
                            onChange={(v) =>
                              updateServiceBilingual(id, "badgeLabel", "uk", v)
                            }
                          />
                        </div>
                        <div>
                          <FieldLabelText>Бейдж (RU)</FieldLabelText>
                          <Input
                            value={
                              svc.badgeLabel?.ru ?? def.badgeLabel?.ru ?? ""
                            }
                            onChange={(v) =>
                              updateServiceBilingual(id, "badgeLabel", "ru", v)
                            }
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <FieldLabelText>Опис (UA)</FieldLabelText>
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
                            style={TEXTAREA_STYLE}
                          />
                        </div>
                        <div>
                          <FieldLabelText>Описание (RU)</FieldLabelText>
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
                            style={TEXTAREA_STYLE}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <FieldLabelText>Кнопка CTA (UA)</FieldLabelText>
                          <Input
                            value={svc.ctaLabel?.uk ?? def.ctaLabel?.uk ?? ""}
                            onChange={(v) =>
                              updateServiceBilingual(id, "ctaLabel", "uk", v)
                            }
                          />
                        </div>
                        <div>
                          <FieldLabelText>Кнопка CTA (RU)</FieldLabelText>
                          <Input
                            value={svc.ctaLabel?.ru ?? def.ctaLabel?.ru ?? ""}
                            onChange={(v) =>
                              updateServiceBilingual(id, "ctaLabel", "ru", v)
                            }
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <FieldLabelText>
                            {tAdmin(
                              lang,
                              "Преимущества (UA, по 1 на строку)",
                              "Переваги (UA, по 1 на рядок)"
                            )}
                          </FieldLabelText>
                          <textarea
                            rows={3}
                            value={(
                              svc.features?.uk ??
                              def.features?.uk ??
                              []
                            ).join("\n")}
                            onChange={(e) =>
                              updateServiceFeatures(id, "uk", e.target.value)
                            }
                            style={TEXTAREA_STYLE}
                          />
                        </div>
                        <div>
                          <FieldLabelText>
                            {tAdmin(
                              lang,
                              "Преимущества (RU, по 1 на строку)",
                              "Переваги (RU, по 1 на рядок)"
                            )}
                          </FieldLabelText>
                          <textarea
                            rows={3}
                            value={(
                              svc.features?.ru ??
                              def.features?.ru ??
                              []
                            ).join("\n")}
                            onChange={(e) =>
                              updateServiceFeatures(id, "ru", e.target.value)
                            }
                            style={TEXTAREA_STYLE}
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
      </Card>

      {/* AI Rates */}
      <Card>
        <SectionLabel>
          {tAdmin(
            lang,
            "Курсы и тарифы ИИ (для расчёта маржи)",
            "Курси та тарифи ШІ (для розрахунку маржі)"
          )}
        </SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
            marginTop: "14px",
            marginBottom: "14px",
          }}
        >
          <div>
            <FieldLabelText>USD → UAH</FieldLabelText>
            <Input
              type="number"
              step={0.1}
              value={aiRates.usdToUah}
              onChange={(val) => {
                setDirty(true);
                setAiRates({ ...aiRates, usdToUah: Number(val) });
              }}
            />
          </div>
          <div>
            <FieldLabelText>ElevenLabs ($ / 1k chars)</FieldLabelText>
            <Input
              type="number"
              step={0.01}
              value={aiRates.elevenLabsPer1kCharsUsd}
              onChange={(val) => {
                setDirty(true);
                setAiRates({
                  ...aiRates,
                  elevenLabsPer1kCharsUsd: Number(val),
                });
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
          }}
        >
          {(
            [
              "medium:1024x1024",
              "medium:1536x1024",
              "medium:1024x1536",
            ] as const
          ).map((k) => (
            <div key={k}>
              <FieldLabelText>{k} ($)</FieldLabelText>
              <Input
                type="number"
                step={0.001}
                value={aiRates.imagePerCallUsd[k] ?? 0.042}
                onChange={(val) => {
                  setDirty(true);
                  setAiRates({
                    ...aiRates,
                    imagePerCallUsd: {
                      ...aiRates.imagePerCallUsd,
                      [k]: Number(val),
                    },
                  });
                }}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
