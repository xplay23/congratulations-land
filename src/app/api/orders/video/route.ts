import { NextRequest, NextResponse } from "next/server";
import { countSessionPreviewOrders, createOrder } from "@/lib/db";
import {
  getDynamicPriceKopiykas,
  getPlatformLimits,
  getPricingConfig,
} from "@/lib/settings";
import { attachSessionCookie, getOrCreateSessionId } from "@/lib/session";
import { getCmsServiceBySlug, getCmsVariationBySlug } from "@/lib/cms-content";
import { runVideoPipeline } from "@/lib/video/pipeline";
import { getPublicVideoTemplateConfig } from "@/lib/video/public-template";
import { validateDynamicVideoSubmission } from "@/lib/video/form-config";
import type { ChildGender, VideoOrderPayload } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const pricing = await getPricingConfig();
    if (!pricing.services.video?.enabled) {
      return NextResponse.json(
        { error: "Video greeting service is temporarily disabled." },
        { status: 503 }
      );
    }

    const limits = await getPlatformLimits();
    const { sessionId, isNew } = await getOrCreateSessionId();
    if ((await countSessionPreviewOrders(sessionId)) >= limits.maxPreviewOrdersPerSession) {
      return NextResponse.json(
        { error: "Session preview limit reached." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Partial<VideoOrderPayload>;
    const lang = body.lang === "ru" ? "ru" : "uk";

    const variationSlug =
      typeof body.variationSlug === "string" && body.variationSlug.trim()
        ? body.variationSlug.trim().slice(0, 80)
        : undefined;
    const variation = variationSlug
      ? await getCmsVariationBySlug(variationSlug)
      : undefined;

    const templateKey =
      variation?.videoTemplateId ??
      variation?.videoTemplateSlug ??
      body.templateSlug;
    const templateCfg = templateKey
      ? await getPublicVideoTemplateConfig(templateKey, lang)
      : null;

    let payload: VideoOrderPayload;

    if (templateCfg && templateCfg.formFields.length > 0) {
      // Merge flat legacy fields + structured fields/uploads so both old and new clients work cleanly
      const mergedFields: Record<string, string> = {
        ...(body.gender ? { gender: body.gender } : {}),
        ...(body.childName ? { childName: String(body.childName) } : {}),
        ...(body.childNameVocative
          ? { childNameVocative: String(body.childNameVocative) }
          : {}),
        ...(body.age ? { age: String(body.age) } : {}),
        ...(body.achievement ? { achievement: String(body.achievement) } : {}),
        ...(body.fields || {}),
      };
      const mergedUploads: Record<string, string> = {
        ...(body.photoUploadId ? { photo: String(body.photoUploadId) } : {}),
        ...(body.uploads || {}),
      };

      const validation = validateDynamicVideoSubmission({
        formFields: templateCfg.formFields,
        fields: mergedFields,
        uploads: mergedUploads,
        parentalConsent: Boolean(body.parentalConsent),
        lang,
      });

      if (!validation.ok) {
        return NextResponse.json(
          { error: validation.error, fieldKey: validation.fieldKey },
          { status: 400 }
        );
      }

      const f = validation.normalizedFields;
      const u = validation.normalizedUploads;
      const firstUploadId = u.photo || Object.values(u)[0] || "";
      const gender: ChildGender = f.gender === "girl" ? "girl" : "boy";

      payload = {
        lang,
        character: templateCfg.slug,
        ...(variation ? { variationSlug: variation.variationSlug } : {}),
        templateSlug: templateCfg.slug,
        childName: f.childName || f.name || "",
        childNameVocative: f.childNameVocative || f.voc || undefined,
        gender,
        age: (f.age || "").slice(0, 20),
        achievement: f.achievement || "",
        photoUploadId: firstUploadId,
        parentalConsent: Boolean(body.parentalConsent),
        fields: f,
        uploads: u,
      };
    } else {
      // Legacy fallback validation when variation has no VideoTemplate linked
      const childName = String(body.childName || "").trim();
      const achievement = String(body.achievement || "").trim();
      const photoUploadId = String(body.photoUploadId || "").trim();

      if (body.gender !== "boy" && body.gender !== "girl") {
        return NextResponse.json(
          { error: "Please select child gender (boy or girl)." },
          { status: 400 }
        );
      }
      if (childName.length < 2 || childName.length > 15) {
        return NextResponse.json(
          { error: "Name must be between 2 and 15 characters for natural lip-sync." },
          { status: 400 }
        );
      }
      if (achievement.length < 10 || achievement.length > 90) {
        return NextResponse.json(
          { error: "Achievement must be between 10 and 90 characters (optimal 25–75)." },
          { status: 400 }
        );
      }
      if (!photoUploadId || !body.parentalConsent) {
        return NextResponse.json(
          { error: "Child photo and parental consent are required for the book insert." },
          { status: 400 }
        );
      }

      payload = {
        lang,
        character: "st_nicholas",
        ...(variation ? { variationSlug: variation.variationSlug } : {}),
        childName,
        childNameVocative: body.childNameVocative?.trim() || undefined,
        gender: body.gender,
        age: String(body.age || "").trim().slice(0, 12),
        achievement,
        photoUploadId,
        parentalConsent: true,
      };
    }

    const parentService = variation?.serviceSlug
      ? await getCmsServiceBySlug(variation.serviceSlug, lang)
      : undefined;

    const priceKopiykas =
      variation?.priceOverrideUah && variation.priceOverrideUah > 0
        ? Math.round(variation.priceOverrideUah * 100)
        : parentService && parentService.basePriceUah > 0
        ? Math.round(parentService.basePriceUah * 100)
        : await getDynamicPriceKopiykas("video");

    const order = await createOrder({
      sessionId,
      productType: "video",
      lang,
      payload,
      priceKopiykas,
      aiEditsLimit: limits.maxAiEditsPerVideo,
      retentionDays: limits.orderRetentionDays,
    });

    void runVideoPipeline(order.id, payload);

    const res = NextResponse.json({ orderId: order.id, status: order.status });
    return attachSessionCookie(res, sessionId, isNew);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed creating video order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
