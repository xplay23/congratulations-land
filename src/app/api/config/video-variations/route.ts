import { NextRequest, NextResponse } from "next/server";
import { getCmsServiceBySlug, getCmsServiceVariations } from "@/lib/cms-content";
import { getPublicVideoTemplateConfig } from "@/lib/video/public-template";

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get("lang") === "ru" ? "ru" : "uk";
    const serviceParam = req.nextUrl.searchParams.get("service")?.trim();
    const effectiveServiceSlug =
      serviceParam === "all" ? undefined : serviceParam || "svyatyj-mykolaj";

    const [variations, parentService] = await Promise.all([
      getCmsServiceVariations(lang, effectiveServiceSlug),
      effectiveServiceSlug
        ? getCmsServiceBySlug(effectiveServiceSlug, lang)
        : Promise.resolve(undefined),
    ]);

    const enriched = await Promise.all(
      variations.map(async (v) => {
        const template = v.videoTemplateId
          ? await getPublicVideoTemplateConfig(v.videoTemplateId, lang)
          : v.videoTemplateSlug
          ? await getPublicVideoTemplateConfig(v.videoTemplateSlug, lang)
          : null;

        return {
          variationSlug: v.variationSlug,
          serviceSlug: v.serviceSlug,
          title: v.title,
          shortBadge: v.shortBadge,
          description: v.description,
          posterUrl: v.posterUrl,
          demoVideoUrl: v.demoVideoUrl,
          isDefault: v.isDefault,
          priceOverrideUah: v.priceOverrideUah ?? null,
          template,
        };
      })
    );

    return NextResponse.json({
      serviceTitle: parentService?.title || null,
      serviceBasePriceUah:
        parentService && parentService.basePriceUah > 0
          ? parentService.basePriceUah
          : null,
      variations: enriched,
    });
  } catch {
    return NextResponse.json({
      serviceTitle: null,
      serviceBasePriceUah: null,
      variations: [],
    });
  }
}
