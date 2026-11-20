import { NextRequest, NextResponse } from "next/server";
import { countSessionPreviewOrders, createOrder } from "@/lib/db";
import {
  getDynamicPriceKopiykas,
  getPlatformLimits,
  getPricingConfig,
} from "@/lib/settings";
import { attachSessionCookie, getOrCreateSessionId } from "@/lib/session";
import { getCmsVariationBySlug } from "@/lib/cms-content";
import { runVideoPipeline } from "@/lib/video/pipeline";
import type { VideoOrderPayload } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const pricing = getPricingConfig();
    if (!pricing.services.video?.enabled) {
      return NextResponse.json(
        { error: "Video greeting service is temporarily disabled." },
        { status: 503 }
      );
    }

    const limits = getPlatformLimits();
    const { sessionId, isNew } = await getOrCreateSessionId();
    if (countSessionPreviewOrders(sessionId) >= limits.maxPreviewOrdersPerSession) {
      return NextResponse.json(
        { error: "Session preview limit reached." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Partial<VideoOrderPayload>;
    const lang = body.lang === "ru" ? "ru" : "uk";
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

    const variationSlug =
      typeof body.variationSlug === "string" && body.variationSlug.trim()
        ? body.variationSlug.trim().slice(0, 80)
        : undefined;
    const variation = variationSlug
      ? await getCmsVariationBySlug(variationSlug)
      : undefined;

    const payload: VideoOrderPayload = {
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

    const priceKopiykas =
      variation?.priceOverrideUah && variation.priceOverrideUah > 0
        ? Math.round(variation.priceOverrideUah * 100)
        : getDynamicPriceKopiykas("video");

    const order = createOrder({
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
