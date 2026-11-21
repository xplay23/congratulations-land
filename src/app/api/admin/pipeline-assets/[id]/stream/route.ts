import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "@engine/lib/payload";
import { PIPELINE_ASSETS_DIR } from "@engine/collections/PipelineAssets";
import { requireAdminApi } from "@/lib/admin-auth";

function getMimeType(filename: string, storedMime?: string): string {
  if (storedMime && storedMime !== "application/octet-stream") return storedMime;
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".mkv") return "video/x-matroska";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".ogg") return "audio/ogg";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
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

    const payload = await getPayload();
    const doc = (await payload.findByID({
      collection: "pipeline-assets" as never,
      id: numericId,
      overrideAccess: true,
    })) as unknown as { filename?: string; mimeType?: string } | null;

    if (!doc?.filename) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const safeBase = path.basename(doc.filename);
    const filePath = path.join(PIPELINE_ASSETS_DIR, safeBase);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Asset file missing on disk" }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const total = stat.size;
    const contentType = getMimeType(safeBase, doc.mimeType);
    const rangeHeader = req.headers.get("range");

    if (rangeHeader) {
      const m = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (m) {
        const start = m[1] ? parseInt(m[1], 10) : 0;
        const end = m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
        if (start >= total || start > end || Number.isNaN(start) || Number.isNaN(end)) {
          return new NextResponse(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${total}` },
          });
        }

        const chunkSize = end - start + 1;
        const fd = fs.openSync(filePath, "r");
        const buf = Buffer.alloc(chunkSize);
        try {
          fs.readSync(fd, buf, 0, chunkSize, start);
        } finally {
          fs.closeSync(fd);
        }

        return new NextResponse(new Uint8Array(buf), {
          status: 206,
          headers: {
            "Content-Type": contentType,
            "Content-Length": String(chunkSize),
            "Content-Range": `bytes ${start}-${end}/${total}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, max-age=300",
          },
        });
      }
    }

    const fileBuf = fs.readFileSync(filePath);
    return new NextResponse(new Uint8Array(fileBuf), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(total),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stream error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
