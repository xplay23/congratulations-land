import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "@engine/lib/payload";
import { PIPELINE_ASSETS_DIR } from "@engine/collections/PipelineAssets";
import { requireAdminApi } from "@/lib/admin-auth";

const execFileAsync = promisify(execFile);
const FRAMES_CACHE_DIR = path.resolve(
  process.cwd(),
  "storage",
  "temp_previews",
  "frames"
);

export async function extractCachedAssetFrame(
  assetId: number,
  videoFilePath: string,
  sec: number
): Promise<Buffer> {
  fs.mkdirSync(FRAMES_CACHE_DIR, { recursive: true });
  const clampedSec = Math.max(0, Math.min(60, Math.round(sec * 10) / 10));
  const stat = fs.statSync(videoFilePath);
  const cacheKey = `a${assetId}_${Math.round(stat.mtimeMs)}_t${clampedSec.toFixed(1)}.jpg`;
  const cachePath = path.join(FRAMES_CACHE_DIR, cacheKey);

  if (!fs.existsSync(cachePath)) {
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-v",
        "error",
        "-ss",
        clampedSec.toFixed(2),
        "-i",
        videoFilePath,
        "-frames:v",
        "1",
        "-vf",
        "scale=1280:720:force_original_aspect_ratio=decrease",
        "-q:v",
        "3",
        cachePath,
      ],
      { timeout: 15_000 }
    );
  }

  return fs.readFileSync(cachePath);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json({ error: "Invalid asset id" }, { status: 400 });
    }

    const sec = Number(req.nextUrl.searchParams.get("sec") || "0");
    const safeSec = Number.isFinite(sec) ? sec : 0;

    const payload = await getPayload();
    const doc = (await payload.findByID({
      collection: "pipeline-assets" as never,
      id: numericId,
      overrideAccess: true,
    })) as unknown as { filename?: string } | null;

    if (!doc?.filename) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const filePath = path.join(PIPELINE_ASSETS_DIR, path.basename(doc.filename));
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
    }

    const jpeg = await extractCachedAssetFrame(numericId, filePath, safeSec);
    return new NextResponse(new Uint8Array(jpeg), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(jpeg.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Frame extraction failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
