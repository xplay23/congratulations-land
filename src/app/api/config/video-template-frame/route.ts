import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "@engine/lib/payload";
import { PIPELINE_ASSETS_DIR } from "@engine/collections/PipelineAssets";
import { extractCachedAssetFrame } from "@/app/api/admin/pipeline-assets/[id]/frame/route";
import { getVideoTemplateBySlug } from "@/lib/video/manifest-builder";
import { parseTimelineConfig } from "@/lib/video/template-schema";

/**
 * Public read-only frame endpoint restricted strictly to the designated overlay
 * mockup shot of an enabled VideoTemplate so <DynamicVideoForm /> can display
 * an accurate live photo+caption mockup for any character/template.
 */
export async function GET(req: NextRequest) {
  try {
    const templateSlug = req.nextUrl.searchParams.get("templateSlug")?.trim() || "";
    const shotKey = req.nextUrl.searchParams.get("shotKey")?.trim() || "";
    if (!templateSlug || !shotKey) {
      return NextResponse.json(
        { error: "templateSlug and shotKey are required" },
        { status: 400 }
      );
    }

    const template = await getVideoTemplateBySlug(templateSlug, "uk");
    if (!template || template.enabled === false) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const timeline = parseTimelineConfig(template.timelineConfig);
    const firstShot = timeline.shots[0];

    // Allow either the 1st shot (used as automatic poster/card preview fallback)
    // or a designated photoUploadField mockupShotKey.
    const isFirstShotRequest =
      Boolean(firstShot) &&
      (shotKey === "first" || shotKey === firstShot.key || shotKey === firstShot.id);

    const formFields = Array.isArray(template.formFields) ? template.formFields : [];
    const isMockupShot = formFields.some((f) => {
      const blk = f as {
        blockType?: string;
        showOverlayMockup?: boolean;
        mockupShotKey?: string;
      };
      return (
        blk.blockType === "photoUploadField" &&
        blk.showOverlayMockup !== false &&
        (blk.mockupShotKey || "04b") === shotKey
      );
    });

    if (!isFirstShotRequest && !isMockupShot) {
      return NextResponse.json({ error: "Frame not exposed publicly" }, { status: 403 });
    }

    const shot = isFirstShotRequest
      ? firstShot
      : timeline.shots.find((s) => s.key === shotKey || s.id === shotKey);
    const assetId = Number(shot?.videoAssetId);
    if (!shot || !Number.isInteger(assetId) || assetId <= 0) {
      return NextResponse.json({ error: "Shot video asset not found" }, { status: 404 });
    }

    const payload = await getPayload();
    const asset = (await payload.findByID({
      collection: "pipeline-assets" as never,
      id: assetId,
      overrideAccess: true,
    })) as unknown as { filename?: string } | null;

    if (!asset?.filename) {
      return NextResponse.json({ error: "Asset file not found" }, { status: 404 });
    }

    const filePath = path.join(PIPELINE_ASSETS_DIR, path.basename(asset.filename));
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Asset missing on disk" }, { status: 404 });
    }

    const jpeg = await extractCachedAssetFrame(assetId, filePath, shot.trimStart || 0);
    return new NextResponse(new Uint8Array(jpeg), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(jpeg.length),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Frame failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
