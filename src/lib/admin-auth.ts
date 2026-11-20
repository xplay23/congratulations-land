import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminEmailsFromEnv, getAdminSession } from "./session";

export function hasAdminPassword(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

export function getAdminAuthCapabilities() {
  const passwordEnabled = hasAdminPassword();
  const adminEmails = getAdminEmailsFromEnv();
  const emailEnabled = adminEmails.length > 0;
  return {
    configured: passwordEnabled || emailEnabled,
    passwordEnabled,
    emailEnabled,
    adminEmails,
  };
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected || !candidate) return false;

  const expectedDigest = crypto.createHash("sha256").update(expected, "utf-8").digest();
  const candidateDigest = crypto.createHash("sha256").update(candidate.trim(), "utf-8").digest();
  return crypto.timingSafeEqual(expectedDigest, candidateDigest);
}

export async function requireAdminApi(): Promise<
  | { ok: true; identity: string; method: "cookie" | "email" }
  | { ok: false; response: NextResponse }
> {
  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin authorization required" }, { status: 401 }),
    };
  }
  return { ok: true, identity: session.identity, method: session.method };
}
