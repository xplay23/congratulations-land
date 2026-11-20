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
    admin?: { description?: string | Record<string, string>; step?: number };
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
    <div className="field-type number" style={{ marginBottom: "20px" }}>
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
          gap: "14px",
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
          className="field-type__input"
          style={{
            width: "96px",
            flexShrink: 0,
            fontFamily: "monospace",
            fontSize: "var(--adm-fs-body, 14px)",
            textAlign: "right",
            padding: "7px 10px",
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
