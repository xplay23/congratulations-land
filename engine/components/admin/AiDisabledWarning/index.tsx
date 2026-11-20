"use client";

import React from "react";
import { useFormFields } from "@payloadcms/ui";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";

export function AiDisabledWarning() {
  const lang = useAdminLang();
  const enabled = useFormFields(([f]) => f["enabled"]?.value) as
    | boolean
    | undefined;

  if (enabled) return null;

  return (
    <div
      style={{
        marginBottom: "12px",
        padding: "10px 14px",
        backgroundColor: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.35)",
        borderRadius: "var(--adm-radius-sm, 6px)",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        fontSize: "var(--adm-fs-caption, 13px)",
        lineHeight: 1.5,
        color: "var(--adm-color-red, #ef4444)",
      }}
    >
      <span style={{ flexShrink: 0, fontWeight: 700 }}>✕</span>
      <span>
        <strong>
          {tAdmin(lang, "ИИ-генерация отключена.", "ШІ-генерацію вимкнено.")}
        </strong>{" "}
        {tAdmin(
          lang,
          "Кнопки генерации и перевода в админке скрыты. Включите переключатель выше и настройте провайдера.",
          "Кнопки генерації та перекладу в адмінці приховані. Увімкніть перемикач вище та налаштуйте провайдера."
        )}
      </span>
    </div>
  );
}
