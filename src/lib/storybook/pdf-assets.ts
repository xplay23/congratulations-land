import fs from "node:fs";
import path from "node:path";
import type { PDFFont } from "pdf-lib";
import sharp from "sharp";
import { getStoragePaths } from "@/lib/storage";
import type { StorybookPdfConfig } from "./config-shared";
import { createCornerVignetteBuffer } from "./watermark";

export interface DecorationAssets {
  cornerVignette: Buffer;
  dedicationWreath: Buffer | null;
  chapterDivider: Buffer | null;
  coverBackdrop: Buffer | null;
  coverCorners: {
    tl: Buffer;
    tr: Buffer;
    bl: Buffer;
    br: Buffer;
  } | null;
}

let cachedAssets: { version: number; assets: DecorationAssets } | null = null;

/**
 * Loads transparent-background storybook decoration PNGs from CMS uploads (if set)
 * with automatic fallback to `assets/decorations/`, and prepares mirrored corner variants.
 */
export async function loadDecorationAssets(
  pdfConfig?: StorybookPdfConfig,
  cacheVersion = 0
): Promise<DecorationAssets> {
  if (cachedAssets && cachedAssets.version === cacheVersion) {
    return cachedAssets.assets;
  }

  const { DECORATIONS_DIR } = getStoragePaths();
  const readCustomOrDefault = (
    customPath: string | undefined,
    defaultFile: string
  ): Buffer | null => {
    if (customPath && fs.existsSync(customPath)) {
      return fs.readFileSync(customPath);
    }
    const p = path.join(DECORATIONS_DIR, defaultFile);
    return fs.existsSync(p) ? fs.readFileSync(p) : null;
  };

  const cornerVignette =
    readCustomOrDefault(pdfConfig?.decorCornerVignettePath, "corner_vignette.png") ||
    (await createCornerVignetteBuffer());
  const dedicationWreath = readCustomOrDefault(
    pdfConfig?.decorDedicationWreathPath,
    "dedication_wreath.png"
  );
  const chapterDivider = readCustomOrDefault(
    pdfConfig?.decorChapterDividerPath,
    "chapter_divider.png"
  );
  const coverBackdrop = readCustomOrDefault(
    pdfConfig?.decorCoverBackdropPath,
    "cover_backdrop.png"
  );
  const rawCorner = readCustomOrDefault(
    pdfConfig?.decorCoverCornerPath,
    "cover_corner.png"
  );

  let coverCorners: DecorationAssets["coverCorners"] = null;
  if (rawCorner) {
    const resized = await sharp(rawCorner).resize(420, 420, { fit: "fill" }).png().toBuffer();
    const [tr, bl, br] = await Promise.all([
      sharp(resized).flop().png().toBuffer(),
      sharp(resized).flip().png().toBuffer(),
      sharp(resized).flop().flip().png().toBuffer(),
    ]);
    coverCorners = { tl: resized, tr, bl, br };
  }

  const assets: DecorationAssets = {
    cornerVignette,
    dedicationWreath,
    chapterDivider,
    coverBackdrop,
    coverCorners,
  };
  cachedAssets = { version: cacheVersion, assets };
  return assets;
}

/**
 * Strips invisible control characters and symbols/emojis (like ★) that are
 * missing in Georgia TTF and would otherwise render as tofu boxes (□).
 */
export function sanitizeBookText(raw: string, font: PDFFont): string {
  const normalized = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "")
    .replace(/[\u2600-\u27BF\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[ \t]+\n/g, "\n");

  let out = "";
  for (const ch of normalized) {
    if (ch === "\n") {
      out += ch;
      continue;
    }
    try {
      font.encodeText(ch);
      out += ch;
    } catch {
      // Drop unsupported glyphs so missing-glyph rectangles never appear
    }
  }
  return out.replace(/ {2,}/g, " ").trim();
}

/**
 * Generates an atmospheric midnight-indigo gradient scrim PNG for full-bleed
 * or framed book covers so gold serif titles stay crisp over any artwork.
 */
