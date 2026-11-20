import { NextRequest, NextResponse } from "next/server";
import { createEmailAuthChallenge } from "@/lib/db";
import { sendAuthCodeAndMagicLinkEmail } from "@/lib/email/mailer";
import { getAppBaseUrl } from "@/lib/url";
import type { Lang } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; lang?: Lang };
    const email = String(body.email || "").trim().toLowerCase();
    const lang: Lang = body.lang === "ru" ? "ru" : "uk";

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        {
          error:
            lang === "uk"
              ? "Введіть коректний Email."
              : "Введите корректный Email.",
        },
        { status: 400 }
      );
    }

    const { otpCode, magicToken } = createEmailAuthChallenge(email);
    const origin = getAppBaseUrl(req);
    const magicLink = `${origin}/my-orders?magic=${encodeURIComponent(magicToken)}`;

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
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed sending auth email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
