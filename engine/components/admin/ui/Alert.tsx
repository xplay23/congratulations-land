import type { ReactNode } from "react";
import { C } from "./tokens";

export type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
}

const VARIANT_STYLES: Record<
  AlertVariant,
  { color: string; bg: string; border: string }
> = {
  info: {
    color: C.blue,
    bg: `color-mix(in srgb, ${C.blue} 10%, transparent)`,
    border: `color-mix(in srgb, ${C.blue} 30%, transparent)`,
  },
  success: {
    color: C.green,
    bg: `color-mix(in srgb, ${C.green} 10%, transparent)`,
    border: `color-mix(in srgb, ${C.green} 30%, transparent)`,
  },
  warning: {
    color: C.amber,
    bg: `color-mix(in srgb, ${C.amber} 10%, transparent)`,
    border: `color-mix(in srgb, ${C.amber} 30%, transparent)`,
  },
  error: {
    color: C.red,
    bg: `color-mix(in srgb, ${C.red} 10%, transparent)`,
    border: `color-mix(in srgb, ${C.red} 30%, transparent)`,
  },
};

const VARIANT_ICON: Record<AlertVariant, string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  error: "✕",
};

export function Alert({
  variant = "info",
  title,
  children,
  action,
  onDismiss,
}: AlertProps) {
  const s = VARIANT_STYLES[variant];

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "14px 16px",
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: "var(--adm-radius)",
        marginBottom: "16px",
      }}
    >
      <span
        style={{
          fontSize: "var(--adm-fs-body)",
          color: s.color,
          flexShrink: 0,
          marginTop: "1px",
          fontWeight: 700,
        }}
      >
        {VARIANT_ICON[variant]}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div
            style={{
              fontSize: "var(--adm-fs-body)",
              fontWeight: 600,
              color: s.color,
              marginBottom: children ? "4px" : 0,
            }}
          >
            {title}
          </div>
        )}
        <div
          style={{
            fontSize: "var(--adm-fs-caption)",
            color: C.text,
            opacity: 0.9,
            lineHeight: 1.5,
          }}
        >
          {children}
        </div>
        {action && <div style={{ marginTop: "8px" }}>{action}</div>}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: s.color,
            opacity: 0.7,
            fontSize: "var(--adm-fs-body)",
            padding: 0,
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
