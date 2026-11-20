"use client";

import { useState } from "react";
import { useTranslation } from "@payloadcms/ui";
import { resolveAdminLang } from "@engine/lib/admin-i18n";

export default function AdminLangSwitcher() {
  const { i18n, switchLanguage } = useTranslation();
  const [busy, setBusy] = useState(false);
  const current = resolveAdminLang(i18n?.language);

  async function handleSwitch(next: "ru" | "uk") {
    if (busy || !switchLanguage || next === current) return;
    setBusy(true);
    try {
      await switchLanguage(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
        padding: "2px",
        borderRadius: "var(--adm-radius-sm, 6px)",
        border: "1px solid var(--theme-border-color, rgba(255,255,255,0.12))",
        background: "var(--theme-elevation-50, rgba(255,255,255,0.03))",
      }}
      title={current === "uk" ? "Мова інтерфейсу адмінки" : "Язык интерфейса админки"}
    >
      {(
        [
          { code: "ru", label: "RU" },
          { code: "uk", label: "UA" },
        ] as const
      ).map((item) => {
        const active = current === item.code;
        return (
          <button
            key={item.code}
            type="button"
            disabled={busy}
            onClick={() => void handleSwitch(item.code)}
            style={{
              border: "none",
              borderRadius: "4px",
              padding: "3px 8px",
              fontSize: "12px",
              fontWeight: active ? 700 : 500,
              cursor: busy ? "wait" : "pointer",
              background: active
                ? "var(--theme-elevation-200, rgba(255,255,255,0.14))"
                : "transparent",
              color: active ? "var(--theme-text)" : "var(--adm-color-muted)",
              opacity: active ? 1 : 0.75,
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