export async function createCoverScrimBuffer(
  widthPt: number,
  heightPt: number,
  variant: "fullbleed" | "framed"
): Promise<Buffer> {
  const scale = 1.5;
  const w = Math.round(widthPt * scale);
  const h = Math.round(heightPt * scale);

  const svg =
    variant === "fullbleed"
      ? `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0a1022" stop-opacity="0.72" />
              <stop offset="18%" stop-color="#0a1022" stop-opacity="0.22" />
              <stop offset="30%" stop-color="#0a1022" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="botScrim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="56%" stop-color="#0a1022" stop-opacity="0" />
              <stop offset="72%" stop-color="#0a1022" stop-opacity="0.62" />
              <stop offset="86%" stop-color="#0a1022" stop-opacity="0.88" />
              <stop offset="100%" stop-color="#080d1c" stop-opacity="0.95" />
            </linearGradient>
          </defs>
          <rect width="${w}" height="${h}" fill="url(#topScrim)" />
          <rect width="${w}" height="${h}" fill="url(#botScrim)" />
        </svg>`
      : `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="halo" cx="50%" cy="40%" r="58%">
              <stop offset="0%" stop-color="#223462" stop-opacity="0.55" />
              <stop offset="55%" stop-color="#111a36" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#070b17" stop-opacity="0.72" />
            </radialGradient>
          </defs>
          <rect width="${w}" height="${h}" fill="url(#halo)" />
        </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Generates a high-DPI rounded translucent parchment plaque with a soft shadow,
 * double antique gold hairline border, and corner diamond accents for panoramic spreads.
 */
export async function createPanoramaCardBuffer(
  boxWPt: number,
  boxHPt: number
): Promise<{ buffer: Buffer; padPt: number }> {
  const padPt = 14;
  const dpiScale = 2.5;
  const w = Math.round((boxWPt + padPt * 2) * dpiScale);
  const h = Math.round((boxHPt + padPt * 2) * dpiScale);
  const pad = Math.round(padPt * dpiScale);
  const cw = w - pad * 2;
  const ch = h - pad * 2;
  const rx = Math.round(16 * dpiScale);
  const innerInset = Math.round(7 * dpiScale);
  const innerRx = Math.round(11 * dpiScale);

  const cOff = innerInset + Math.round(7.5 * dpiScale);
  const arcPad = innerInset + Math.round(4.5 * dpiScale);
  const arcR = Math.round(7.5 * dpiScale);
  const dotR = 1.6 * dpiScale;
  const xL = pad + arcPad;
  const xR = pad + cw - arcPad;
  const yT = pad + arcPad;
  const yB = pad + ch - arcPad;

  const svg = Buffer.from(`
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="parch" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stop-color="#fffcf5" stop-opacity="0.93" />
          <stop offset="55%" stop-color="#fcf6e8" stop-opacity="0.91" />
          <stop offset="100%" stop-color="#f6ebd6" stop-opacity="0.89" />
        </linearGradient>
        <filter id="cardShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="${Math.round(4 * dpiScale)}" stdDeviation="${Math.round(5.5 * dpiScale)}" flood-color="#091022" flood-opacity="0.34" />
        </filter>
      </defs>
      <rect x="${pad}" y="${pad}" width="${cw}" height="${ch}" rx="${rx}" fill="url(#parch)" filter="url(#cardShadow)" stroke="#cba254" stroke-width="${1.6 * dpiScale}" />
      <rect x="${pad + innerInset}" y="${pad + innerInset}" width="${cw - innerInset * 2}" height="${ch - innerInset * 2}" rx="${innerRx}" fill="none" stroke="#d9bb7c" stroke-width="${0.75 * dpiScale}" opacity="0.85" />
      <path d="M ${xL} ${yT + arcR} A ${arcR} ${arcR} 0 0 1 ${xL + arcR} ${yT}" fill="none" stroke="#c89b4b" stroke-width="${0.85 * dpiScale}" stroke-linecap="round" opacity="0.65" />
      <path d="M ${xR - arcR} ${yT} A ${arcR} ${arcR} 0 0 1 ${xR} ${yT + arcR}" fill="none" stroke="#c89b4b" stroke-width="${0.85 * dpiScale}" stroke-linecap="round" opacity="0.65" />
      <path d="M ${xR} ${yB - arcR} A ${arcR} ${arcR} 0 0 1 ${xR - arcR} ${yB}" fill="none" stroke="#c89b4b" stroke-width="${0.85 * dpiScale}" stroke-linecap="round" opacity="0.65" />
      <path d="M ${xL + arcR} ${yB} A ${arcR} ${arcR} 0 0 1 ${xL} ${yB - arcR}" fill="none" stroke="#c89b4b" stroke-width="${0.85 * dpiScale}" stroke-linecap="round" opacity="0.65" />
      <circle cx="${pad + cOff}" cy="${pad + cOff}" r="${dotR}" fill="#c89b4b" opacity="0.7" />
      <circle cx="${pad + cw - cOff}" cy="${pad + cOff}" r="${dotR}" fill="#c89b4b" opacity="0.7" />
      <circle cx="${pad + cOff}" cy="${pad + ch - cOff}" r="${dotR}" fill="#c89b4b" opacity="0.7" />
      <circle cx="${pad + cw - cOff}" cy="${pad + ch - cOff}" r="${dotR}" fill="#c89b4b" opacity="0.7" />
    </svg>
  `);

  const buffer = await sharp(svg).png().toBuffer();
  return { buffer, padPt };
}

export interface SmartPlacementResult {
  side: "left" | "right";
  xLeftFrac: number;
  yTopFrac: number;
}

/**
 * Analyzes a panoramic spread image using edge energy, color saturation, and
 * focal warmth/luminance salience to place the text plaque on the calmest
 * area without covering characters, faces, lanterns, or key focal details.
 */
export async function findSmartPanoramaPlacement(
  imgPath: string,
  preferredSide: "left" | "right",
  boxWFrac: number,
  boxHFrac: number
): Promise<SmartPlacementResult> {
  const marginX = 0.033;
  const marginY = 0.055;
  const fallbackY = Math.max(marginY, (1 - boxHFrac) / 2);

  if (!fs.existsSync(imgPath)) {
    return {
      side: preferredSide,
      xLeftFrac: preferredSide === "left" ? marginX : 1 - marginX - boxWFrac,
      yTopFrac: fallbackY,
    };
  }

  const GW = 192;
  const GH = 128;
  const { data } = await sharp(imgPath)
    .resize(GW, GH, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const lum = new Float32Array(GW * GH);
  const sat = new Float32Array(GW * GH);
  for (let i = 0; i < GW * GH; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    sat[i] = mx > 0 ? (mx - mn) / mx : 0;
  }

  const clutter = new Float32Array(GW * GH);
  for (let y = 1; y < GH - 1; y++) {
    for (let x = 1; x < GW - 1; x++) {
      const idx = y * GW + x;
      const edge =
        Math.abs(lum[idx + 1] - lum[idx - 1]) +
        Math.abs(lum[idx + GW] - lum[idx - GW]);
      const r = data[idx * 3];
      const g = data[idx * 3 + 1];
      const b = data[idx * 3 + 2];
      const isWarmFocal = r > g + 25 && r > b + 35 && sat[idx] > 0.35 ? 35 : 0;
      const isBrightGlow = lum[idx] > 215 && sat[idx] > 0.2 ? 25 : 0;
      clutter[idx] = edge * 1.3 + sat[idx] * 22 + isWarmFocal + isBrightGlow;
    }
  }

  const ps = new Float64Array((GW + 1) * (GH + 1));
  for (let y = 0; y < GH; y++) {
    let rowSum = 0;
    for (let x = 0; x < GW; x++) {
      rowSum += clutter[y * GW + x];
      ps[(y + 1) * (GW + 1) + (x + 1)] = ps[y * (GW + 1) + (x + 1)] + rowSum;
    }
  }

  const rectMean = (x0: number, y0: number, x1: number, y1: number) => {
    const ix0 = Math.max(0, Math.min(GW - 1, Math.round(x0 * GW)));
    const iy0 = Math.max(0, Math.min(GH - 1, Math.round(y0 * GH)));
    const ix1 = Math.max(ix0 + 1, Math.min(GW, Math.round(x1 * GW)));
    const iy1 = Math.max(iy0 + 1, Math.min(GH, Math.round(y1 * GH)));
    const sum =
      ps[iy1 * (GW + 1) + ix1] -
      ps[iy0 * (GW + 1) + ix1] -
      ps[iy1 * (GW + 1) + ix0] +
      ps[iy0 * (GW + 1) + ix0];
    return sum / Math.max(1, (ix1 - ix0) * (iy1 - iy0));
  };

  const maxTop = Math.max(marginY, 1 - marginY - boxHFrac);
  const yCandidates = [0, 0.25, 0.5, 0.75, 1].map(
    (t) => marginY + (maxTop - marginY) * t
  );

  const evaluateSide = (side: "left" | "right") => {
    const xLeftFrac = side === "left" ? marginX : 1 - marginX - boxWFrac;
    let best: { side: "left" | "right"; xLeftFrac: number; yTopFrac: number; score: number } | null = null;
    for (const yTopFrac of yCandidates) {
      const score = rectMean(xLeftFrac, yTopFrac, xLeftFrac + boxWFrac, yTopFrac + boxHFrac);
      if (!best || score < best.score) {
        best = { side, xLeftFrac, yTopFrac, score };
      }
    }
    return best!;
  };

  const pref = evaluateSide(preferredSide);
  const alt = evaluateSide(preferredSide === "left" ? "right" : "left");
  // Switch side only if the opposite side is dramatically calmer
  const chosen = alt.score < pref.score * 0.55 ? alt : pref;

  return {
    side: chosen.side,
    xLeftFrac: chosen.xLeftFrac,
    yTopFrac: chosen.yTopFrac,
  };
}
