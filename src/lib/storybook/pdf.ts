import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFImage, PDFFont, PDFPage, degrees, rgb } from "pdf-lib";
import sharp from "sharp";
import { getStoragePaths } from "@/lib/storage";
import {
  createCoverScrimBuffer,
  createPanoramaCardBuffer,
  findSmartPanoramaPlacement,
  loadDecorationAssets,
  sanitizeBookText,
} from "./pdf-assets";
import type { Lang, LayoutMode, StorybookResult } from "@/lib/types";

const A4_PORTRAIT: [number, number] = [595.28, 841.89];
const A4_LANDSCAPE: [number, number] = [841.89, 595.28];

const CREAM_BG = rgb(0.992, 0.973, 0.937);
const GOLD_PRIMARY = rgb(0.79, 0.63, 0.33);
const GOLD_SOFT = rgb(0.85, 0.74, 0.49);
const BRONZE_HEAD = rgb(0.5, 0.34, 0.11);
const INK_DARK = rgb(0.15, 0.16, 0.22);

function loadFonts(): { regular: Buffer; bold: Buffer; italic: Buffer } {
  const { FONTS_DIR } = getStoragePaths();
  const regular = fs.readFileSync(path.join(FONTS_DIR, "georgia.ttf"));
  const bold = fs.readFileSync(path.join(FONTS_DIR, "georgiab.ttf"));
  const italicPath = path.join(FONTS_DIR, "georgiai.ttf");
  const italic = fs.existsSync(italicPath) ? fs.readFileSync(italicPath) : regular;
  return { regular, bold, italic };
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${current} ${words[i]}`;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
    lines.push("");
  }

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

async function embedImageFile(pdf: PDFDocument, filePath: string): Promise<PDFImage> {
  const bytes = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") {
    return pdf.embedJpg(bytes);
  }
  const jpgBytes = await sharp(bytes)
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toBuffer();
  return pdf.embedJpg(jpgBytes);
}

function drawDoubleFrame(
  page: PDFPage,
  width: number,
  height: number,
  outerInset: number,
  innerOffset: number,
  outerColor = GOLD_PRIMARY,
  innerColor = GOLD_SOFT
): void {
  page.drawRectangle({
    x: outerInset,
    y: outerInset,
    width: width - outerInset * 2,
    height: height - outerInset * 2,
    borderColor: outerColor,
    borderWidth: 1.25,
  });
  const innerInset = outerInset + innerOffset;
  page.drawRectangle({
    x: innerInset,
    y: innerInset,
    width: width - innerInset * 2,
    height: height - innerInset * 2,
    borderColor: innerColor,
    borderWidth: 0.6,
  });
}

function drawPageWatermark(
  page: PDFPage,
  fontBold: PDFFont,
  lang: Lang
): void {
  const { width, height } = page.getSize();
  const label =
    lang === "uk"
      ? "VIDEOVITANNYA • ЗРАЗОК • НЕ ДЛЯ ДРУКУ"
      : "VIDEOVITANNYA • ОБРАЗЕЦ • НЕ ДЛЯ ПЕЧАТИ";
  page.drawText(label, {
    x: width * 0.14,
    y: height * 0.22,
    size: 26,
    font: fontBold,
    color: rgb(0.75, 0.18, 0.18),
    opacity: 0.24,
    rotate: degrees(32),
  });
  page.drawText(label, {
    x: width * 0.16,
    y: height * 0.62,
    size: 26,
    font: fontBold,
    color: rgb(0.75, 0.18, 0.18),
    opacity: 0.24,
    rotate: degrees(32),
  });
}

function drawDividerCentered(
  page: PDFPage,
  dividerImg: PDFImage | null,
  centerX: number,
  y: number,
  targetWidth: number
): number {
  if (dividerImg) {
    const h = (dividerImg.height / dividerImg.width) * targetWidth;
    page.drawImage(dividerImg, {
      x: centerX - targetWidth / 2,
      y: y - h,
      width: targetWidth,
      height: h,
      opacity: 0.92,
    });
    return h;
  }
  page.drawLine({
    start: { x: centerX - targetWidth * 0.4, y: y - 6 },
    end: { x: centerX + targetWidth * 0.4, y: y - 6 },
    thickness: 1.2,
    color: GOLD_PRIMARY,
  });
  return 12;
}

/**
 * Compiles either the watermarked low-res preview PDF or the full-resolution
 * print-ready Cyrillic PDF in either Classic Book or Panoramic Spread layout.
 */
export async function buildStorybookPdf(params: {
  result: StorybookResult;
  layoutMode: LayoutMode;
  lang: Lang;
  cleanDir: string;
  previewDir: string;
  mode: "preview" | "clean";
  outPath: string;
}): Promise<void> {
  const { result, layoutMode, lang, cleanDir, previewDir, mode, outPath } = params;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const { regular, bold, italic } = loadFonts();
  const fontRegular = await pdf.embedFont(regular, { subset: true });
  const fontBold = await pdf.embedFont(bold, { subset: true });
  const fontItalic = await pdf.embedFont(italic, { subset: true });

  const assets = await loadDecorationAssets();
  const vignetteImg = await pdf.embedPng(assets.cornerVignette);
  const wreathImg = assets.dedicationWreath
    ? await pdf.embedPng(assets.dedicationWreath)
    : null;
  const dividerImg = assets.chapterDivider
    ? await pdf.embedPng(assets.chapterDivider)
    : null;
  const coverCorners = assets.coverCorners
    ? {
        tl: await pdf.embedPng(assets.coverCorners.tl),
        tr: await pdf.embedPng(assets.coverCorners.tr),
        bl: await pdf.embedPng(assets.coverCorners.bl),
        br: await pdf.embedPng(assets.coverCorners.br),
      }
    : null;

  const cleanTitle = sanitizeBookText(result.title, fontBold);
  const cleanSubtitle = sanitizeBookText(result.subtitle, fontItalic);

  const resolveImgPath = (cleanName: string, previewName: string) =>
    mode === "clean"
      ? path.join(cleanDir, cleanName)
      : path.join(previewDir, previewName);

  // 1. Luxury Cover Page (Portrait A4)
  const coverPage = pdf.addPage(A4_PORTRAIT);
  const [cw, ch] = A4_PORTRAIT;
  coverPage.drawRectangle({ x: 0, y: 0, width: cw, height: ch, color: rgb(0.055, 0.085, 0.175) });

  const coverImgPath = resolveImgPath(result.coverCleanFile, result.coverPreviewFile);
  let isPortraitCoverArt = false;
  let coverImg: PDFImage | null = null;
  if (fs.existsSync(coverImgPath)) {
    coverImg = await embedImageFile(pdf, coverImgPath);
    isPortraitCoverArt = coverImg.height > coverImg.width * 1.15;
  }

  if (coverImg && isPortraitCoverArt) {
    const scale = Math.max(cw / coverImg.width, ch / coverImg.height);
    const drawW = coverImg.width * scale;
    const drawH = coverImg.height * scale;
    coverPage.drawImage(coverImg, {
      x: (cw - drawW) / 2,
      y: (ch - drawH) / 2,
      width: drawW,
      height: drawH,
    });
    const scrimBuf = await createCoverScrimBuffer(cw, ch, "fullbleed");
    const scrimImg = await pdf.embedPng(scrimBuf);
    coverPage.drawImage(scrimImg, { x: 0, y: 0, width: cw, height: ch });
  } else {
    if (assets.coverBackdrop) {
      const clothImg = await pdf.embedPng(assets.coverBackdrop);
      const scale = Math.max(cw / clothImg.width, ch / clothImg.height);
      const dw = clothImg.width * scale;
      const dh = clothImg.height * scale;
      coverPage.drawImage(clothImg, {
        x: (cw - dw) / 2,
        y: (ch - dh) / 2,
        width: dw,
        height: dh,
      });
    } else {
      const haloBuf = await createCoverScrimBuffer(cw, ch, "framed");
      const haloImg = await pdf.embedPng(haloBuf);
      coverPage.drawImage(haloImg, { x: 0, y: 0, width: cw, height: ch });
    }

    if (coverImg) {
      const imgSize = cw - 116;
      const imgX = (cw - imgSize) / 2;
      const imgY = ch - 94 - imgSize;
      coverPage.drawImage(coverImg, {
        x: imgX,
        y: imgY,
        width: imgSize,
        height: imgSize,
      });
      coverPage.drawRectangle({
        x: imgX - 4,
        y: imgY - 4,
        width: imgSize + 8,
        height: imgSize + 8,
        borderColor: GOLD_SOFT,
        borderWidth: 0.75,
      });
      coverPage.drawRectangle({
        x: imgX,
        y: imgY,
        width: imgSize,
        height: imgSize,
        borderColor: GOLD_PRIMARY,
        borderWidth: 1.8,
      });
    }
  }

  // Ornate gold double frame & filigree corners on cover
  drawDoubleFrame(coverPage, cw, ch, 18, 6, GOLD_PRIMARY, GOLD_SOFT);
  if (coverCorners) {
    const cornerSize = 94;
    const pad = 16;
    coverPage.drawImage(coverCorners.tl, { x: pad, y: ch - pad - cornerSize, width: cornerSize, height: cornerSize, opacity: 0.9 });
    coverPage.drawImage(coverCorners.tr, { x: cw - pad - cornerSize, y: ch - pad - cornerSize, width: cornerSize, height: cornerSize, opacity: 0.9 });
    coverPage.drawImage(coverCorners.bl, { x: pad, y: pad, width: cornerSize, height: cornerSize, opacity: 0.9 });
    coverPage.drawImage(coverCorners.br, { x: cw - pad - cornerSize, y: pad, width: cornerSize, height: cornerSize, opacity: 0.9 });
  }

  // Cover top eyebrow
  const editionLabel =
    lang === "uk" ? "ІМЕННА КАЗКА • СПЕЦІАЛЬНЕ ВИДАННЯ" : "ИМЕННАЯ СКАЗКА • СПЕЦИАЛЬНОЕ ИЗДАНИЕ";
  const edW = fontItalic.widthOfTextAtSize(editionLabel, 9.5);
  coverPage.drawText(editionLabel, {
    x: (cw - edW) / 2,
    y: ch - 52,
    size: 9.5,
    font: fontItalic,
    color: rgb(0.94, 0.85, 0.64),
  });

  // Cover title + flourish + subtitle
  let titleSize = 25;
  let titleLines = wrapText(cleanTitle, fontBold, titleSize, cw - 110).filter(Boolean);
  if (titleLines.length > 2) {
    titleSize = 21.5;
    titleLines = wrapText(cleanTitle, fontBold, titleSize, cw - 110).filter(Boolean);
  }
  const titleStep = titleSize + 8;
  let ty = isPortraitCoverArt ? 178 + (titleLines.length - 1) * (titleStep * 0.45) : 206;
  for (const line of titleLines) {
    const lw = fontBold.widthOfTextAtSize(line, titleSize);
    coverPage.drawText(line, {
      x: (cw - lw) / 2,
      y: ty,
      size: titleSize,
      font: fontBold,
      color: rgb(0.98, 0.9, 0.7),
    });
    ty -= titleStep;
  }

  const divH = drawDividerCentered(coverPage, dividerImg, cw / 2, ty + 4, 175);
  const subLines = wrapText(cleanSubtitle, fontItalic, 12.5, cw - 120).filter(Boolean);
  let sy = Math.max(66, ty - divH - 12);
  for (const line of subLines) {
    const lw = fontItalic.widthOfTextAtSize(line, 12.5);
    coverPage.drawText(line, {
      x: (cw - lw) / 2,
      y: sy,
      size: 12.5,
      font: fontItalic,
      color: rgb(0.86, 0.9, 0.96),
    });
    sy -= 18;
  }

  if (mode === "preview") drawPageWatermark(coverPage, fontBold, lang);

  // 2. Dedication / Wish Page (with illustrated botanical & celestial wreath)
  if (result.dedication || layoutMode === "classic") {
    const titlePage = pdf.addPage(layoutMode === "panorama" ? A4_LANDSCAPE : A4_PORTRAIT);
    const { width, height } = titlePage.getSize();
    titlePage.drawRectangle({ x: 0, y: 0, width, height, color: CREAM_BG });
    drawDoubleFrame(titlePage, width, height, 24, 5);

    const wreathSize = Math.min(width, height) * 0.8;
    const wreathX = (width - wreathSize) / 2;
    const wreathY = (height - wreathSize) / 2 + 8;

    if (wreathImg) {
      titlePage.drawImage(wreathImg, {
        x: wreathX,
        y: wreathY,
        width: wreathSize,
        height: wreathSize,
        opacity: 0.96,
      });
    } else {
      titlePage.drawImage(vignetteImg, {
        x: width - 195,
        y: 28,
        width: 165,
        height: 165,
        opacity: 0.85,
      });
    }

    const innerTextW = Math.min(width - 180, wreathSize * 0.56);
    const eyebrow = lang === "uk" ? "Особисте побажання" : "Личное пожелание";
    const ebW = fontItalic.widthOfTextAtSize(eyebrow, 11.5);
    titlePage.drawText(eyebrow, {
      x: (width - ebW) / 2,
      y: wreathY + wreathSize * 0.7,
      size: 11.5,
      font: fontItalic,
      color: BRONZE_HEAD,
    });

    let dedTitleSize = 18.5;
    let dedTitleLines = wrapText(cleanTitle, fontBold, dedTitleSize, innerTextW).filter(Boolean);
    if (dedTitleLines.length > 2) {
      dedTitleSize = 16;
      dedTitleLines = wrapText(cleanTitle, fontBold, dedTitleSize, innerTextW).filter(Boolean);
    }

    let cursorY = wreathY + wreathSize * 0.62;
    for (const line of dedTitleLines) {
      const lw = fontBold.widthOfTextAtSize(line, dedTitleSize);
      titlePage.drawText(line, {
        x: (width - lw) / 2,
        y: cursorY,
        size: dedTitleSize,
        font: fontBold,
        color: INK_DARK,
      });
      cursorY -= dedTitleSize + 6;
    }

    const dH = drawDividerCentered(titlePage, dividerImg, width / 2, cursorY + 2, 130);
    cursorY -= dH + 14;

    const rawDed =
      result.dedication?.trim() ||
      (lang === "uk"
        ? "Створено з любов'ю спеціально для особливого читача. Нехай кожна сторінка дарує тепло, сміливість і віру в дива."
        : "Создано с любовью специально для особенного читателя. Пусть каждая страница дарит тепло, смелость и веру в чудеса.");
    const cleanDed = sanitizeBookText(rawDed, fontItalic);
    const dedLines = wrapText(cleanDed, fontItalic, 13, innerTextW);
    for (const line of dedLines) {
      if (line !== "") {
        const lw = fontItalic.widthOfTextAtSize(line, 13);
        titlePage.drawText(line, {
          x: (width - lw) / 2,
          y: cursorY,
          size: 13,
          font: fontItalic,
          color: rgb(0.28, 0.26, 0.24),
        });
      }
      cursorY -= 20;
    }

    const signNote = lang === "uk" ? "З теплом і любов'ю" : "С теплом и любовью";
    const signW = fontItalic.widthOfTextAtSize(signNote, 10.5);
    titlePage.drawText(signNote, {
      x: (width - signW) / 2,
      y: wreathY + wreathSize * 0.19,
      size: 10.5,
      font: fontItalic,
      color: BRONZE_HEAD,
    });

    if (mode === "preview") drawPageWatermark(titlePage, fontBold, lang);
  }

  // 3. Story pages
  for (const item of result.pages) {
    const cleanFile = item.cleanImageFile || `page_${item.pageNumber}.png`;
    const previewFile = item.previewImageFile || `page_${item.pageNumber}_preview.jpg`;
    const imgPath = resolveImgPath(cleanFile, previewFile);
    const cleanImgPath = path.join(cleanDir, cleanFile);

    const cleanHeading = sanitizeBookText(item.heading, fontBold);
    const cleanBody = sanitizeBookText(item.text, fontRegular);

    if (layoutMode === "classic") {
      // Page A: Full Illustration page (Portrait A4)
      const artPage = pdf.addPage(A4_PORTRAIT);
      const [pw, ph] = A4_PORTRAIT;
      artPage.drawRectangle({ x: 0, y: 0, width: pw, height: ph, color: CREAM_BG });
      drawDoubleFrame(artPage, pw, ph, 24, 5, GOLD_SOFT, rgb(0.9, 0.82, 0.63));

      const box = pw - 92;
      const xPos = (pw - box) / 2;
      const yPos = (ph - box) / 2;

      if (fs.existsSync(imgPath)) {
        const img = await embedImageFile(pdf, imgPath);
        artPage.drawImage(img, { x: xPos, y: yPos, width: box, height: box });
      } else {
        artPage.drawRectangle({
          x: xPos,
          y: yPos,
          width: box,
          height: box,
          color: rgb(0.955, 0.935, 0.892),
        });
        const lockTitle = sanitizeBookText(
          lang === "uk"
            ? `Ілюстрація сторінки ${item.pageNumber}`
            : `Иллюстрация страницы ${item.pageNumber}`,
          fontBold
        );
        const lockSub = sanitizeBookText(
          lang === "uk"
            ? "Відкриється одразу після оплати замовлення"
            : "Откроется сразу после оплаты заказа",
          fontItalic
        );
        const tW = fontBold.widthOfTextAtSize(lockTitle, 16);
        const sW = fontItalic.widthOfTextAtSize(lockSub, 12.5);
        artPage.drawText(lockTitle, {
          x: (pw - tW) / 2,
          y: yPos + box / 2 + 12,
          size: 16,
          font: fontBold,
          color: BRONZE_HEAD,
        });
        artPage.drawText(lockSub, {
          x: (pw - sW) / 2,
          y: yPos + box / 2 - 12,
          size: 12.5,
          font: fontItalic,
          color: rgb(0.36, 0.34, 0.32),
        });
      }
      artPage.drawRectangle({
        x: xPos - 3.5,
        y: yPos - 3.5,
        width: box + 7,
        height: box + 7,
        borderColor: GOLD_SOFT,
        borderWidth: 0.75,
      });
      artPage.drawRectangle({
        x: xPos,
        y: yPos,
        width: box,
        height: box,
        borderColor: GOLD_PRIMARY,
        borderWidth: 1.6,
      });
      if (mode === "preview") drawPageWatermark(artPage, fontBold, lang);

      // Page B: Cream Typography page with double gold frame, chapter flourish & botanical vignette
      const textPage = pdf.addPage(A4_PORTRAIT);
      textPage.drawRectangle({ x: 0, y: 0, width: pw, height: ph, color: CREAM_BG });
      drawDoubleFrame(textPage, pw, ph, 24, 5);

      const vigSize = 185;
      textPage.drawImage(vignetteImg, {
        x: pw - vigSize - 26,
        y: 26,
        width: vigSize,
        height: vigSize,
        opacity: 0.92,
      });

      const chapterLabel = `${item.pageNumber}. ${cleanHeading}`;
      const headLines = wrapText(chapterLabel, fontBold, 19, pw - 136).filter(Boolean);
      let cursorY = ph - 115;
      for (const line of headLines) {
        textPage.drawText(line, {
          x: 68,
          y: cursorY,
          size: 19,
          font: fontBold,
          color: BRONZE_HEAD,
        });
        cursorY -= 25;
      }

      if (dividerImg) {
        const divW = 148;
        const divH = (dividerImg.height / dividerImg.width) * divW;
        textPage.drawImage(dividerImg, {
          x: 66,
          y: cursorY + 4 - divH,
          width: divW,
          height: divH,
          opacity: 0.88,
        });
        cursorY -= divH + 20;
      } else {
        textPage.drawLine({
          start: { x: 68, y: cursorY + 4 },
          end: { x: 190, y: cursorY + 4 },
          thickness: 1.5,
          color: GOLD_PRIMARY,
        });
        cursorY -= 28;
      }

      const bodyLines = wrapText(cleanBody, fontRegular, 15.5, pw - 136);
      for (const line of bodyLines) {
        if (cursorY < 130) break;
        if (line !== "") {
          textPage.drawText(line, {
            x: 68,
            y: cursorY,
            size: 15.5,
            font: fontRegular,
            color: INK_DARK,
          });
        }
        cursorY -= 25.5;
      }

      const numStr = `· ${item.pageNumber} ·`;
      const numW = fontItalic.widthOfTextAtSize(numStr, 11);
      textPage.drawText(numStr, {
        x: (pw - numW) / 2,
        y: 44,
        size: 11,
        font: fontItalic,
        color: rgb(0.5, 0.44, 0.36),
      });

      if (mode === "preview") drawPageWatermark(textPage, fontBold, lang);
    } else {
      // Panoramic Spread (Landscape A4: full-bleed artwork + smart-placed styled parchment plaque)
      const spread = pdf.addPage(A4_LANDSCAPE);
      const [sw, sh] = A4_LANDSCAPE;

      if (fs.existsSync(imgPath)) {
        const img = await embedImageFile(pdf, imgPath);
        const scale = Math.max(sw / img.width, sh / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        spread.drawImage(img, {
          x: (sw - drawW) / 2,
          y: (sh - drawH) / 2,
          width: drawW,
          height: drawH,
        });
      } else {
        spread.drawRectangle({ x: 0, y: 0, width: sw, height: sh, color: rgb(0.11, 0.145, 0.245) });
        const artCenterX = item.textZone === "right" ? sw * 0.28 : sw * 0.72;
        const lockNote = sanitizeBookText(
          lang === "uk"
            ? `Ілюстрація сторінки ${item.pageNumber} відкриється після оплати`
            : `Иллюстрация страницы ${item.pageNumber} откроется после оплаты`,
          fontItalic
        );
        const nW = fontItalic.widthOfTextAtSize(lockNote, 13);
        spread.drawText(lockNote, {
          x: artCenterX - nW / 2,
          y: sh / 2,
          size: 13,
          font: fontItalic,
          color: rgb(0.88, 0.78, 0.56),
        });
      }

      const boxW = Math.round(sw * 0.375);
      const innerW = boxW - 48;
      const headLines = wrapText(`${item.pageNumber}. ${cleanHeading}`, fontBold, 15.5, innerW).filter(Boolean);

      const divW = 118;
      const divH = dividerImg ? (dividerImg.height / dividerImg.width) * divW : 12;
      const dividerBlockH = dividerImg ? divH + 10 : 12;
      const topPad = 32;
      const bottomPad = 34;
      const maxBoxH = sh - 64;

      const calcBoxH = (linesCount: number, lineH: number) =>
        topPad + headLines.length * 21 + dividerBlockH + linesCount * lineH + bottomPad;

      let bodySize = 12.2;
      let bodyLineH = 18.5;
      let bodyLines = wrapText(cleanBody, fontRegular, bodySize, innerW);

      const fontSteps: Array<[number, number]> = [
        [11.4, 17.0],
        [10.6, 15.6],
        [9.8, 14.4],
      ];
      for (const [sz, lh] of fontSteps) {
        if (calcBoxH(bodyLines.length, bodyLineH) <= maxBoxH) break;
        bodySize = sz;
        bodyLineH = lh;
        bodyLines = wrapText(cleanBody, fontRegular, bodySize, innerW);
      }

      const boxH = Math.min(maxBoxH, Math.max(175, Math.ceil(calcBoxH(bodyLines.length, bodyLineH))));

      // Smart placement on the calmest area (using clean image if present so preview & clean match)
      const placementSource = fs.existsSync(cleanImgPath) ? cleanImgPath : imgPath;
      const preferredSide = item.textZone === "right" ? "right" : "left";
      const placement = await findSmartPanoramaPlacement(
        placementSource,
        preferredSide,
        boxW / sw,
        boxH / sh
      );

      const boxX = Math.round(placement.xLeftFrac * sw);
      // PDF y-axis is bottom-up while image yTopFrac is top-down
      const boxY = Math.round(sh - (placement.yTopFrac + boxH / sh) * sh);

      const { buffer: cardBuf, padPt } = await createPanoramaCardBuffer(boxW, boxH);
      const cardImg = await pdf.embedPng(cardBuf);
      spread.drawImage(cardImg, {
        x: boxX - padPt,
        y: boxY - padPt,
        width: boxW + padPt * 2,
        height: boxH + padPt * 2,
      });

      let cy = boxY + boxH - topPad;
      for (const line of headLines) {
        spread.drawText(line, {
          x: boxX + 24,
          y: cy,
          size: 15.5,
          font: fontBold,
          color: BRONZE_HEAD,
        });
        cy -= 21;
      }

      if (dividerImg) {
        spread.drawImage(dividerImg, {
          x: boxX + 24,
          y: cy + 4 - divH,
          width: divW,
          height: divH,
          opacity: 0.85,
        });
        cy -= divH + 10;
      } else {
        cy -= 10;
      }

      for (const line of bodyLines) {
        if (cy < boxY + 24) break;
        if (line !== "") {
          spread.drawText(line, {
            x: boxX + 24,
            y: cy,
            size: bodySize,
            font: fontRegular,
            color: INK_DARK,
          });
        }
        cy -= bodyLineH;
      }

      const pNum = `· ${item.pageNumber} ·`;
      const pNumW = fontItalic.widthOfTextAtSize(pNum, 10);
      spread.drawText(pNum, {
        x: boxX + boxW - 24 - pNumW,
        y: boxY + 15,
        size: 10,
        font: fontItalic,
        color: rgb(0.46, 0.4, 0.32),
      });

      if (mode === "preview") drawPageWatermark(spread, fontBold, lang);
    }
  }

  const pdfBytes = await pdf.save();
  fs.writeFileSync(outPath, pdfBytes);
}
