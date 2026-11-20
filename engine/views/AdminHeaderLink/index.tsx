"use client";

import { useEffect, useState } from "react";
import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";

export default function AdminHeaderLink() {
  const lang = useAdminLang();
  const [siteUrl, setSiteUrl] = useState("/");

  useEffect(() => {
    setSiteUrl(window.location.origin);
  }, []);

  return (
    <a
      href={siteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="admin-header-action-link"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        fontSize: "0.92857rem",
        fontWeight: 500,
        opacity: 0.75,
        textDecoration: "none",
        color: "inherit",
        padding: "0.25rem 0.5rem",
        borderRadius: "0.25rem",
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0.75";
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      <span className="admin-header-action-link__label">
        {tAdmin(lang, "Открыть сайт", "Відкрити сайт")}
      </span>
    </a>
  );
}
