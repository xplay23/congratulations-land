import { NextRequest, NextResponse } from "next/server";
import { countSessionPreviewOrders, createOrder } from "@/lib/db";
import {
  getDynamicPriceKopiykas,
  getPlatformLimits,
  getPricingConfig,
} from "@/lib/settings";
import { attachSessionCookie, getOrCreateSessionId } from "@/lib/session";
import { deleteUploadFile } from "@/lib/storage";
import { getStorybookRuntimeConfig } from "@/lib/storybook/config";
import { runStorybookPipeline } from "@/lib/storybook/pipeline";
import type { CompanionGender, LayoutMode, StorybookOrderPayload } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const pricing = await getPricingConfig();
    if (!pricing.services.storybook?.enabled) {
      return NextResponse.json(
        { error: "Storybook service is temporarily disabled." },
        { status: 503 }
      );
    }

    const limits = await getPlatformLimits();
    const { sessionId, isNew } = await getOrCreateSessionId();
    if ((await countSessionPreviewOrders(sessionId)) >= limits.maxPreviewOrdersPerSession) {
      return NextResponse.json(
        { error: "Session preview limit reached. Please complete an existing order or try later." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Partial<StorybookOrderPayload>;
    const lang = body.lang === "ru" ? "ru" : "uk";
    const childName = String(body.childName || "").trim();

    if (body.gender !== "boy" && body.gender !== "girl") {
      return NextResponse.json(
        { error: "Please select child gender (boy or girl)." },
        { status: 400 }
      );
    }

    if (childName.length < 2 || childName.length > 24) {
      return NextResponse.json(
        { error: "Child name must be between 2 and 24 characters." },
        { status: 400 }
      );
    }

    if (body.photoUploadId && !body.parentalConsent) {
      return NextResponse.json(
        { error: "Parental consent checkbox is required when uploading a photo." },
        { status: 400 }
      );
    }

    const companionType = body.companionType || "none";
    const companionAllowed = companionType === "family" || companionType === "pet";
    if (!companionAllowed && body.companionPhotoUploadId) {
      deleteUploadFile(body.companionPhotoUploadId);
    }
    const companionPhotoUploadId = companionAllowed
      ? body.companionPhotoUploadId
      : undefined;

    if (companionType === "family" && companionPhotoUploadId && !body.companionConsent) {
      return NextResponse.json(
        { error: "Family member consent checkbox is required when uploading their photo." },
        { status: 400 }
      );
    }

    const companionSpecies =
      companionType === "pet" ? String(body.companionSpecies || "").trim() : undefined;
    const companionRelation =
      companionType === "family" ? String(body.companionRelation || "").trim() : undefined;

    if (companionType === "pet" && !companionSpecies) {
      return NextResponse.json(
        { error: "Please select or enter the pet species." },
        { status: 400 }
      );
    }
    if (companionType === "family" && !companionRelation) {
      return NextResponse.json(
        { error: "Please select or enter who the family member is." },
        { status: 400 }
      );
    }

    const sbConfig = await getStorybookRuntimeConfig();

    const matchedFamilyOption = companionRelation
      ? sbConfig.familyRelations.find(
          (f) =>
            f.promptEn.toLowerCase() === companionRelation.toLowerCase() ||
            f.slug.toLowerCase() === companionRelation.toLowerCase() ||
            f.label.uk.toLowerCase() === companionRelation.toLowerCase() ||
            f.label.ru.toLowerCase() === companionRelation.toLowerCase()
        )
      : undefined;

    let companionGender: CompanionGender | undefined;
    if (companionType !== "none") {
      if (
        matchedFamilyOption &&
        (matchedFamilyOption.impliedGender === "male" ||
          matchedFamilyOption.impliedGender === "female")
      ) {
        companionGender = matchedFamilyOption.impliedGender;
      } else if (body.companionGender === "male" || body.companionGender === "female") {
        companionGender = body.companionGender;
      } else {
        return NextResponse.json(
          { error: "Please select companion gender (male or female)." },
          { status: 400 }
        );
      }
    }

    const enabledStyles = sbConfig.styles.filter((s) => s.enabled);
    const defaultStyle =
      enabledStyles.find((s) => s.isDefault) || enabledStyles[0] || sbConfig.styles[0];
    const requestedStyle = String(body.artStyle || "").trim();
    const resolvedArtStyle =
      enabledStyles.find((s) => s.slug === requestedStyle)?.slug ||
      defaultStyle?.slug ||
      "watercolor";

    const enabledLayouts = sbConfig.layouts.filter((l) => l.enabled);
    const defaultLayout =
      enabledLayouts.find((l) => l.isDefault) || enabledLayouts[0] || sbConfig.layouts[0];
    const resolvedLayoutMode: LayoutMode =
      enabledLayouts.find((l) => l.code === body.layoutMode)?.code ||
      defaultLayout?.code ||
      "classic";

    const enabledAges = sbConfig.ageGroups.filter((a) => a.enabled);
    const defaultAge =
      enabledAges.find((a) => a.isDefault) || enabledAges[0] || sbConfig.ageGroups[0];
    const requestedAge = String(body.ageGroup || "").trim();
    const resolvedAgeGroup =
      enabledAges.find((a) => a.code === requestedAge)?.code ||
      defaultAge?.code ||
      "6-8";

    const enabledTones = sbConfig.tones.filter((t) => t.enabled);
    const requestedTone = String(body.tone || "").trim();
    const resolvedTone =
      enabledTones.find((t) => t.slug === requestedTone)?.slug ||
      enabledTones[0]?.slug ||
      "magical";

    const enabledVolumes = sbConfig.pageVolumes.filter((v) => v.enabled);
    const requestedPages = Math.round(Number(body.pageCount || sbConfig.defaultPageCount));
    const resolvedPageCount =
      enabledVolumes.find((v) => v.pages === requestedPages)?.pages ||
      enabledVolumes.find((v) => v.isDefault)?.pages ||
      sbConfig.defaultPageCount ||
      Math.min(16, Math.max(4, requestedPages));

    const payload: StorybookOrderPayload = {
      lang,
      childName,
      childNameVocative: body.childNameVocative?.trim() || undefined,
      gender: body.gender,
      ageGroup: resolvedAgeGroup,
      photoUploadId: body.photoUploadId || undefined,
      parentalConsent: Boolean(body.parentalConsent),
      hairColor: body.hairColor?.trim() || undefined,
      eyeColor: body.eyeColor?.trim() || undefined,
      hasGlasses: Boolean(body.hasGlasses),
      layoutMode: resolvedLayoutMode,
      artStyle: resolvedArtStyle,
      tone: resolvedTone,
      setting:
        String(body.setting || "").trim() ||
        sbConfig.settings.find((s) => s.enabled)?.promptValue[lang] ||
        "Засніжений ліс чудес",
      plotIdea:
        String(body.plotIdea || "").trim() ||
        sbConfig.plots.find((p) => p.enabled)?.promptValue[lang] ||
        "Пошук чарівного світла",
      pageCount: resolvedPageCount,
      companionType,
      companionSpecies: companionSpecies || undefined,
      companionRelation: companionRelation || undefined,
      companionGender,
      companionName: companionType === "none" ? undefined : body.companionName?.trim() || undefined,
      companionDescription:
        companionType === "none" ? undefined : body.companionDescription?.trim() || undefined,
      companionPhotoUploadId,
      companionConsent: companionType === "family" ? Boolean(body.companionConsent) : false,
      favoriteToy: body.favoriteToy?.trim() || undefined,
      dedication: body.dedication?.trim() || undefined,
    };

    const order = await createOrder({
      sessionId,
      productType: "storybook",
      lang,
      payload,
      priceKopiykas: await getDynamicPriceKopiykas("storybook", payload.pageCount),
      aiEditsLimit: limits.maxAiEditsPerBook,
      retentionDays: limits.orderRetentionDays,
    });

    void runStorybookPipeline(order.id, payload);

    const res = NextResponse.json({ orderId: order.id, status: order.status });
    return attachSessionCookie(res, sessionId, isNew);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed creating storybook order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
