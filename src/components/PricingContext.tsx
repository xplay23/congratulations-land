"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  DEFAULT_PRICING_CONFIG,
  getServicePriceFromConfig,
  getStorybookPriceFromConfig,
} from "@/lib/pricing-defaults";
import type { PricingConfig, ServiceId } from "@/lib/types";

interface PricingContextValue {
  pricing: PricingConfig;
  getStorybookPrice: (pageCount?: number) => number;
  getVideoPrice: () => number;
  getServicePrice: (
    serviceId: ServiceId,
    options?: { pageCount?: number; tierKey?: string }
  ) => number;
  refreshPricing: () => Promise<void>;
}

const PricingContext = createContext<PricingContextValue | null>(null);

export function PricingProvider({
  initialPricing,
  children,
}: {
  initialPricing?: PricingConfig;
  children: React.ReactNode;
}) {
  const [pricing, setPricing] = useState<PricingConfig>(
    initialPricing || DEFAULT_PRICING_CONFIG
  );

  const refreshPricing = useCallback(async () => {
    try {
      const res = await fetch("/api/config/pricing", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as PricingConfig;
      if (data?.services) {
        setPricing(data);
      }
    } catch {
      // Ignore transient network errors
    }
  }, []);

  useEffect(() => {
    void refreshPricing();
    const onFocus = () => void refreshPricing();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshPricing]);

  const getStorybookPrice = useCallback(
    (pageCount?: number) => getStorybookPriceFromConfig(pricing, pageCount),
    [pricing]
  );

  const getVideoPrice = useCallback(
    () => getServicePriceFromConfig(pricing, "video"),
    [pricing]
  );

  const getServicePrice = useCallback(
    (serviceId: ServiceId, options?: { pageCount?: number; tierKey?: string }) =>
      getServicePriceFromConfig(pricing, serviceId, options),
    [pricing]
  );

  return (
    <PricingContext.Provider
      value={{
        pricing,
        getStorybookPrice,
        getVideoPrice,
        getServicePrice,
        refreshPricing,
      }}
    >
      {children}
    </PricingContext.Provider>
  );
}

export function usePricing() {
  const ctx = useContext(PricingContext);
  if (!ctx) {
    return {
      pricing: DEFAULT_PRICING_CONFIG,
      getStorybookPrice: (pageCount?: number) =>
        getStorybookPriceFromConfig(DEFAULT_PRICING_CONFIG, pageCount),
      getVideoPrice: () => getServicePriceFromConfig(DEFAULT_PRICING_CONFIG, "video"),
      getServicePrice: (
        serviceId: ServiceId,
        options?: { pageCount?: number; tierKey?: string }
      ) => getServicePriceFromConfig(DEFAULT_PRICING_CONFIG, serviceId, options),
      refreshPricing: async () => {},
    };
  }
  return ctx;
}
