import type { NextRequest } from "next/server";

export function getAppBaseUrl(req?: NextRequest): string {
  const configured = process.env.APP_BASE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  if (req) {
    return `${req.nextUrl.protocol}//${req.nextUrl.host}`.replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}
