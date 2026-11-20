import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";
import { PricingProvider } from "@/components/PricingContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CookieConsent } from "@/components/CookieConsent";
import { AiAssistantDrawer } from "@/components/AiAssistantDrawer";
import { getPricingConfig } from "@/lib/settings";
import { getServerLocale, makeHomeMetadata } from "@/lib/page-helpers";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return makeHomeMetadata();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [initialPricing, locale] = await Promise.all([
    Promise.resolve(getPricingConfig()),
    getServerLocale(),
  ]);

  return (
    <html lang={locale}>
      <body className="antialiased flex min-h-screen flex-col">
        <LanguageProvider initialLang={locale}>
          <PricingProvider initialPricing={initialPricing}>
            <SiteHeader />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
              {children}
            </main>
            <SiteFooter />
            <CookieConsent />
            <AiAssistantDrawer />
          </PricingProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
