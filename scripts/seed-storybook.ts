import fs from "node:fs";
import path from "node:path";
import { getPayload } from "@engine/lib/payload";
import { buildStaticStorybookRuntimeConfig } from "@/lib/storybook/config-shared";

const MIGRATED_PROMPT_KEYS = new Set([
  "storybook-beats-system",
  "storybook-draft-system",
  "storybook-proofread-system",
  "storybook-director-system",
  "storybook-vision-qa",
  "style-watercolor",
  "style-3d_pixar",
  "style-folk_storybook",
  "style-pencil_gouache",
  "style-2d_animation",
  "style-claymation",
]);

async function ensureSampleMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
  publicRelPath: string,
  alt: string
): Promise<number | string | undefined> {
  const cleanRel = publicRelPath.replace(/^\/+/, "");
  const fullPath = path.resolve(process.cwd(), "public", cleanRel);
  if (!fs.existsSync(fullPath)) return undefined;

  const baseName = path.basename(fullPath);
  const existing = await payload.find({
    collection: "media",
    where: {
      or: [
        { filename: { equals: baseName } },
        { alt: { equals: alt } },
      ],
    },
    limit: 1,
  });
  if (existing.docs.length > 0) {
    return existing.docs[0].id;
  }

  const data = fs.readFileSync(fullPath);
  const ext = path.extname(baseName).toLowerCase();
  const mimetype =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

  const created = await payload.create({
    collection: "media",
    data: { alt },
    file: {
      data,
      mimetype,
      name: baseName,
      size: data.length,
    },
  });
  return created.id;
}

