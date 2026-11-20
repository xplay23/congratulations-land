import { NextResponse } from "next/server";
import { getAdminAuthCapabilities } from "@/lib/admin-auth";
import { getAdminSession, getVerifiedEmailFromCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const caps = getAdminAuthCapabilities();
  const session = await getAdminSession();
  const verifiedEmail = await getVerifiedEmailFromCookie();

  return NextResponse.json(
    {
      authenticated: Boolean(session),
      identity: session?.identity || null,
      method: session?.method || null,
      configured: caps.configured,
      methods: {
        password: caps.passwordEnabled,
        email: caps.emailEnabled,
      },
      verifiedEmailAllowed: Boolean(
        verifiedEmail && caps.adminEmails.includes(verifiedEmail)
      ),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
