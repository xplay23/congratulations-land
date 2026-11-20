import crypto from "node:crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getPayload } from "@engine/lib/payload";
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

  const expectedDigest = crypto
    .createHash("sha256")
    .update(expected, "utf-8")
    .digest();
  const candidateDigest = crypto
    .createHash("sha256")
    .update(candidate.trim(), "utf-8")
    .digest();
  return crypto.timingSafeEqual(expectedDigest, candidateDigest);
}

export async function requireAdminApi(): Promise<
  | { ok: true; identity: string; method: "cookie" | "email" | "payload" }
  | { ok: false; response: NextResponse }
> {
  const session = await getAdminSession();
  if (session) {
    return { ok: true, identity: session.identity, method: session.method };
  }

  try {
    const payload = await getPayload();
    const { user } = await payload.auth({ headers: await headers() });
    if (user) {
      const identity =
        typeof (user as { email?: unknown }).email === "string"
          ? String((user as { email: string }).email)
          : `payload:${user.id}`;
      return { ok: true, identity, method: "payload" };
    }
  } catch {
    // Fall through to 401 when Payload auth is unavailable
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: "Admin authorization required" },
      { status: 401 }
    ),
  };
}
