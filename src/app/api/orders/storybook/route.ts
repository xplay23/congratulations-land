import { NextRequest, NextResponse } from "next/server";
import { countSessionPreviewOrders, createOrder } from "@/lib/db";
import { FAMILY_RELATION_OPTIONS } from "@/lib/i18n";
import {
  getDynamicPriceKopiykas,
  getPlatformLimits,
  getPricingConfig,
} from "@/lib/settings";
import { attachSessionCookie, getOrCreateSessionId } from "@/lib/session";
import { deleteUploadFile } from "@/lib/storage";
import { runStorybookPipeline } from "@/lib/storybook/pipeline";
import type { CompanionGender, StorybookOrderPayload } from "@/lib/types";

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

    const matchedFamilyOption = companionRelation
      ? FAMILY_RELATION_OPTIONS.find(
          (f) =>
            f.en.toLowerCase() === companionRelation.toLowerCase() ||
            f.id.toLowerCase() === companionRelation.toLowerCase()
        )
      : undefined;

    let companionGender: CompanionGender | undefined;
    if (companionType !== "none") {
      if (matchedFamilyOption) {
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

    const payload: StorybookOrderPayload = {
      lang,
      childName,
      childNameVocative: body.childNameVocative?.trim() || undefined,
      gender: body.gender,
      ageGroup:
        body.ageGroup === "2-3" || body.ageGroup === "4-5" ? body.ageGroup : "6-8",
      photoUploadId: body.photoUploadId || undefined,
      parentalConsent: Boolean(body.parentalConsent),
      hairColor: body.hairColor?.trim() || undefined,
      eyeColor: body.eyeColor?.trim() || undefined,
      hasGlasses: Boolean(body.hasGlasses),
      layoutMode: body.layoutMode === "panorama" ? "panorama" : "classic",
      artStyle:
        body.artStyle === "3d_pixar" ||
        body.artStyle === "folk_storybook" ||
        body.artStyle === "pencil_gouache" ||
        body.artStyle === "2d_animation" ||
        body.artStyle === "claymation"
          ? body.artStyle
          : "watercolor",
      tone:
        body.tone === "cozy" ||
        body.tone === "adventure" ||
        body.tone === "funny"
          ? body.tone
          : "magical",
      setting: String(body.setting || "").trim() || "Засніжений ліс чудес",
      plotIdea: String(body.plotIdea || "").trim() || "Пошук чарівного світла",
      pageCount: Math.min(8, Math.max(4, Number(body.pageCount || 6))),
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
