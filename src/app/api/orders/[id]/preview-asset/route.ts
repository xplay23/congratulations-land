import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/db";
import { assertSafeId, getOrderDirs } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const order = await getOrderById(assertSafeId(id));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const fileParam = req.nextUrl.searchParams.get("file") || "";
    const safeName = path.basename(fileParam);
    if (!safeName || !/^[a-zA-Z0-9_.-]+$/.test(safeName)) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
    }

    const { preview } = getOrderDirs(order.id);
    const fullPath = path.join(preview, safeName);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "Preview asset not found" }, { status: 404 });
    }

    const ext = path.extname(safeName).toLowerCase();
    const stat = fs.statSync(fullPath);

    if (ext === ".mp4") {
      const range = req.headers.get("range");
      if (range) {
        const match = /bytes=(\d+)-(\d*)/.exec(range);
        const start = match ? Number(match[1]) : 0;
        const end = match && match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
        const chunkSize = end - start + 1;
        const stream = Readable.toWeb(fs.createReadStream(fullPath, { start, end })) as ReadableStream;
        return new NextResponse(stream, {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": String(chunkSize),
            "Content-Type": "video/mp4",
          },
        });
      }
      const stream = Readable.toWeb(fs.createReadStream(fullPath)) as ReadableStream;
      return new NextResponse(stream, {
        status: 200,
        headers: {
          "Content-Length": String(stat.size),
          "Accept-Ranges": "bytes",
          "Content-Type": "video/mp4",
        },
      });
    }

    const bytes = fs.readFileSync(fullPath);
    const contentType =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".png"
        ? "image/png"
        : "image/jpeg";

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Asset error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
