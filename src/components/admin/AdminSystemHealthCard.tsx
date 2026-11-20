"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { C, Card, SectionLabel } from "@engine/components/admin/ui";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";

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
}

export function AdminSystemHealthCard() {
  const lang = useAdminLang();
  const [system, setSystem] = useState<SystemHealth | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.system) setSystem(data.system as SystemHealth);
      })
      .catch(() => {
        // non-blocking health widget
      });
    return () => {
      active = false;
    };
  }, []);

  if (!system) return null;

  return (
    <Card>
      <SectionLabel>
        {tAdmin(lang, "Состояние интеграций", "Стан інтеграцій")}
      </SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
          marginTop: "14px",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "var(--adm-radius)",
            background: C.surface,
            border: `1px solid ${C.cardBorder}`,
          }}
        >
          <div className="adm-label" style={{ color: C.muted, opacity: 0.7 }}>
            OpenAI / AI Storybooks
          </div>
          <div
            className="adm-body"
            style={{
              marginTop: "6px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 600,
              color: C.text,
            }}
          >
            <CheckCircle2
              size={15}
              style={{ color: system.hasOpenAI ? C.green : C.amber }}
            />
            {system.hasOpenAI ? system.textModel : "Demo mode"}
          </div>
          <div
            className="adm-caption"
            style={{ color: C.muted, marginTop: "4px" }}
          >
            {system.directorModel} · {system.imageModel} ({system.imageQuality})
          </div>
        </div>

        <div
          style={{
            padding: "14px 16px",
            borderRadius: "var(--adm-radius)",
            background: C.surface,
            border: `1px solid ${C.cardBorder}`,
          }}
        >
          <div className="adm-label" style={{ color: C.muted, opacity: 0.7 }}>
            ElevenLabs
          </div>
          <div
            className="adm-body"
            style={{ marginTop: "6px", fontWeight: 600, color: C.text }}
          >
            {system.hasElevenLabs ? "Connected" : "Fallback audio"}
          </div>
          <div
            className="adm-caption"
            style={{
              color: C.muted,
              marginTop: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Voice: {system.elevenLabsVoiceId}
          </div>
        </div>

        <div
          style={{
            padding: "14px 16px",
            borderRadius: "var(--adm-radius)",
            background: C.surface,
            border: `1px solid ${C.cardBorder}`,
          }}
        >
          <div className="adm-label" style={{ color: C.muted, opacity: 0.7 }}>
            Plata by mono
          </div>
          <div
            className="adm-body"
            style={{ marginTop: "6px", fontWeight: 600, color: C.text }}
          >
            {system.monoSandbox ? "Sandbox mode" : "Live merchant"}
          </div>
          <div
            className="adm-caption"
            style={{ color: C.muted, marginTop: "4px" }}
          >
            Token: {system.monoTokenConfigured ? "configured" : "missing"}
          </div>
        </div>

        <div
          style={{
            padding: "14px 16px",
            borderRadius: "var(--adm-radius)",
            background: C.surface,
            border: `1px solid ${C.cardBorder}`,
          }}
        >
          <div className="adm-label" style={{ color: C.muted, opacity: 0.7 }}>
            Email & Telegram
          </div>
          <div
            className="adm-body"
            style={{ marginTop: "6px", fontWeight: 600, color: C.text }}
          >
            {system.emailTransport}
          </div>
          <div
            className="adm-caption"
            style={{ color: C.muted, marginTop: "4px" }}
          >
            TG:{" "}
            {system.telegramBotUsername
              ? `@${system.telegramBotUsername}`
              : "not set"}
          </div>
        </div>
      </div>
    </Card>
  );
}
