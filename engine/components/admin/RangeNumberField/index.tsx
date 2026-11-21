"use client";

import React from "react";
import { FieldDescription, FieldLabel, useField } from "@payloadcms/ui";
import type { NumberFieldClientProps } from "payload";

interface RangeFieldConfig {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

export function RangeNumberField({ field, path }: NumberFieldClientProps) {
  const fieldPath = path ?? (field as { name: string }).name;
  const { value, setValue } = useField<number>({ path: fieldPath });

  const cfg = field as unknown as RangeFieldConfig & {
    label?: string | Record<string, string>;
    required?: boolean;
    admin?: {
      description?: string | Record<string, string>;
      step?: number;
      width?: string;
    };
  };

  const min = typeof cfg.min === "number" ? cfg.min : 0;
  const max = typeof cfg.max === "number" ? cfg.max : 1;
  const step =
    typeof cfg.admin?.step === "number"
      ? cfg.admin.step
      : typeof cfg.step === "number"
      ? cfg.step
      : 0.01;
  const fallback = typeof cfg.defaultValue === "number" ? cfg.defaultValue : min;
  const numericVal =
    typeof value === "number" && Number.isFinite(value) ? value : fallback;

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const handleNumberChange = (raw: string) => {
    if (raw === "") return;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      setValue(clamp(Math.round(parsed * 1000) / 1000));
    }
  };

  return (
    <div
      className="field-type number"
      style={{
        marginBottom: "16px",
        flex: cfg.admin?.width ? `1 1 ${cfg.admin.width}` : undefined,
        width: cfg.admin?.width,
        minWidth: cfg.admin?.width ? "170px" : undefined,
      }}
    >
      <FieldLabel
        label={cfg.label}
        path={fieldPath}
        required={Boolean(cfg.required)}
      />
      <div
        className="field-type__wrap"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          minHeight: "40px",
        }}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numericVal}
          onChange={(e) => setValue(clamp(Number(e.target.value)))}
          style={{
            flex: 1,
            minWidth: "80px",
            cursor: "pointer",
            accentColor: "var(--adm-color-blue, #3b82f6)",
            height: "6px",
          }}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={numericVal}
          onChange={(e) => handleNumberChange(e.target.value)}
          style={{
            width: "62px",
            height: "30px",
            flexShrink: 0,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "12.5px",
            fontWeight: 600,
            textAlign: "center",
            padding: "4px 6px",
            borderRadius: "6px",
            border: "1px solid var(--theme-elevation-200)",
            background: "var(--theme-input-bg, var(--theme-elevation-50))",
            color: "var(--theme-text)",
            boxSizing: "border-box",
          }}
        />
      </div>
      {cfg.admin?.description && (
        <FieldDescription description={cfg.admin.description} path={fieldPath} />
      )}
    </div>
  );
}

export default RangeNumberField;
