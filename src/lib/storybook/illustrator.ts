import fs from "node:fs";
import path from "node:path";
import type OpenAI from "openai";
import { toFile } from "openai";
import sharp from "sharp";
import {
  buildChatModelParams,
  getCmsOpenAIRuntime,
  withOpenAIRetry,
} from "@/lib/openai-client";
import { resolveUploadPath } from "@/lib/storage";
import type { AiCostTracker } from "@/lib/ai-cost";
import { createWatermarkedPreviewImage } from "./watermark";
import type {
  LayoutMode,
  StorybookOrderPayload,
  StoryPageItem,
  StoryVisualBible,
} from "@/lib/types";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function renderDemoArt(
  outPath: string,
  layoutMode: LayoutMode | "cover_portrait",
  title: string,
  subtitle: string,
  sceneIndex: number
): Promise<void> {
  const width = layoutMode === "panorama" ? 1536 : 1024;
  const height = layoutMode === "cover_portrait" ? 1536 : 1024;
  const palettes = [
    ["#182848", "#2d4a7c", "#e8b86d"],
    ["#1e2444", "#3b4776", "#f2c17d"],
    ["#132a3e", "#2b5972", "#ffd28a"],
    ["#272042", "#4a3c74", "#f4b976"],
    ["#162d36", "#2a5d62", "#f6d08a"],
    ["#23213d", "#483d73", "#e6b877"],
    ["#192841", "#335480", "#f4cc83"],
  ];
  const [c1, c2, accent] = palettes[sceneIndex % palettes.length];
  const isLeftAir = sceneIndex % 2 === 1;
  const focalX = layoutMode === "panorama" ? (isLeftAir ? width * 0.68 : width * 0.32) : width * 0.5;

  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="65%" stop-color="${c2}" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="45%" r="45%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.45" />
          <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#sky)" />
      <circle cx="${focalX}" cy="${height * 0.42}" r="360" fill="url(#glow)" />
      <!-- Stars -->
      <circle cx="${width * 0.15}" cy="130" r="3" fill="#fff7e2" opacity="0.8"/>
      <circle cx="${width * 0.28}" cy="210" r="2.2" fill="#fff7e2" opacity="0.7"/>
      <circle cx="${width * 0.72}" cy="150" r="3.4" fill="#fff7e2" opacity="0.9"/>
      <circle cx="${width * 0.85}" cy="240" r="2.5" fill="#fff7e2" opacity="0.65"/>
      <circle cx="${width * 0.54}" cy="110" r="2.8" fill="#ffe7b3" opacity="0.85"/>
      <!-- Snowy hills -->
      <path d="M0 780 Q ${width * 0.28} 660, ${width * 0.55} 750 T ${width} 710 L ${width} ${height} L 0 ${height} Z" fill="#1e2d4d" opacity="0.85"/>
      <path d="M0 840 Q ${width * 0.35} 760, ${width * 0.68} 830 T ${width} 790 L ${width} ${height} L 0 ${height} Z" fill="#dbe6f6" opacity="0.92"/>
      <!-- Stylized cottage / lantern silhouette -->
      <rect x="${focalX - 90}" y="530" width="180" height="190" rx="14" fill="#291d2b" />
      <polygon points="${focalX - 110},535 ${focalX},420 ${focalX + 110},535" fill="#3a2835" />
      <rect x="${focalX - 32}" y="585" width="64" height="75" rx="32" fill="${accent}" opacity="0.95" />
      <circle cx="${focalX}" cy="622" r="95" fill="url(#glow)" />
      <!-- Demo badge -->
      <rect x="44" y="${height - 124}" width="${Math.min(width - 88, 620)}" height="80" rx="16" fill="rgba(11,16,32,0.52)" stroke="rgba(232,184,109,0.45)" />
      <text x="68" y="${height - 86}" fill="#f5d8a8" font-family="Georgia, serif" font-size="24" font-weight="bold">${escapeXml(title.slice(0, 48))}</text>
      <text x="68" y="${height - 58}" fill="#cbd5e1" font-family="Georgia, serif" font-size="16">${escapeXml(subtitle.slice(0, 68))}</text>
    </svg>
  `);

  await sharp(svg).png().toFile(outPath);
}

async function saveImageResponseToFile(
  responseData: { b64_json?: string; url?: string } | undefined,
  outPath: string
): Promise<void> {
  if (!responseData) {
    throw new Error("Empty image generation response");
  }
  if (responseData.b64_json) {
    const buf = Buffer.from(responseData.b64_json, "base64");
    await sharp(buf).png().toFile(outPath);
    return;
  }
  if (responseData.url) {
    const res = await fetch(responseData.url);
    if (!res.ok) throw new Error(`Failed downloading image URL: ${res.status}`);
    const arr = Buffer.from(await res.arrayBuffer());
    await sharp(arr).png().toFile(outPath);
    return;
  }
  throw new Error("Image response contained neither b64_json nor url");
}

function getMediumTranslationRule(artStyle: StorybookOrderPayload["artStyle"]): string {
  switch (artStyle) {
    case "3d_pixar":
      return "Translate the subject completely into a stylized 3D animated theatrical feature film character (smooth stylized CGI skin and proportions, expressive large eyes, sculpted hair, clean smooth render without noisy paper/canvas grain).";
    case "claymation":
      return "Translate the subject completely into a charming handcrafted stop-motion claymation miniature puppet (smooth matte sculpted plasticine head and hands, glossy bead-like doll eyes, simple sculpted nose and rosy cheeks — NEVER photorealistic human skin or photo face paste).";
    default:
      return "Translate the subject 100% into a flat 2D hand-drawn storybook illustration matching the exact art style (stylized 2D illustrated face, eyes, hair, and garments — ZERO photorealistic skin, ZERO pores, ZERO photographic lighting or real-world fabric macro, ZERO canvas weave or wavy halftone ripple).";
  }
}

function buildIllustrationPrompt(params: {
  scenePrompt: string;
  visualBible: StoryVisualBible;
  artStyle: StorybookOrderPayload["artStyle"];
  layoutMode: LayoutMode;
  textZone?: "left" | "right";
  isCover?: boolean;
  shotType?: string;
  cameraAngle?: string;
  subjectPoseAndGaze?: string;
  companionPresent?: boolean;
  companionInForeground?: boolean;
}): string {
  const {
    scenePrompt,
    visualBible,
    artStyle,
    layoutMode,
    textZone,
    isCover,
    shotType,
    cameraAngle,
    subjectPoseAndGaze,
    companionPresent,
    companionInForeground,
  } = params;
  const parts = [
    `Style: ${visualBible.styleLock}. Palette: ${visualBible.paletteLock}.`,
    `IDENTITY REFERENCE RULE: Use attached reference portrait(s) strictly for facial features, hair/fur color & markings, eyewear, and outfit palette — NEVER copy a front-facing studio pose or camera stare.`,
    `Camera & Depth Staging: ${
      [shotType, cameraAngle, subjectPoseAndGaze].filter(Boolean).join(" | ") ||
      "Natural cinematic storybook framing with clear foreground, midground, and background separation"
    }. Enforce strict depth occlusion (foreground window frames, mullions, arches, and railings remain unbroken in front of exterior/distant backgrounds) and natural 3D perspective (angled sails, flags, and banners align with the vehicle's heading rather than rotating flat toward the viewer).`,
    `Main character: ${visualBible.characterLock}. Outfit: ${visualBible.clothingLock}.`,
  ];

  if (visualBible.companionLock && (isCover || companionPresent !== false)) {
    if (!isCover && companionInForeground === false) {
      parts.push(
        `Companion character (place ONLY at the distant/background spot specified below — never duplicate in foreground): ${visualBible.companionLock}.`
      );
    } else {
      parts.push(`Companion character: ${visualBible.companionLock}.`);
    }
  }
  if (visualBible.recurringToyLock) {
    parts.push(
      `Recurring object lock (consistent across pages): ${visualBible.recurringToyLock}.`
    );
  }
  if (visualBible.keyObjectsLock) {
    parts.push(
      `Recurring story vehicle/object lock (preserve silhouette, parts, and colors across pages in natural 3D perspective): ${visualBible.keyObjectsLock}.`
    );
  }

  parts.push(
    `Scene action (keep each character's hands separated on independent objects — no shared two-person hand-offs on one small item): ${scenePrompt}.`
  );

  if (isCover) {
    parts.push(
      "Portrait book cover composition (1024x1536): show the FULL-BODY character(s) standing naturally on a firm foreground path or floor (boots/feet completely visible around 78% down from the top, NEVER buried waist-deep in snow, grass, or water), leaving calm open sky/canopy in the top 18% and calm natural foreground path/shadow in the bottom 20% for book title typography."
    );
  } else if (layoutMode === "panorama") {
    const side = textZone === "right" ? "right third" : "left third";
    parts.push(
      `Wide panoramic landscape illustration (1536x1024). Keep key faces slightly away from the exact horizontal midline and keep the ${side} calm and atmospheric (soft wall, sky, or foliage) so text overlays cleanly without covering characters.`
    );
  }

  const antiRipple =
    artStyle === "3d_pixar" || artStyle === "claymation"
      ? "Clean smooth render without noisy canvas grain or wavy halftone artifacts."
      : "Clean smooth matte illustration finish: NO canvas weave, NO corduroy bump, NO diagonal wavy hatching, NO noisy halftone ripple, NO photorealistic skin or photo collage.";

  parts.push(
    `CRITICAL RULES: Single continuous seamless full-bleed artwork only. ${antiRipple} NO book fold, NO central crease, NO split screens, NO collage panels, NO borders or frames, NO letters or text inside the image.`
  );

  return parts.join(" ");
}

