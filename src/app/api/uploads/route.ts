import { NextRequest, NextResponse } from "next/server";
import {
  cleanupExpiredUploads,
  deleteUploadFile,
  saveSanitizedUpload,
} from "@/lib/storage";
import { attachSessionCookie, getOrCreateSessionId } from "@/lib/session";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  try {
    const { sessionId, isNew } = await getOrCreateSessionId();
    const formData = await req.formData();
    const file = formData.get("file");
    const purpose = String(formData.get("purpose") || "child");
    const companionType = String(formData.get("companionType") || "none");

    if (purpose === "companion" && companionType === "friend") {
      return NextResponse.json(
        {
          error:
            "Photo upload is not permitted for a friend. Please describe them in text only (data privacy).",
        },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file upload" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported format. Please upload JPG, PNG, or WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 10 MB limit." },
        { status: 400 }
      );
    }

    cleanupExpiredUploads();
    const replaceUploadId = String(formData.get("replaceUploadId") || "").trim();
    if (replaceUploadId) {
      deleteUploadFile(replaceUploadId);
    }

    const arrayBuf = await file.arrayBuffer();
    const stored = await saveSanitizedUpload(Buffer.from(arrayBuf));

    const res = NextResponse.json({
      uploadId: stored.uploadId,
      width: stored.width,
      height: stored.height,
      exifStripped: true,
    });
    return attachSessionCookie(res, sessionId, isNew);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const uploadId = req.nextUrl.searchParams.get("uploadId")?.trim() || "";
  if (!uploadId) {
    return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });
  }
  const deleted = deleteUploadFile(uploadId);
  return NextResponse.json({ ok: true, deleted });
}
