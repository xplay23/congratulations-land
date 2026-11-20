"use client";

import React from "react";
import { LanguageProvider } from "@/components/LanguageContext";
import { PricingProvider } from "@/components/PricingContext";

export function AdminClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider initialLang="uk">
      <PricingProvider>
        <div className="vv-admin-tw">{children}</div>
      </PricingProvider>
    </LanguageProvider>
  );
}
