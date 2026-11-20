import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const STORAGE_ROOT = path.resolve(process.cwd(), "storage");
const UPLOADS_DIR = path.join(STORAGE_ROOT, "uploads");
const ORDERS_DIR = path.join(STORAGE_ROOT, "orders");
const DEV_EMAILS_DIR = path.join(STORAGE_ROOT, "dev_emails");
const FONTS_DIR = path.resolve(process.cwd(), "assets", "fonts");
const DECORATIONS_DIR = path.resolve(process.cwd(), "assets", "decorations");

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function assertSafeId(id: string): string {
  if (!/^[a-zA-Z0-9_-]{4,64}$/.test(id)) {
    throw new Error(`Invalid identifier: ${id}`);
  }
  return id;
}

export function getOrderRetentionDays(): number {
  return Math.max(1, Number(process.env.ORDER_RETENTION_DAYS || "30"));
}

export function getStoragePaths() {
  ensureDir(STORAGE_ROOT);
  ensureDir(UPLOADS_DIR);
  ensureDir(ORDERS_DIR);
  ensureDir(DEV_EMAILS_DIR);
  return { STORAGE_ROOT, UPLOADS_DIR, ORDERS_DIR, DEV_EMAILS_DIR, FONTS_DIR, DECORATIONS_DIR };
}

export function getOrderDirs(orderId: string) {
  const safeId = assertSafeId(orderId);
  const base = path.join(ORDERS_DIR, safeId);
  const clean = path.join(base, "clean");
  const preview = path.join(base, "preview");
  ensureDir(clean);
  ensureDir(preview);
  return { base, clean, preview };
}

export function deleteOrderDirectory(orderId: string): void {
  try {
    const safeId = assertSafeId(orderId);
    const base = path.join(ORDERS_DIR, safeId);
    if (fs.existsSync(base)) {
      fs.rmSync(base, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors
  }
}

export interface StoredUpload {
  uploadId: string;
  filePath: string;
  mimeType: string;
  width: number;
  height: number;
}

/**
 * Saves an uploaded image privately outside public/, strips all EXIF/metadata
 * via sharp, normalizes orientation, and resizes overly large photos.
 */
export async function saveSanitizedUpload(buffer: Buffer): Promise<StoredUpload> {
  getStoragePaths();
  const uploadId = `upl_${crypto.randomBytes(10).toString("hex")}`;
  const outPath = path.join(UPLOADS_DIR, `${uploadId}.png`);

  const pipeline = sharp(buffer)
    .rotate()
    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
    .toColorspace("srgb")
    .png({ quality: 92 });

  const info = await pipeline.toFile(outPath);

  return {
    uploadId,
    filePath: outPath,
    mimeType: "image/png",
    width: info.width,
    height: info.height,
  };
}

export function resolveUploadPath(uploadId?: string): string | null {
  if (!uploadId) return null;
  const safeId = assertSafeId(uploadId);
  const candidate = path.join(UPLOADS_DIR, `${safeId}.png`);
  if (!fs.existsSync(candidate)) {
    return null;
  }
  return candidate;
}

/**
 * Immediately deletes a temporary uploaded user photo once the pipeline no longer needs it.
 */
export function deleteUploadFile(uploadId?: string): boolean {
  if (!uploadId) return false;
  try {
    const safeId = assertSafeId(uploadId);
    const candidate = path.join(UPLOADS_DIR, `${safeId}.png`);
    if (fs.existsSync(candidate)) {
      fs.unlinkSync(candidate);
      return true;
    }
  } catch {
    // Ignore missing or concurrent deletion
  }
  return false;
}

/**
 * Safety net: deletes any leftover temporary uploaded photos older than PHOTO_TTL_HOURS.
 */
export function cleanupExpiredUploads(): number {
  getStoragePaths();
  const ttlHours = Number(process.env.PHOTO_TTL_HOURS || "24");
  const cutoffMs = Date.now() - ttlHours * 60 * 60 * 1000;
  let removed = 0;

  for (const entry of fs.readdirSync(UPLOADS_DIR)) {
    const full = path.join(UPLOADS_DIR, entry);
    try {
      const stat = fs.statSync(full);
      if (stat.isFile() && stat.mtimeMs < cutoffMs) {
        fs.unlinkSync(full);
        removed += 1;
      }
    } catch {
      // Ignore concurrent deletion
    }
  }
  return removed;
}
