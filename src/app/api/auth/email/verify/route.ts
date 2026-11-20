import { NextRequest, NextResponse } from "next/server";
import { verifyEmailAuthByMagic, verifyEmailAuthByOtp } from "@/lib/db";
import { setVerifiedEmailCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      code?: string;
      magic?: string;
    };

    let verifiedEmail: string | null = null;
    if (body.magic) {
      verifiedEmail = verifyEmailAuthByMagic(body.magic);
    } else if (body.email && body.code) {
      verifiedEmail = verifyEmailAuthByOtp(body.email, body.code);
    }

    if (!verifiedEmail) {
      return NextResponse.json(
        { error: "Invalid or expired verification code or magic link." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true, email: verifiedEmail });
    return setVerifiedEmailCookie(res, verifiedEmail);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
