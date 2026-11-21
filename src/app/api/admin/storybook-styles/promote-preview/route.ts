import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getPayload } from "@engine/lib/payload";
import { requireAdminApi } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as {
      imageBase64?: string;
      slug?: string;
      alt?: string;
    };

    const rawB64 = String(body.imageBase64 || "").trim();
    if (!rawB64) {
      return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
    }

    const safeSlug = String(body.slug || "style")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "style";

    const buf = Buffer.from(rawB64, "base64");
    const optimized = await sharp(buf)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 90, chromaSubsampling: "4:4:4", mozjpeg: true })
      .toBuffer();

    const payload = await getPayload();
    const filename = `style-preview-${safeSlug}-${Date.now()}.jpg`;
    const created = await payload.create({
      collection: "media",
      data: {
        alt: String(body.alt || `Storybook style ${safeSlug}`).slice(0, 120),
      },
      file: {
        data: optimized,
        mimetype: "image/jpeg",
        name: filename,
        size: optimized.length,
      },
    });

    return NextResponse.json({
      mediaId: created.id,
      url: (created as { url?: string }).url || `/media/${filename}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed saving style preview";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
