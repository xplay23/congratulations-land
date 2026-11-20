"use client";

import React from "react";
import { useField } from "@payloadcms/ui";
import ModelSelect from "../ModelSelect";

export default function StorybookDirectorModelField() {
  const { value } = useField<string>({ path: "directorModel" });
  return (
    <>
      <input type="hidden" value={value ?? ""} onChange={() => {}} />
      <ModelSelect
        modelFieldPath="directorModel"
        providerFieldPath="directorProvider"
        apiKeyFieldPath="directorApiKey"
        fallbackScope="ai-text"
        imageMode={false}
      />
    </>
  );
}