/**
 * Generates the canonical character anchor portrait (`anchor.png`), grounded in the
 * uploaded EXIF-stripped child photo (if provided) or text attributes (if not).
 */
export async function generateCanonicalAnchor(params: {
  payload: StorybookOrderPayload;
  visualBible: StoryVisualBible;
  cleanDir: string;
  costTracker?: AiCostTracker;
}): Promise<string> {
  const anchorPath = path.join(params.cleanDir, "anchor.png");
  const { imageClient: client, config } = await getCmsOpenAIRuntime();

  if (!client) {
    await renderDemoArt(
      anchorPath,
      "classic",
      params.payload.childName,
      "Canonical Character Portrait Anchor",
      0
    );
    return anchorPath;
  }

  const imageModel = config.storybookImageModel;
  const quality = config.storybookImageQuality;
  const uploadPath = resolveUploadPath(params.payload.photoUploadId);
  const mediumRule = getMediumTranslationRule(params.payload.artStyle);

  const anchorPrompt = [
    `Create a warm children's storybook canonical character reference portrait sheet (relaxed waist-up three-quarter portrait on a clean soft warm cream backdrop).`,
    `Style: ${params.visualBible.styleLock}.`,
    `Character (gender=${params.payload.gender}, ageGroup=${params.payload.ageGroup}): ${params.visualBible.characterLock}.`,
    `Outfit: ${params.visualBible.clothingLock}.`,
    mediumRule,
    uploadPath
      ? "Keep ONLY the child's recognizable identity traits from the uploaded reference photo (hair color, hairstyle, eye color, glasses if worn, approximate age and warm expression). Completely discard the photo background, camera lighting, realistic skin pores, or any temporary marks/paint smudges so the rendered character looks 100% native to the target art style."
      : "Illustrate a warm expressive child matching the exact hair, eye, age, and glasses attributes.",
    "Clean smooth matte finish, zero wavy canvas noise, no text, no labels, single portrait only.",
  ].join(" ");

  if (uploadPath) {
    const uploadBuf = fs.readFileSync(uploadPath);
    const refFile = await toFile(uploadBuf, "child-photo.png", { type: "image/png" });
    const res = await withOpenAIRetry("anchor_edit", () =>
      client.images.edit({
        model: imageModel,
        image: refFile,
        prompt: anchorPrompt,
        size: "1024x1024",
        quality,
      })
    );
    params.costTracker?.addImageCall("anchor_edit", imageModel, "1024x1024", quality);
    await saveImageResponseToFile(res.data?.[0], anchorPath);
  } else {
    const res = await withOpenAIRetry("anchor_generate", () =>
      client.images.generate({
        model: imageModel,
        prompt: anchorPrompt,
        size: "1024x1024",
        quality,
      })
    );
    params.costTracker?.addImageCall("anchor_generate", imageModel, "1024x1024", quality);
    await saveImageResponseToFile(res.data?.[0], anchorPath);
  }

  return anchorPath;
}

