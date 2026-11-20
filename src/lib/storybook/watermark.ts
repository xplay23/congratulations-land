import sharp from "sharp";
import type { Lang } from "@/lib/types";

/**
 * Creates a downscaled JPEG preview with a diagonal repeating watermark
 * so pre-payment previews cannot be printed cleanly.
 */
export async function createWatermarkedPreviewImage(
  cleanPngPath: string,
  previewOutPath: string,
  lang: Lang
): Promise<void> {
  const meta = await sharp(cleanPngPath).metadata();
  const srcW = meta.width || 1024;
  const srcH = meta.height || 1024;
  const maxWidth = 760;
  const scale = srcW > maxWidth ? maxWidth / srcW : 1;
  const w = Math.max(320, Math.round(srcW * scale));
  const h = Math.max(240, Math.round(srcH * scale));

  const label = lang === "uk" ? "VIDEOVITANNYA • ЗРАЗОК" : "VIDEOVITANNYA • ОБРАЗЕЦ";
  const svgOverlay = Buffer.from(`
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wm" width="260" height="170" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
          <text x="10" y="70" fill="rgba(255,255,255,0.34)" font-family="Georgia, serif" font-size="22" font-weight="bold" letter-spacing="2">${label}</text>
          <text x="45" y="135" fill="rgba(18,26,48,0.28)" font-family="Georgia, serif" font-size="18" font-weight="bold" letter-spacing="2">PREVIEW</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm)" />
    </svg>
  `);

  await sharp(cleanPngPath)
    .resize(w, h, { fit: "fill" })
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .jpeg({ quality: 76 })
    .toFile(previewOutPath);
}

/**
 * Generates a delicate golden/botanical corner vignette PNG for Classic Book text pages.
 */
export async function createCornerVignetteBuffer(): Promise<Buffer> {
  const svg = Buffer.from(`
    <svg width="260" height="260" viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke-linecap="round">
        <path d="M235 235 C180 232, 132 205, 108 165" stroke="#c89a52" stroke-width="2.2" opacity="0.55"/>
        <path d="M235 235 C232 180, 205 132, 165 108" stroke="#c89a52" stroke-width="2.2" opacity="0.55"/>
        <path d="M210 225 C175 190, 155 152, 148 112" stroke="#7d9685" stroke-width="1.8" opacity="0.55"/>
        <ellipse cx="145" cy="108" rx="14" ry="7" transform="rotate(-35 145 108)" fill="#8aa392" opacity="0.35"/>
        <ellipse cx="115" cy="158" rx="14" ry="7" transform="rotate(-15 115 158)" fill="#8aa392" opacity="0.35"/>
        <ellipse cx="172" cy="150" rx="12" ry="6" transform="rotate(-65 172 150)" fill="#d6ae6b" opacity="0.35"/>
        <circle cx="220" cy="220" r="6" fill="#d6ae6b" opacity="0.5"/>
        <circle cx="195" cy="195" r="4" fill="#c89a52" opacity="0.45"/>
        <path d="M88 228 L93 218 L98 228 L108 233 L98 238 L93 248 L88 238 L78 233 Z" fill="#d6ae6b" opacity="0.45"/>
        <path d="M228 84 L232 76 L236 84 L244 88 L236 92 L232 100 L228 92 L220 88 Z" fill="#d6ae6b" opacity="0.45"/>
      </g>
    </svg>
  `);
  return sharp(svg).png().toBuffer();
}