async function main() {
  const payload = await getPayload();
  const baseline = buildStaticStorybookRuntimeConfig();

  // 1. Read existing ai-prompts to preserve any admin edits before migrating
  const aiPromptsRaw = (await payload
    .findGlobal({ slug: "ai-prompts" })
    .catch(() => ({ prompts: [] }))) as {
    prompts?: Array<{
      id?: string;
      type?: string;
      label?: string;
      category?: string;
      template?: string;
      maxTokens?: number;
      notes?: string;
    }>;
  };
  const existingPromptMap: Record<string, string> = {};
  for (const row of aiPromptsRaw.prompts ?? []) {
    if (row.type && typeof row.template === "string" && row.template.trim()) {
      existingPromptMap[row.type] = row.template;
    }
  }

  // 2. Seed StorybookStyles collection (uk + ru)
  let stylesCreated = 0;
  let stylesSkipped = 0;
  for (const style of baseline.styles) {
    const existing = await payload.find({
      collection: "storybook-styles" as never,
      where: { slug: { equals: style.slug } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      stylesSkipped += 1;
      continue;
    }

    const mediaId = await ensureSampleMedia(
      payload,
      style.previewImageUrl,
      `Стиль сказки: ${style.title.ru}`
    );

    const stylePrompt =
      existingPromptMap[`style-${style.slug}`]?.trim() || style.stylePrompt;

    const created = await payload.create({
      collection: "storybook-styles" as never,
      locale: "uk" as never,
      data: {
        slug: style.slug,
        title: style.title.uk,
        description: style.description.uk,
        badge: style.badge?.uk || "",
        previewImage: mediaId ?? undefined,
        fallbackImageUrl: style.previewImageUrl,
        enabled: style.enabled,
        isDefault: style.isDefault,
        sortOrder: style.sortOrder,
        stylePrompt,
        mediumPreset: style.mediumPreset,
      } as never,
    });

    await payload.update({
      collection: "storybook-styles" as never,
      id: created.id,
      locale: "ru" as never,
      data: {
        title: style.title.ru,
        description: style.description.ru,
        badge: style.badge?.ru || "",
      } as never,
    });

    stylesCreated += 1;
  }
  console.log(
    `[seed-storybook] storybook-styles: created=${stylesCreated}, skipped=${stylesSkipped}`
  );

  // 3. Seed StorybookConfig global (uk + ru)
  const currentConfig = (await payload
    .findGlobal({ slug: "storybook-config" as never, locale: "uk" as never, depth: 0 })
    .catch(() => ({}))) as Record<string, unknown>;

  const hasExistingConfig =
    Array.isArray(currentConfig.layouts) && currentConfig.layouts.length > 0;

  if (!hasExistingConfig) {
    const layoutMediaIds: Record<string, number | string | undefined> = {};
    for (const l of baseline.layouts) {
      layoutMediaIds[l.code] = await ensureSampleMedia(
        payload,
        l.previewImageUrl,
        `Режим вёрстки: ${l.label.ru}`
      );
    }

    const savedUk = (await payload.updateGlobal({
      slug: "storybook-config" as never,
      locale: "uk" as never,
      data: {
        layouts: baseline.layouts.map((l) => ({
          code: l.code,
          enabled: l.enabled,
          isDefault: l.isDefault,
          label: l.label.uk,
          badge: l.badge?.uk || "",
          description: l.description.uk,
          previewImage: layoutMediaIds[l.code] ?? undefined,
          fallbackImageUrl: l.previewImageUrl,
        })),
        ageGroups: baseline.ageGroups.map((a) => ({
          code: a.code,
          enabled: a.enabled,
          isDefault: a.isDefault,
          label: a.label.uk,
          hint: a.hint.uk,
          wordRange: a.wordRange,
          writerNote: a.writerNote || "",
        })),
        previewPagesCount: baseline.previewPagesCount,
        defaultPageCount: baseline.defaultPageCount,
        pageVolumes: baseline.pageVolumes.map((v) => ({
          pages: v.pages,
          enabled: v.enabled,
          isDefault: v.isDefault,
          readingTimeLabel: v.readingTimeLabel.uk,
        })),
        tones: baseline.tones.map((t) => ({
          slug: t.slug,
          enabled: t.enabled,
          icon: t.icon,
          label: t.label.uk,
          subtitle: t.subtitle.uk,
          promptHint: t.promptHint || "",
        })),
        settings: baseline.settings.map((s) => ({
          slug: s.slug,
          enabled: s.enabled,
          icon: s.icon,
          title: s.title.uk,
          description: s.description.uk,
          promptValue: s.promptValue.uk,
        })),
        plots: baseline.plots.map((p) => ({
          slug: p.slug,
          enabled: p.enabled,
          icon: p.icon,
          title: p.title.uk,
          description: p.description.uk,
          promptValue: p.promptValue.uk,
        })),
        presets: baseline.presets.map((pr, idx) => ({
          slug: pr.slug,
          label:
            idx === 0
              ? "Чарівне фентезі"
              : idx === 1
              ? "Затишна сміливість"
              : idx === 2
              ? "Космічна подорож"
              : "Веселі динозаври",
          toneSlug: pr.toneSlug,
          settingSlug: pr.settingSlug,
          plotSlug: pr.plotSlug,
        })),
        hairSwatches: baseline.hairSwatches.map((h) => ({
          slug: h.slug,
          color: h.color,
          label: h.label.uk,
          promptEn: h.promptEn || "",
        })),
        eyeSwatches: baseline.eyeSwatches.map((e) => ({
          slug: e.slug,
          color: e.color,
          label: e.label.uk,
          promptEn: e.promptEn || "",
        })),
        petSpecies: baseline.petSpecies.map((p) => ({
          slug: p.slug,
          enabled: p.enabled,
          label: p.label.uk,
          promptEn: p.promptEn,
        })),
        familyRelations: baseline.familyRelations.map((f) => ({
          slug: f.slug,
          enabled: f.enabled,
          label: f.label.uk,
          promptEn: f.promptEn,
          impliedGender: f.impliedGender,
        })),
        toyPresets: baseline.toyPresets.map((t) => ({
          label: t.label.uk,
        })),
        promptBeatsSystem:
          existingPromptMap["storybook-beats-system"] || baseline.prompts.beatsSystem,
        promptDraftSystem:
          existingPromptMap["storybook-draft-system"] || baseline.prompts.draftSystem,
        promptProofreadSystem:
          existingPromptMap["storybook-proofread-system"] ||
          baseline.prompts.proofreadSystem,
        promptDirectorSystem:
          existingPromptMap["storybook-director-system"] ||
          baseline.prompts.directorSystem,
        promptVisionQa:
          existingPromptMap["storybook-vision-qa"] || baseline.prompts.visionQa,
        pdfWatermarkText: baseline.pdf.watermarkText.uk,
        pdfJpegQuality: baseline.pdf.jpegQuality,
      } as never,
    })) as Record<string, unknown>;

    const arrWithRu = <T extends Record<string, unknown>>(
      savedRows: unknown,
      mapper: (row: Record<string, unknown>, idx: number) => T
    ): T[] => {
      if (!Array.isArray(savedRows)) return [];
      return savedRows.map((raw, idx) => {
        const rec = raw as Record<string, unknown>;
        return {
          ...rec,
          ...mapper(rec, idx),
        };
      });
    };

    const presetLabelsRu = [
      "Волшебное фэнтези",
      "Уютная смелость",
      "Космическое путешествие",
      "Весёлые динозавры",
    ];

    await payload.updateGlobal({
      slug: "storybook-config" as never,
      locale: "ru" as never,
      data: {
        layouts: arrWithRu(savedUk.layouts, (_row, idx) => ({
          label: baseline.layouts[idx]?.label.ru ?? "",
          badge: baseline.layouts[idx]?.badge?.ru ?? "",
          description: baseline.layouts[idx]?.description.ru ?? "",
        })),
        ageGroups: arrWithRu(savedUk.ageGroups, (_row, idx) => ({
          label: baseline.ageGroups[idx]?.label.ru ?? "",
          hint: baseline.ageGroups[idx]?.hint.ru ?? "",
        })),
        pageVolumes: arrWithRu(savedUk.pageVolumes, (_row, idx) => ({
          readingTimeLabel: baseline.pageVolumes[idx]?.readingTimeLabel.ru ?? "",
        })),
        tones: arrWithRu(savedUk.tones, (_row, idx) => ({
          label: baseline.tones[idx]?.label.ru ?? "",
          subtitle: baseline.tones[idx]?.subtitle.ru ?? "",
        })),
        settings: arrWithRu(savedUk.settings, (_row, idx) => ({
          title: baseline.settings[idx]?.title.ru ?? "",
          description: baseline.settings[idx]?.description.ru ?? "",
          promptValue: baseline.settings[idx]?.promptValue.ru ?? "",
        })),
        plots: arrWithRu(savedUk.plots, (_row, idx) => ({
          title: baseline.plots[idx]?.title.ru ?? "",
          description: baseline.plots[idx]?.description.ru ?? "",
          promptValue: baseline.plots[idx]?.promptValue.ru ?? "",
        })),
        presets: arrWithRu(savedUk.presets, (_row, idx) => ({
          label: presetLabelsRu[idx] ?? "",
        })),
        hairSwatches: arrWithRu(savedUk.hairSwatches, (_row, idx) => ({
          label: baseline.hairSwatches[idx]?.label.ru ?? "",
        })),
        eyeSwatches: arrWithRu(savedUk.eyeSwatches, (_row, idx) => ({
          label: baseline.eyeSwatches[idx]?.label.ru ?? "",
        })),
        petSpecies: arrWithRu(savedUk.petSpecies, (_row, idx) => ({
          label: baseline.petSpecies[idx]?.label.ru ?? "",
        })),
        familyRelations: arrWithRu(savedUk.familyRelations, (_row, idx) => ({
          label: baseline.familyRelations[idx]?.label.ru ?? "",
        })),
        toyPresets: arrWithRu(savedUk.toyPresets, (_row, idx) => ({
          label: baseline.toyPresets[idx]?.label.ru ?? "",
        })),
        pdfWatermarkText: baseline.pdf.watermarkText.ru,
      } as never,
    });

    console.log("[seed-storybook] storybook-config: seeded (uk + ru)");
  } else {
    console.log("[seed-storybook] storybook-config: already populated, skipped");
  }

  // 4. Clean up migrated storybook-* and style-* entries from ai-prompts
  const remainingPrompts = (aiPromptsRaw.prompts ?? []).filter(
    (p) => !p.type || !MIGRATED_PROMPT_KEYS.has(p.type)
  );
  const removedCount = (aiPromptsRaw.prompts ?? []).length - remainingPrompts.length;
  if (removedCount > 0) {
    await payload.updateGlobal({
      slug: "ai-prompts",
      data: {
        prompts: remainingPrompts,
      } as never,
    });
    console.log(
      `[seed-storybook] ai-prompts: removed ${removedCount} migrated storybook/style prompts (kept ${remainingPrompts.length})`
    );
  } else {
    console.log("[seed-storybook] ai-prompts: already clean");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-storybook] Failed:", err);
  process.exit(1);
});
