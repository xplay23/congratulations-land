import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/db";
import {
  getOrCreateSessionId,
  getVerifiedEmailFromCookie,
  isAdminAuthenticated,
} from "@/lib/session";
import { assertSafeId, getOrderDirs } from "@/lib/storage";
import type { StorybookResult, VideoResult } from "@/lib/types";

function tokensMatch(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const order = getOrderById(assertSafeId(id));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status !== "paid" || !order.result) {
      return NextResponse.json(
        { error: "Payment required before downloading clean HD output." },
        { status: 402 }
      );
    }

    if (order.expiresAt && new Date(order.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Order storage period (30 days) has expired." },
        { status: 410 }
      );
    }

    const queryToken = req.nextUrl.searchParams.get("token") || "";
    const { sessionId } = await getOrCreateSessionId();
    const verifiedEmail = await getVerifiedEmailFromCookie();

    const isAdmin = await isAdminAuthenticated();

    const authorized =
      isAdmin ||
      tokensMatch(queryToken, order.accessToken) ||
      sessionId === order.sessionId ||
      (Boolean(verifiedEmail) &&
        Boolean(order.customerEmail) &&
        verifiedEmail === order.customerEmail?.toLowerCase());

    if (!authorized) {
      return NextResponse.json(
        { error: "Access denied. Please verify your email in My Orders or use your receipt link." },
        { status: 403 }
      );
    }

    const { clean } = getOrderDirs(order.id);
    if (order.productType === "storybook") {
      const sr = order.result as StorybookResult;
      const pdfPath = path.join(clean, sr.cleanPdfFile);
      if (!fs.existsSync(pdfPath)) {
        return NextResponse.json({ error: "Clean PDF missing" }, { status: 404 });
      }
      const bytes = fs.readFileSync(pdfPath);
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="videovitannya-storybook-${order.id}.pdf"`,
        },
      });
    }

    const vr = order.result as VideoResult;
    const mp4Path = path.join(clean, vr.cleanVideoFile);
    if (!fs.existsSync(mp4Path)) {
      return NextResponse.json({ error: "Clean MP4 missing" }, { status: 404 });
    }
    const stat = fs.statSync(mp4Path);
    const isInline = req.nextUrl.searchParams.get("inline") === "1";
    const disposition = isInline
      ? `inline; filename="videovitannya-video-${order.id}.mp4"`
      : `attachment; filename="videovitannya-video-${order.id}.mp4"`;
    const range = req.headers.get("range");

    if (range) {
      const match = /bytes=(\d+)-(\d*)/.exec(range);
      const start = match ? Math.min(Number(match[1]), Math.max(0, stat.size - 1)) : 0;
      const end =
        match && match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
      const chunkSize = end - start + 1;
      const stream = Readable.toWeb(
        fs.createReadStream(mp4Path, { start, end })
      ) as ReadableStream;
      return new NextResponse(stream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": "video/mp4",
          "Content-Disposition": disposition,
        },
      });
    }

    const stream = Readable.toWeb(fs.createReadStream(mp4Path)) as ReadableStream;
    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Content-Length": String(stat.size),
        "Content-Disposition": disposition,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Download failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
