import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getStoragePaths } from "./storage";

const SID_COOKIE = "videovitannya_sid";
const EMAIL_COOKIE = "videovitannya_email";
const ADMIN_COOKIE = "videovitannya_admin";

function getSigningSecret(): string {
  const envSecret = process.env.AUTH_SECRET?.trim();
  if (envSecret) return envSecret;

  const { STORAGE_ROOT } = getStoragePaths();
  const secretFile = path.join(STORAGE_ROOT, ".auth_secret");
  if (fs.existsSync(secretFile)) {
    return fs.readFileSync(secretFile, "utf-8").trim();
  }
  const generated = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(secretFile, generated, "utf-8");
  return generated;
}

function signValue(value: string): string {
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(value)
    .digest("hex");
  return `${Buffer.from(value, "utf-8").toString("base64url")}.${sig}`;
}

function verifySignedValue(token: string | undefined): string | null {
  if (!token || !token.includes(".")) return null;
  const [b64, sig] = token.split(".", 2);
  if (!b64 || !sig) return null;
  const value = Buffer.from(b64, "base64url").toString("utf-8");
  const expectedSig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(value)
    .digest("hex");
  const a = Buffer.from(sig, "utf-8");
  const b = Buffer.from(expectedSig, "utf-8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }
  return value;
}

export async function getOrCreateSessionId(): Promise<{
  sessionId: string;
  isNew: boolean;
}> {
  const store = await cookies();
  const existing = store.get(SID_COOKIE)?.value;
  if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) {
    return { sessionId: existing, isNew: false };
  }
  return {
    sessionId: `sid_${crypto.randomBytes(12).toString("hex")}`,
    isNew: true,
  };
}

export function attachSessionCookie(
  res: NextResponse,
  sessionId: string,
  isNew: boolean
): NextResponse {
  if (isNew) {
    res.cookies.set(SID_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}

export async function getVerifiedEmailFromCookie(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(EMAIL_COOKIE)?.value;
  const parsed = verifySignedValue(raw);
  if (!parsed) return null;
  try {
    const payload = JSON.parse(parsed) as { email: string; exp: number };
    if (!payload.email || payload.exp < Date.now()) return null;
    return payload.email.toLowerCase();
  } catch {
    return null;
  }
}

export function setVerifiedEmailCookie(res: NextResponse, email: string): NextResponse {
  const payload = JSON.stringify({
    email: email.trim().toLowerCase(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  res.cookies.set(EMAIL_COOKIE, signValue(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export function clearVerifiedEmailCookie(res: NextResponse): NextResponse {
  res.cookies.delete(EMAIL_COOKIE);
  return res;
}

export function getAdminEmailsFromEnv(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminSession(): Promise<{ identity: string; method: "cookie" | "email" } | null> {
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value;
  const parsed = verifySignedValue(raw);
  if (parsed) {
    try {
      const payload = JSON.parse(parsed) as { role: string; identity: string; exp: number };
      if (payload.role === "admin" && payload.exp > Date.now()) {
        return { identity: payload.identity || "admin", method: "cookie" };
      }
    } catch {
      // Ignore malformed admin cookie
    }
  }

  const adminEmails = getAdminEmailsFromEnv();
  if (adminEmails.length > 0) {
    const verifiedEmail = await getVerifiedEmailFromCookie();
    if (verifiedEmail && adminEmails.includes(verifiedEmail)) {
      return { identity: verifiedEmail, method: "email" };
    }
  }

  return null;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return Boolean(await getAdminSession());
}

export function setAdminSessionCookie(res: NextResponse, identity: string): NextResponse {
  const payload = JSON.stringify({
    role: "admin",
    identity,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  res.cookies.set(ADMIN_COOKIE, signValue(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export function clearAdminSessionCookie(res: NextResponse): NextResponse {
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