/**
 * Generates a stylized canonical anchor for a family member or pet companion
 * (`companion_anchor.png`) so the raw uploaded photo can be deleted immediately.
 */
export async function generateCompanionAnchor(params: {
  payload: StorybookOrderPayload;
  visualBible: StoryVisualBible;
  cleanDir: string;
  costTracker?: AiCostTracker;
}): Promise<string | null> {
  const isAllowed =
    params.payload.companionType === "family" ||
    params.payload.companionType === "pet";
  const uploadPath = isAllowed
    ? resolveUploadPath(params.payload.companionPhotoUploadId)
    : null;
  if (!uploadPath) return null;

  const compAnchorPath = path.join(params.cleanDir, "companion_anchor.png");
  const { imageClient: client, config } = await getCmsOpenAIRuntime();

  if (!client) {
    await renderDemoArt(
      compAnchorPath,
      "classic",
      params.payload.companionName || "Companion",
      "Canonical Companion Portrait Anchor",
      1
    );
    return compAnchorPath;
  }

  const imageModel = config.storybookImageModel;
  const quality = config.storybookImageQuality;
  const mediumRule = getMediumTranslationRule(params.payload.artStyle);
  const authoritativeFacts = [
    params.payload.companionType === "pet" && params.payload.companionSpecies
      ? `species=${params.payload.companionSpecies}`
      : null,
    params.payload.companionType === "family" && params.payload.companionRelation
      ? `relation=${params.payload.companionRelation}`
      : null,
    params.payload.companionGender ? `gender=${params.payload.companionGender}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const prompt = [
    `Create a warm children's storybook canonical companion reference portrait on a clean soft warm cream backdrop.`,
    `Style: ${params.visualBible.styleLock}.`,
    authoritativeFacts
      ? `Authoritative identity (${authoritativeFacts} — NEVER change species or gender):`
      : "Companion:",
    `${params.visualBible.companionLock || params.payload.companionName || "companion"}.`,
    mediumRule,
    `Keep ONLY recognizable identity traits (species, hair/fur color, exact coat markings, ear shape, glasses/beard if any, warm expression) while translating 100% into the target storybook medium with ZERO photographic skin/background.`,
    "Clean smooth matte finish, zero wavy canvas noise, no text, no labels, single portrait only.",
  ].join(" ");

  const uploadBuf = fs.readFileSync(uploadPath);
  const refFile = await toFile(uploadBuf, "companion-photo.png", { type: "image/png" });
  const res = await withOpenAIRetry("companion_anchor", () =>
    client.images.edit({
      model: imageModel,
      image: refFile,
      prompt,
      size: "1024x1024",
      quality,
    })
  );
  params.costTracker?.addImageCall("companion_anchor", imageModel, "1024x1024", quality);
  await saveImageResponseToFile(res.data?.[0], compAnchorPath);
  return compAnchorPath;
}

