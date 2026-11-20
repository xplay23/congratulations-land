import { NextRequest, NextResponse } from "next/server";
import { getCmsServiceVariations } from "@/lib/cms-content";

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get("lang") === "ru" ? "ru" : "uk";
    const serviceSlug =
      req.nextUrl.searchParams.get("service")?.trim() || "svyatyj-mykolaj";
    const variations = await getCmsServiceVariations(lang, serviceSlug);
    return NextResponse.json({
      variations: variations.map((v) => ({
        variationSlug: v.variationSlug,
        title: v.title,
        shortBadge: v.shortBadge,
        description: v.description,
        posterUrl: v.posterUrl,
        demoVideoUrl: v.demoVideoUrl,
        isDefault: v.isDefault,
        priceOverrideUah: v.priceOverrideUah ?? null,
      })),
    });
  } catch {
    return NextResponse.json({ variations: [] });
  }
}
