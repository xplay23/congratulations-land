"use client";

import React from "react";
import { useField } from "@payloadcms/ui";
import ModelSelect from "../ModelSelect";

export default function ElevenLabsModelField({
  path,
  field,
}: {
  path?: string;
  field?: {
    name?: string;
    label?: string | Record<string, string>;
    admin?: { width?: string };
  };
}) {
  const fieldPath = path || field?.name || "modelId";
  const { value } = useField<string>({ path: fieldPath });
  const width = field?.admin?.width;

  return (
    <div
      className="field-type text"
      style={{
        flex: width ? `1 1 ${width}` : undefined,
        width,
        minWidth: width ? "180px" : undefined,
      }}
    >
      <input type="hidden" value={value ?? ""} onChange={() => {}} />
      <ModelSelect
        modelFieldPath={fieldPath}
        fixedProvider="elevenlabs"
        apiKeyFieldPath="apiKey"
        fallbackScope="elevenlabs"
        imageMode={false}
      />
    </div>
  );
}
