"use client";

import React from "react";
import { useField } from "@payloadcms/ui";
import ModelSelect from "../ModelSelect";

export default function StorybookWriterModelField() {
  const { value } = useField<string>({ path: "writerModel" });
  return (
    <>
      <input type="hidden" value={value ?? ""} onChange={() => {}} />
      <ModelSelect
        modelFieldPath="writerModel"
        providerFieldPath="writerProvider"
        apiKeyFieldPath="writerApiKey"
        fallbackScope="ai-text"
        imageMode={false}
      />
    </>
  );
}