async function generateSceneWithReferences(params: {
  anchorPath: string;
  companionAnchorPath: string | null;
  prompt: string;
  outPath: string;
  size: "1024x1024" | "1536x1024" | "1024x1536";
  costTracker?: AiCostTracker;
  costStep?: string;
  isQaRetry?: boolean;
}): Promise<void> {
  const { imageClient: client, config } = await getCmsOpenAIRuntime();
  if (!client) {
    throw new Error("OpenAI client unavailable");
  }

  const imageModel = config.storybookImageModel;
  const quality = config.storybookImageQuality;
  const anchorBuf = fs.readFileSync(params.anchorPath);
  const refs = [await toFile(anchorBuf, "anchor.png", { type: "image/png" })];

  if (params.companionAnchorPath && fs.existsSync(params.companionAnchorPath)) {
    const compBuf = fs.readFileSync(params.companionAnchorPath);
    refs.push(await toFile(compBuf, "companion_anchor.png", { type: "image/png" }));
  }

  const res = await withOpenAIRetry(`scene_${params.size}`, () =>
    client.images.edit({
      model: imageModel,
      image: refs.length === 1 ? refs[0] : (refs as never),
      prompt: params.prompt,
      size: params.size,
      quality,
    })
  );
  params.costTracker?.addImageCall(
    params.costStep || `scene_${params.size}`,
    imageModel,
    params.size,
    quality,
    Boolean(params.isQaRetry)
  );

  await saveImageResponseToFile(res.data?.[0], params.outPath);
}

