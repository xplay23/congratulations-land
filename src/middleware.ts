import { NextRequest, NextResponse } from "next/server";
import {
  getLocaleFromPathname,
  isUnlocalizedPath,
  stripLocalePrefix,
} from "@/lib/locale";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isUnlocalizedPath(pathname)) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);

  // Avoid duplicate Ukrainian URLs: redirect `/uk` or `/uk/...` permanently to root equivalents
  if (pathname === "/uk" || pathname.startsWith("/uk/")) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = stripLocalePrefix(pathname);
    return NextResponse.redirect(redirectUrl, 308);
  }

  const cleanPath = stripLocalePrefix(pathname);
  if (isUnlocalizedPath(cleanPath)) {
    return NextResponse.next();
  }

  const locale = getLocaleFromPathname(pathname);
  requestHeaders.set("x-locale", locale);
  requestHeaders.set("x-canonical-path", cleanPath);

  if (locale === "ru") {
    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = cleanPath;
    return NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|assets/|samples/|media/).*)",
  ],
};
