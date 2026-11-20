"use client";

import { useTranslation } from "@payloadcms/ui";

export type AdminLang = "ru" | "uk";

export function resolveAdminLang(code?: string | null): AdminLang {
  if (code === "uk") return "uk";
  return "ru";
}

export function useAdminLang(): AdminLang {
  const { i18n } = useTranslation();
  return resolveAdminLang(i18n?.language);
}

export function tAdmin(lang: AdminLang, ru: string, uk: string): string {
  return lang === "uk" ? uk : ru;
}
