"use client";

import React from "react";
import { useField } from "@payloadcms/ui";
import ModelSelect from "../ModelSelect";

export default function ElevenLabsModelField() {
  const { value } = useField<string>({ path: "modelId" });
  return (
    <>
      <input type="hidden" value={value ?? ""} onChange={() => {}} />
      <ModelSelect
        modelFieldPath="modelId"
        fixedProvider="elevenlabs"
        apiKeyFieldPath="apiKey"
        fallbackScope="elevenlabs"
        imageMode={false}
      />
    </>
  );
}
