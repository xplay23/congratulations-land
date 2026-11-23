"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getLocaleFromPathname,
  isUnlocalizedPath,
  localizeHref,
} from "@/lib/locale";
import type { Lang } from "@/lib/types";

export interface SetLangOptions {
  replaceUrlOnly?: boolean;
}

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang, options?: SetLangOptions) => void;
  l: (href: string) => string;
  assistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  assistantContext: "general" | "video" | "storybook";
  setAssistantContext: (ctx: "general" | "video" | "storybook") => void;
}

const LanguageContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({
  initialLang = "uk",
  children,
}: {
  initialLang?: Lang;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantContext, setAssistantContext] = useState<
    "general" | "video" | "storybook"
  >("general");

  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (isUnlocalizedPath(pathname)) {
      const saved = window.localStorage.getItem("videovitannya_lang");
      if (saved === "ru" || saved === "uk") {
        setLangState(saved);
      }
      prevPathnameRef.current = pathname;
      return;
    }

    if (prevPathnameRef.current !== pathname) {
      const previousUrlLang = getLocaleFromPathname(prevPathnameRef.current);
      prevPathnameRef.current = pathname;
      const urlLang = getLocaleFromPathname(pathname);
      setLangState(urlLang);
      window.localStorage.setItem("videovitannya_lang", urlLang);

      // Locale rewrites share route segments, so Next.js can reuse the previous
      // server page and layout. Refresh their localized CMS data after navigation.
      if (previousUrlLang !== urlLang) {
        router.refresh();
      }
    } else {
      window.localStorage.setItem("videovitannya_lang", lang);
    }
  }, [pathname, lang, router]);

  const l = useCallback(
    (href: string) => localizeHref(href, lang),
    [lang]
  );

  const setLang = useCallback(
    (next: Lang, options?: SetLangOptions) => {
      setLangState(next);
      window.localStorage.setItem("videovitannya_lang", next);

      if (isUnlocalizedPath(pathname)) return;

      const currentUrlLang = getLocaleFromPathname(pathname);
      if (currentUrlLang === next) return;

      const targetPath = localizeHref(pathname, next);
      const suffix =
        typeof window !== "undefined"
          ? `${window.location.search}${window.location.hash}`
          : "";
      const targetUrl = `${targetPath}${suffix}`;

      if (options?.replaceUrlOnly && typeof window !== "undefined") {
        window.history.replaceState(null, "", targetUrl);
        return;
      }

      router.push(targetUrl);
    },
    [pathname, router]
  );

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        l,
        assistantOpen,
        setAssistantOpen,
        assistantContext,
        setAssistantContext,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
