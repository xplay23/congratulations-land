import { NextRequest, NextResponse } from "next/server";
import {
  getAdminAuthCapabilities,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import {
  createEmailAuthChallenge,
  verifyEmailAuthByMagic,
  verifyEmailAuthByOtp,
} from "@/lib/db";
import { sendAuthCodeAndMagicLinkEmail } from "@/lib/email/mailer";
import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
  setVerifiedEmailCookie,
} from "@/lib/session";
import { getAppBaseUrl } from "@/lib/url";
import type { Lang } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const caps = getAdminAuthCapabilities();
    if (!caps.configured) {
      return NextResponse.json(
        {
          error:
            "Admin auth is not configured. Set ADMIN_PASSWORD or ADMIN_EMAILS in .env.local.",
        },
        { status: 503 }
      );
    }

    const body = (await req.json()) as {
      mode?: "password" | "request_email" | "verify_email" | "verify_magic";
      password?: string;
      email?: string;
      code?: string;
      magic?: string;
      lang?: Lang;
    };

    const mode = body.mode || (body.password ? "password" : "request_email");

    if (mode === "password") {
      if (!caps.passwordEnabled) {
        return NextResponse.json(
          { error: "Password login is disabled." },
          { status: 400 }
        );
      }
      if (!verifyAdminPassword(String(body.password || ""))) {
        return NextResponse.json(
          { error: "Invalid admin password." },
          { status: 401 }
        );
      }
      const res = NextResponse.json({ ok: true, identity: "admin-password" });
      return setAdminSessionCookie(res, "admin-password");
    }

    if (mode === "request_email") {
      if (!caps.emailEnabled) {
        return NextResponse.json(
          { error: "Email admin login is not enabled." },
          { status: 400 }
        );
      }
      const email = String(body.email || "").trim().toLowerCase();
      if (!email || !caps.adminEmails.includes(email)) {
        return NextResponse.json(
          { error: "This email is not authorized for admin access." },
          { status: 403 }
        );
      }

      const lang: Lang = body.lang === "ru" ? "ru" : "uk";
      const { otpCode, magicToken } = createEmailAuthChallenge(email);
      const magicLink = `${getAppBaseUrl(req)}/admin?magic=${encodeURIComponent(magicToken)}`;

      const mailRes = await sendAuthCodeAndMagicLinkEmail({
        email,
        lang,
        otpCode,
        magicLink,
      });

      return NextResponse.json({
        ok: true,
        channel: mailRes.channel,
        devPreview:
          mailRes.channel === "dev_outbox" && process.env.NODE_ENV !== "production"
            ? { otpCode, magicLink }
            : undefined,
      });
    }

    if (mode === "verify_email" || mode === "verify_magic") {
      if (!caps.emailEnabled) {
        return NextResponse.json(
          { error: "Email admin login is not enabled." },
          { status: 400 }
        );
      }

      const verifiedEmail =
        mode === "verify_magic" && body.magic
          ? verifyEmailAuthByMagic(body.magic)
          : body.email && body.code
          ? verifyEmailAuthByOtp(body.email, body.code)
          : null;

      if (!verifiedEmail || !caps.adminEmails.includes(verifiedEmail.toLowerCase())) {
        return NextResponse.json(
          { error: "Invalid or expired code, or email is not an admin." },
          { status: 401 }
        );
      }

      const res = NextResponse.json({ ok: true, identity: verifiedEmail });
      setVerifiedEmailCookie(res, verifiedEmail);
      return setAdminSessionCookie(res, verifiedEmail);
    }

    return NextResponse.json({ error: "Unsupported auth mode" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Admin login error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  return clearAdminSessionCookie(res);
}