/**
 * Lightweight Vision QA gate (gpt-6.2-sol) that checks generated artwork for universal
 * defects (depth/occlusion errors, flattened perspective, hand/limb glitches, text/spatial
 * mismatch, or split panels) and performs at most 1 targeted regeneration if needed.
 */
async function verifyAndRepairSceneImage(params: {
  anchorPath: string;
  companionAnchorPath: string | null;
  prompt: string;
  outPath: string;
  size: "1024x1024" | "1536x1024" | "1024x1536";
  expectedSummary: string;
  costTracker?: AiCostTracker;
  costStep?: string;
}): Promise<void> {
  await generateSceneWithReferences({
    anchorPath: params.anchorPath,
    companionAnchorPath: params.companionAnchorPath,
    prompt: params.prompt,
    outPath: params.outPath,
    size: params.size,
    costTracker: params.costTracker,
    costStep: params.costStep,
  });

  const { client, config } = await getCmsOpenAIRuntime();
  if (!config.storybookVisionQaEnabled) {
    return;
  }

  if (!client || !fs.existsSync(params.outPath)) {
    return;
  }

  try {
    const imgBuf = fs.readFileSync(params.outPath);
    const dataUrl = `data:image/png;base64,${imgBuf.toString("base64")}`;
    const directorModel = config.storybookDirectorModel;
    const qaPromptCustom = config.prompts["storybook-vision-qa"]?.trim();
    const qaChecklist =
      qaPromptCustom ||
      `Check for ANY major defect in these 4 categories:
1) Depth/Occlusion/Perspective: e.g. distant outdoor objects crossing in front of indoor window bars/frames, flattened billboard sails on angled vehicles, or footprints pointing backwards.
2) Anatomy & Hands: extra/missing limbs, fused fingers gripping one shared item, mutated animal paws.
3) Spatial/Story Mismatch: duplicate character clone in foreground when meant to be distant, wrong pet species, or missing core scene subject.
4) Format: split panels, collage borders, or visible text/letters inside the artwork.`;
    const qaRes = await withOpenAIRetry("vision_qa", () =>
      client.chat.completions.create({
        ...buildChatModelParams(0.1, 450, directorModel),
        messages: [
          {
            role: "system",
            content:
              "You are a strict children's book art QA reviewer. Inspect the illustration for major objective defects only. Minor stylistic variations are fine. Return strict JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Expected scene summary: ${params.expectedSummary}
${qaChecklist}

Return ONLY valid JSON:
{ "passed": true/false, "defectFix": "concise 1-sentence English visual fix instruction if passed=false, else empty string" }`,
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      })
    );
    params.costTracker?.addChatUsage("vision_qa", directorModel, qaRes.usage, true);

    const raw = (qaRes.choices[0]?.message?.content || "")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end <= start) return;
    const qa = JSON.parse(raw.slice(start, end + 1)) as {
      passed?: boolean;
      defectFix?: string;
    };

    if (qa.passed === false && qa.defectFix?.trim()) {
      console.warn(`[vision-qa] regenerating ${path.basename(params.outPath)}: ${qa.defectFix}`);
      await generateSceneWithReferences({
        anchorPath: params.anchorPath,
        companionAnchorPath: params.companionAnchorPath,
        prompt: `${params.prompt} CRITICAL VISUAL FIX: ${qa.defectFix.trim()}`,
        outPath: params.outPath,
        size: params.size,
        costTracker: params.costTracker,
        costStep: `${params.costStep || "scene"}_qa_repair`,
        isQaRetry: true,
      });
    }
  } catch (qaErr) {
    console.warn("[vision-qa] skipped due to transient error:", qaErr);
  }
}

export const PREVIEW_ILLUSTRATED_PAGES = 2;

async function renderSingleBookPage(params: {
  page: StoryPageItem;
  payload: StorybookOrderPayload;
  visualBible: StoryVisualBible;
  anchorPath: string;
  companionAnchorPath: string | null;
  cleanDir: string;
  previewDir: string;
  client: OpenAI | null;
  costTracker?: AiCostTracker;
}): Promise<StoryPageItem> {
  const { page, payload, visualBible, anchorPath, companionAnchorPath, cleanDir, previewDir, client } = params;
  const size: "1024x1024" | "1536x1024" =
    payload.layoutMode === "panorama" ? "1536x1024" : "1024x1024";
  const cleanFile = `page_${page.pageNumber}.png`;
  const previewFile = `page_${page.pageNumber}_preview.jpg`;
  const cleanPath = path.join(cleanDir, cleanFile);
  const previewPath = path.join(previewDir, previewFile);

  if (!client) {
    await renderDemoArt(
      cleanPath,
      payload.layoutMode,
      `${page.pageNumber}. ${page.heading}`,
      page.imagePrompt,
      page.pageNumber
    );
  } else {
    const prompt = buildIllustrationPrompt({
      scenePrompt: page.imagePrompt,
      visualBible,
      artStyle: payload.artStyle,
      layoutMode: payload.layoutMode,
      textZone: page.textZone,
      shotType: page.shotType,
      cameraAngle: page.cameraAngle,
      subjectPoseAndGaze: page.subjectPoseAndGaze,
      companionPresent: page.companionPresent,
      companionInForeground: page.companionInForeground,
    });
    const useCompanionRef =
      page.companionPresent !== false && page.companionInForeground !== false;
    await verifyAndRepairSceneImage({
      anchorPath,
      companionAnchorPath: useCompanionRef ? companionAnchorPath : null,
      prompt,
      outPath: cleanPath,
      size,
      expectedSummary: `${page.heading}: ${page.text}`,
      costTracker: params.costTracker,
      costStep: `page_${page.pageNumber}`,
    });
  }

  await createWatermarkedPreviewImage(cleanPath, previewPath, payload.lang);
  return {
    ...page,
    cleanImageFile: cleanFile,
    previewImageFile: previewFile,
    imageRevision: page.imageRevision || 1,
  };
}

/**
 * Stage 1 (pre-payment preview): generates Cover + first `previewPageLimit` pages
 * (default 2) and leaves remaining pages as text-only until payment hold/capture.
 */
export async function generatePreviewBookIllustrations(params: {
  payload: StorybookOrderPayload;
  visualBible: StoryVisualBible;
  coverPrompt: string;
  pages: StoryPageItem[];
  anchorPath: string;
  companionAnchorPath: string | null;
  cleanDir: string;
  previewDir: string;
  previewPageLimit?: number;
  onProgress?: (completed: number, total: number) => void;
  costTracker?: AiCostTracker;
}): Promise<{
  coverCleanFile: string;
  coverPreviewFile: string;
  pages: StoryPageItem[];
}> {
  const { imageClient: client } = await getCmsOpenAIRuntime();
  const limit = Math.max(1, params.previewPageLimit ?? PREVIEW_ILLUSTRATED_PAGES);
  const previewIndices = params.pages
    .map((p, idx) => ({ p, idx }))
    .filter(({ p }) => p.pageNumber <= limit)
    .map(({ idx }) => idx);

  const totalTasks = 1 + previewIndices.length;
  let completed = 0;

  const coverCleanFile = "cover.png";
  const coverPreviewFile = "cover_preview.jpg";
  const coverCleanPath = path.join(params.cleanDir, coverCleanFile);
  const coverPreviewPath = path.join(params.previewDir, coverPreviewFile);

  const coverFullPrompt = buildIllustrationPrompt({
    scenePrompt: params.coverPrompt,
    visualBible: params.visualBible,
    artStyle: params.payload.artStyle,
    layoutMode: "classic",
    isCover: true,
  });

  if (!client) {
    await renderDemoArt(
      coverCleanPath,
      "cover_portrait",
      params.payload.childName,
      "Demo Cover Illustration",
      0
    );
  } else {
    await verifyAndRepairSceneImage({
      anchorPath: params.anchorPath,
      companionAnchorPath: params.companionAnchorPath,
      prompt: coverFullPrompt,
      outPath: coverCleanPath,
      size: "1024x1536",
      expectedSummary: `Book cover for ${params.payload.childName}: ${params.coverPrompt}`,
      costTracker: params.costTracker,
      costStep: "cover",
    });
  }
  await createWatermarkedPreviewImage(coverCleanPath, coverPreviewPath, params.payload.lang);
  completed += 1;
  params.onProgress?.(completed, totalTasks);

  const updatedPages: StoryPageItem[] = params.pages.map((p) => ({ ...p }));
  const concurrency = 2;
  let cursor = 0;

  async function worker() {
    while (cursor < previewIndices.length) {
      const idx = previewIndices[cursor++];
      updatedPages[idx] = await renderSingleBookPage({
        page: params.pages[idx],
        payload: params.payload,
        visualBible: params.visualBible,
        anchorPath: params.anchorPath,
        companionAnchorPath: params.companionAnchorPath,
        cleanDir: params.cleanDir,
        previewDir: params.previewDir,
        client,
        costTracker: params.costTracker,
      });
      completed += 1;
      params.onProgress?.(completed, totalTasks);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, previewIndices.length)) }, worker));

  return {
    coverCleanFile,
    coverPreviewFile,
    pages: updatedPages,
  };
}

/**
 * Stage 2 (post-payment finalization / resume): renders any page missing its clean/preview artwork
 * using the stored canonical anchor & Visual Bible, invoking `onPageComplete` right after each page.
 */
export async function generateRemainingBookIllustrations(params: {
  payload: StorybookOrderPayload;
  visualBible: StoryVisualBible;
  pages: StoryPageItem[];
  anchorPath: string;
  companionAnchorPath: string | null;
  cleanDir: string;
  previewDir: string;
  onPageComplete?: (
    updatedPages: StoryPageItem[],
    completed: number,
    totalRemaining: number
  ) => void;
  costTracker?: AiCostTracker;
}): Promise<StoryPageItem[]> {
  const { imageClient: client } = await getCmsOpenAIRuntime();
  const updatedPages: StoryPageItem[] = params.pages.map((p) => ({ ...p }));

  const pendingIndices = updatedPages
    .map((p, idx) => {
      const hasClean =
        Boolean(p.cleanImageFile) &&
        fs.existsSync(path.join(params.cleanDir, p.cleanImageFile!));
      const hasPreview =
        Boolean(p.previewImageFile) &&
        fs.existsSync(path.join(params.previewDir, p.previewImageFile!));
      return hasClean && hasPreview ? -1 : idx;
    })
    .filter((idx) => idx >= 0);

  if (pendingIndices.length === 0) {
    return updatedPages;
  }

  const concurrency = 2;
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (cursor < pendingIndices.length) {
      const idx = pendingIndices[cursor++];
      const rendered = await renderSingleBookPage({
        page: updatedPages[idx],
        payload: params.payload,
        visualBible: params.visualBible,
        anchorPath: params.anchorPath,
        companionAnchorPath: params.companionAnchorPath,
        cleanDir: params.cleanDir,
        previewDir: params.previewDir,
        client,
        costTracker: params.costTracker,
      });
      updatedPages[idx] = rendered;
      completed += 1;
      params.onPageComplete?.(
        updatedPages.map((p) => ({ ...p })),
        completed,
        pendingIndices.length
      );
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, pendingIndices.length) }, worker));
  return updatedPages;
}

/**
 * Regenerates a single page's illustration using the stored canonical anchor + custom prompt tweak.
 */
export async function regenerateSinglePageIllustration(params: {
  payload: StorybookOrderPayload;
  visualBible: StoryVisualBible;
  page: StoryPageItem;
  instruction: string;
  anchorPath: string;
  companionAnchorPath?: string | null;
  cleanDir: string;
  previewDir: string;
  costTracker?: AiCostTracker;
}): Promise<StoryPageItem> {
  const { imageClient: client } = await getCmsOpenAIRuntime();
  const nextRevision = (params.page.imageRevision || 1) + 1;
  const cleanFile = `page_${params.page.pageNumber}_r${nextRevision}.png`;
  const previewFile = `page_${params.page.pageNumber}_r${nextRevision}_preview.jpg`;
  const cleanPath = path.join(params.cleanDir, cleanFile);
  const previewPath = path.join(params.previewDir, previewFile);
  const size: "1024x1024" | "1536x1024" =
    params.payload.layoutMode === "panorama" ? "1536x1024" : "1024x1024";

  const updatedPrompt = `${params.page.imagePrompt}. Requested visual adjustment: ${params.instruction}`;

  if (!client) {
    await renderDemoArt(
      cleanPath,
      params.payload.layoutMode,
      `${params.page.pageNumber}. ${params.page.heading} (v${nextRevision})`,
      updatedPrompt,
      params.page.pageNumber + nextRevision
    );
  } else {
    const fullPrompt = buildIllustrationPrompt({
      scenePrompt: updatedPrompt,
      visualBible: params.visualBible,
      artStyle: params.payload.artStyle,
      layoutMode: params.payload.layoutMode,
      textZone: params.page.textZone,
      shotType: params.page.shotType,
      cameraAngle: params.page.cameraAngle,
      subjectPoseAndGaze: params.page.subjectPoseAndGaze,
      companionPresent: params.page.companionPresent,
      companionInForeground: params.page.companionInForeground,
    });
    const useCompanionRef =
      params.page.companionPresent !== false &&
      params.page.companionInForeground !== false;
    await verifyAndRepairSceneImage({
      anchorPath: params.anchorPath,
      companionAnchorPath: useCompanionRef ? params.companionAnchorPath || null : null,
      prompt: fullPrompt,
      outPath: cleanPath,
      size,
      expectedSummary: `${params.page.heading}: ${params.page.text}. User fix: ${params.instruction}`,
      costTracker: params.costTracker,
      costStep: `edit_page_${params.page.pageNumber}`,
    });
  }

  await createWatermarkedPreviewImage(cleanPath, previewPath, params.payload.lang);

  return {
    ...params.page,
    imagePrompt: updatedPrompt,
    cleanImageFile: cleanFile,
    previewImageFile: previewFile,
    imageRevision: nextRevision,
  };
}
