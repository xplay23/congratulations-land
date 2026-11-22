"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
} from "./CookieConsent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics({
  measurementId,
  containerId,
}: {
  measurementId?: string;
  containerId?: string;
}) {
  const gaId = /^G-[A-Z0-9]+$/.test(measurementId || "") ? measurementId : undefined;
  const gtmId = /^GTM-[A-Z0-9]+$/.test(containerId || "") ? containerId : undefined;
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const initialized = useRef(false);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const readConsent = () => {
      try {
        const consent = JSON.parse(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) || "null");
        setAllowed(consent?.analytics === true);
      } catch {
        setAllowed(false);
      }
    };
    const onConsent = (event: Event) => {
      setAllowed((event as CustomEvent<{ analytics: boolean }>).detail.analytics);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === COOKIE_CONSENT_STORAGE_KEY || event.key === null) readConsent();
    };
    readConsent();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsent);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsent);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!gaId && !gtmId) return;
    if (gaId) {
      (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = !allowed;
    }
    if (!allowed) {
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
      lastPath.current = null;
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer!.push(arguments); };
    if (!initialized.current) {
      window.gtag("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      if (gtmId) window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      window.gtag("js", new Date());
      if (gaId) window.gtag("config", gaId, { send_page_view: false });
      initialized.current = true;
    }
    window.gtag("consent", "update", { analytics_storage: "granted" });

    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const safePath = pathname.replace(/\/orders\/[^/]+/, "/orders/detail");
    const page = {
      page_path: safePath,
      page_location: `${window.location.origin}${safePath}`,
      page_referrer: document.referrer.split(/[?#]/)[0],
    };
    if (gaId) window.gtag("event", "page_view", { ...page, send_to: gaId });
    if (gtmId) window.dataLayer.push({ event: "virtual_page_view", ...page });
  }, [allowed, pathname, gaId, gtmId]);

  if (!allowed) return null;
  return (
    <>
      {gtmId && <Script id="google-tag-manager" src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`} strategy="afterInteractive" />}
      {gaId && <Script id="google-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />}
    </>
  );
}
