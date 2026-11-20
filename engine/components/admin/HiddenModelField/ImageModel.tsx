"use client";

import React from "react";
import { useField } from "@payloadcms/ui";
import ModelSelect from "../ModelSelect";

export default function ImageModelField() {
  const { value } = useField<string>({ path: "imageModel" });
  return (
    <>
      <input type="hidden" value={value ?? ""} onChange={() => {}} />
      <ModelSelect
        modelFieldPath="imageModel"
        providerFieldPath="imageProvider"
        apiKeyFieldPath="imageApiKey"
        fallbackScope="ai-image"
        imageMode={true}
      />
    </>
  );
}
