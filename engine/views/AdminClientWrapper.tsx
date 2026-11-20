"use client";

import React from "react";
import { PricingProvider } from "@/components/PricingContext";

export function AdminClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PricingProvider>{children}</PricingProvider>;
}
