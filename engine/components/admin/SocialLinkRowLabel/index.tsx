"use client";

import { useRowLabel } from "@payloadcms/ui";
import { useAdminLang } from "@engine/lib/admin-i18n";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  twitter: "Twitter / X",
  pinterest: "Pinterest",
  viber: "Viber",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  github: "GitHub",
  other: "Другая",
};

type SocialLinkData = {
  platform?: string | null;
  label?: string | null;
  url?: string | null;
};

export default function SocialLinkRowLabel() {
  const { data, rowNumber } = useRowLabel<SocialLinkData>();
  const lang = useAdminLang();

  const customLabel = data?.label?.trim();
  const platformLabel = data?.platform
    ? data.platform === "other"
      ? lang === "uk"
        ? "Інша"
        : "Другая"
      : PLATFORM_LABELS[data.platform] ?? data.platform
    : null;

  const title = customLabel || platformLabel;
  const fallback =
    lang === "uk"
      ? `Соцмережа ${String((rowNumber ?? 0) + 1).padStart(2, "0")}`
      : `Соцсеть ${String((rowNumber ?? 0) + 1).padStart(2, "0")}`;

  if (title && data?.url) {
    return (
      <>
        {title} — {data.url}
      </>
    );
  }
  return <>{title ?? fallback}</>;
}
