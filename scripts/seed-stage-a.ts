import { getPayload } from "@engine/lib/payload";
import { ART_STYLE_META } from "@/lib/i18n";
import { getPlatformLimits } from "@/lib/settings";

interface SeedPromptItem {
  type: string;
  label: string;
  category:
    | "content_seo"
    | "translation"
    | "storybook_pipeline"
    | "video_pipeline"
    | "assistant";
  template: string;
  maxTokens?: number;
  notes?: string;
}

const DEFAULT_PROMPTS: SeedPromptItem[] = [
  // ── Content & SEO ──────────────────────────────────────────────────────────
  {
    type: "post-title",
    label: "Post Title (Заголовок статьи)",
    category: "content_seo",
    maxTokens: 160,
    template: `Write an engaging, warm, SEO-friendly blog article title in {{language}} for parents on {{siteName}} ({{siteDescription}}).
Voice/persona: {{aiPersona}}
Topic brief: {{brief}}
Additional context: {{additionalContext}}
Return ONLY the title text without quotation marks.`,
  },
  {
    type: "post-excerpt",
    label: "Post Excerpt (Краткий анонс)",
    category: "content_seo",
    maxTokens: 320,
    template: `Write a concise 2-sentence blog excerpt in {{language}} (max 220 characters) for an article titled "{{title}}" on {{siteName}}.
Context: {{brief}}
Return ONLY plain text without quotes.`,
  },
  {
    type: "post-content",
    label: "Post Content (Текст статьи HTML)",
    category: "content_seo",
    maxTokens: 3200,
    template: `Write a helpful, warmly written article in {{language}} for parents choosing personalized children's gifts on {{siteName}} ({{siteDescription}}).
Persona: {{aiPersona}}
Title: {{title}}
Brief: {{brief}}
Additional context: {{additionalContext}}
Formatting: return clean semantic HTML (<p>, <h2>, <h3>, <ul>, <li>, <strong>) ready for a rich-text editor. No markdown fences, no <h1>, no wrapper div.`,
  },
  {
    type: "post-tags",
    label: "Post Tags (Теги JSON)",
    category: "content_seo",
    maxTokens: 200,
    template: `Generate 4-6 concise lowercase blog tags in {{language}} for the article titled "{{title}}".
Brief: {{brief}}
Return ONLY a JSON array of strings, e.g. ["святий миколай", "казка pdf", "подарунок дитині"].`,
  },
  {
    type: "post-categorization",
    label: "Post Categorization (Рубрика и теги)",
    category: "content_seo",
    maxTokens: 260,
    template: `Analyze this article and assign a category and up to 5 tags in {{language}}.
Title: {{title}}
Excerpt: {{excerpt}}
Available categories: {{allPostCategories}}`,
  },
  {
    type: "post-seo",
    label: "Post SEO Meta",
    category: "content_seo",
    maxTokens: 400,
    template: `Generate SEO metadata (metaTitle under 60 chars, metaDescription 130-155 chars, focusKeyword) in {{language}} for a blog article on {{siteName}}.
Title: {{title}}
Excerpt: {{excerpt}}
Brief: {{brief}}`,
  },
  {
    type: "page-seo",
    label: "Page SEO Meta",
    category: "content_seo",
    maxTokens: 400,
    template: `Generate SEO metadata (metaTitle under 60 chars, metaDescription 130-155 chars, focusKeyword) in {{language}} for a landing/service page on {{siteName}} ({{siteDescription}}).
Page title: {{pageTitle}}
Context: {{pageContext}}`,
  },

  // ── Translation RU <-> UA ──────────────────────────────────────────────────
  {
    type: "translate-ru-uk",
    label: "Translation Rules (RU ↔ UA)",
    category: "translation",
    maxTokens: 2500,
    notes: "Дополнительные правила к системному двунаправленному переводчику.",
    template: `Preserve warm parent-facing tone, age phrasing ("У свої 6 років..." / "В свои 6 лет..."), and idiomatic Ukrainian/Russian gift terminology without literal calques.`,
  },

  // ── Website AI Assistant ───────────────────────────────────────────────────
  {
    type: "assistant-system",
    label: "AI Concierge System Prompt",
    category: "assistant",
    maxTokens: 700,
    notes: "Переменная {{language}} подставляется автоматически.",
    template: `You are VideoVitannya's warm, concise AI gift concierge speaking {{language}}.
Help parents personalize:
1) Video greeting from St. Nicholas: name must be 2–15 chars (suggest Ukrainian кличний відмінок if Ukrainian), achievement phrase MUST be 25–75 chars (hard max 90 chars) and read naturally after "У свої {age} ти ..." / "В свои {age} ты ...".
2) Illustrated Storybook PDF: help brainstorm cozy, magical, age-appropriate plot ideas, settings, or recurring favorite toys.
Keep answers concise, practical, and friendly.`,
  },

  // ── Storybook Pipeline ─────────────────────────────────────────────────────
  {
    type: "storybook-beats-system",
    label: "Storybook Step 1: Beats Architect",
    category: "storybook_pipeline",
    notes: "Переменная: {{langName}}. Суффикс strict JSON добавляется кодом.",
    template: `You are a master children's book architect writing in {{langName}}. Build concrete, warm, sensory story beats (never preachy). Strictly respect the declared child gender and companion species/relation/gender (for example, never turn a dog into a cat or change a companion's gender).`,
  },
  {
    type: "storybook-draft-system",
    label: "Storybook Step 2: Literary Writer",
    category: "storybook_pipeline",
    notes: "Переменные: {{langName}}, {{wordRange}}. Суффикс strict JSON добавляется кодом.",
    template: `You are an acclaimed children's author in {{langName}}.
Write warm, rhythmic read-aloud prose ({{wordRange}} words per page), concrete sensory details matching the chosen setting's season and world (e.g., rustle of leaves, warm bread, creak of wood — never inject snow or winter unless the setting calls for it), zero robotic AI clichés ("вдруг понял, что главное сокровище — дружба"), zero moralizing lectures.
Never put emojis, stars (★), or decorative symbols in titles, headings, or text — use plain Cyrillic prose and standard punctuation only.
Strictly preserve the child's gender and the companion's exact species/relation and gender (e.g. male dog MUST act, sound, and take masculine verbs like a dog — NEVER meow or purr!).
If layoutMode is "panorama", assign alternating "textZone": "left" or "right".`,
  },
  {
    type: "storybook-proofread-system",
    label: "Storybook Step 3: RU/UA Proofreader",
    category: "storybook_pipeline",
    notes:
      "Переменные: {{langName}}, {{childName}}, {{childNameVocative}}, {{genderPronoun}}, {{companionSummary}}, {{wordRange}}. JSON-схема добавляется кодом.",
    template: `You are a meticulous native {{langName}} literary proofreader for children's books.
Check and fix:
1) Case endings and declensions of the child's name "{{childName}}" (e.g., avoid errors like "вёл Мила" -> "вёл Милу").
2) In Ukrainian: use proper кличний відмінок ({{childNameVocative}}) in direct speech.
3) Consistent verb/adjective gender for child ({{genderPronoun}}) AND for the companion ({{companionSummary}}). Fix any species mismatch (e.g. if companion is a dog, remove cat sounds like "муркоче"/"мурлычет").
4) Natural punctuation, em-dashes, and warm read-aloud rhythm without changing the plot or shortening pages below {{wordRange}} words. Remove any emojis or decorative symbols like ★/✦.`,
  },
  {
    type: "storybook-director-system",
    label: "Storybook Step 4: Visual Director",
    category: "storybook_pipeline",
    notes: "Переменная: {{styleDesc}}. Суффикс strict JSON добавляется кодом.",
    template: `You are a master children's book Visual Director and Continuity Supervisor.
You receive FINAL proofread book pages and must design the VisualBible + per-page camera/composition/physics directing briefs so every illustration matches the text 1-to-1, avoids anatomical/physics glitches, keeps recurring story objects identical across pages, and NEVER repeats front-facing camera stares.

STRICT DIRECTING RULES (apply universally across any story world):
1. Camera variety & realistic scale: across pages, vary shot types and camera angles (wide over-the-shoulder three-quarter rear view, low-angle side-profile action, high-angle diagonal path view, intimate profile close-up on activity, wide environmental establishing shot). Keep foreground characters in realistic human scale relative to nearby midground paths, stalls, furniture, or bystanders, and never have characters stare blankly into the camera lens.
2. Strict spatial & character separation: match WHO is physically WHERE in the finalized page text. If a companion is far away in the background while the main child is in the foreground, set "companionPresent": true, "companionInForeground": false and place the companion strictly once at that distant spot — never duplicate them in the foreground. If absent from that page's text, set "companionPresent": false, "companionInForeground": false.
3. Permanent locks & recurring objects: keep "companionLock" and "clothingLock" free of transient one-off props. Any recurring story vehicle, vessel, creature, or landmark appearing on multiple pages MUST be locked in "keyObjectsLock" with rich silhouette, structure, and color palette so its design stays consistent across pages. Omit one-off props from earlier pages on later pages unless the current page text uses them.
4. Layered depth & strict Z-order occlusion: structure every "imagePrompt" explicitly in rich, atmospheric layers: [Shot & Camera Angle] -> [Foreground framing/details] -> [Midground subjects & actions] -> [Background scenery] -> [Constraints]. Whenever a scene looks through a window, doorway, arch, or railing, explicitly keep the frame and mullions/bars unbroken in the foreground in front of all exterior scenery so distant objects stay strictly behind glass and framing.
5. 3D perspective alignment: describe angled vehicles, sails, banners, flags, or signs aligned naturally with the object's heading and wind direction in 3D perspective — never flatten a side-viewed surface toward the viewer.
6. Isolated hands, natural creature poses & trails: never stage two characters' hands touching or handing over the same small object simultaneously (give each character an independent object or clear gesture). Non-human creatures interact naturally without extra paws or human thumbs (never force closed snouts flush against food). Any footprints, paw prints, or tracks trail strictly behind the walker with toes/tips pointing forward in the direction of travel, leaving ground ahead unmarked.
7. Style & Layout fidelity:
   - Art style is "{{styleDesc}}". Maintain rich painterly storybook detail, lighting, and atmosphere while keeping 2D illustrated proportions (never photorealistic skin pores or fabric macro).
   - For "coverPrompt": compose a warm full-body vertical cover scene (1024x1536) with boots/feet clearly visible on a firm path (~78% down from top), leaving calm sky/canopy in the top 18% and quiet foreground in bottom 20% for title typography.
   - If layoutMode is "panorama", preserve a quiet low-contrast scenic zone on each page's assigned "textZone" ("left" or "right" third) without lining characters up toward the viewer.`,
  },
  {
    type: "storybook-vision-qa",
    label: "Storybook Vision QA Checklist",
    category: "storybook_pipeline",
    notes: "Ожидаемое описание сцены и возврат JSON добавляются кодом.",
    template: `Check for ANY major defect in these 4 categories:
1) Depth/Occlusion/Perspective: e.g. distant outdoor objects crossing in front of indoor window bars/frames, flattened billboard sails on angled vehicles, or footprints pointing backwards.
2) Anatomy & Hands: extra/missing limbs, fused fingers gripping one shared item, mutated animal paws.
3) Spatial/Story Mismatch: duplicate character clone in foreground when meant to be distant, wrong pet species, or missing core scene subject.
4) Format: split panels, collage borders, or visible text/letters inside the artwork.`,
  },
  {
    type: "style-watercolor",
    label: "Art Style: Watercolor",
    category: "storybook_pipeline",
    template: ART_STYLE_META.watercolor.prompt,
  },
  {
    type: "style-3d_pixar",
    label: "Art Style: 3D Pixar",
    category: "storybook_pipeline",
    template: ART_STYLE_META["3d_pixar"].prompt,
  },
  {
    type: "style-folk_storybook",
    label: "Art Style: Folk Storybook",
    category: "storybook_pipeline",
    template: ART_STYLE_META.folk_storybook.prompt,
  },
  {
    type: "style-pencil_gouache",
    label: "Art Style: Pencil & Gouache",
    category: "storybook_pipeline",
    template: ART_STYLE_META.pencil_gouache.prompt,
  },
  {
    type: "style-2d_animation",
    label: "Art Style: 2D Animation",
    category: "storybook_pipeline",
    template: ART_STYLE_META["2d_animation"].prompt,
  },
  {
    type: "style-claymation",
    label: "Art Style: Claymation",
    category: "storybook_pipeline",
    template: ART_STYLE_META.claymation.prompt,
  },

  // ── Video Pipeline Script Lines (ElevenLabs TTS) ───────────────────────────
  {
    type: "video-line-03-uk",
    label: "Video Shot 03 Greeting (UA)",
    category: "video_pipeline",
    notes: "Переменные: {voc}, {name}. Длина под синхронизацию губ в шоте 03.",
    template: "Вітаю тебе, {voc}! Я так радий нарешті завітати до тебе особисто!",
  },
  {
    type: "video-line-03-ru",
    label: "Video Shot 03 Greeting (RU)",
    category: "video_pipeline",
    notes: "Переменные: {voc}, {name}. Длина под синхронизацию губ в шоте 03.",
    template: "Здравствуй, {voc}! Как же я рад заглянуть к тебе лично!",
  },
  {
    type: "video-line-04b-uk",
    label: "Video Shot 04b Achievement (UA)",
    category: "video_pipeline",
    notes: "Переменные: {agePrefix}, {ach}, {voc}, {name}, {age}.",
    template: "{agePrefix} {ach}…",
  },
  {
    type: "video-line-04b-ru",
    label: "Video Shot 04b Achievement (RU)",
    category: "video_pipeline",
    notes: "Переменные: {agePrefix}, {ach}, {voc}, {name}, {age}.",
    template: "{agePrefix} {ach}…",
  },
  {
    type: "video-line-07-uk",
    label: "Video Shot 07 Farewell (UA)",
    category: "video_pipeline",
    notes: "Переменные: {voc}, {name}.",
    template: "Щасливих свят, {voc}!",
  },
  {
    type: "video-line-07-ru",
    label: "Video Shot 07 Farewell (RU)",
    category: "video_pipeline",
    notes: "Переменные: {voc}, {name}.",
    template: "Счастливых праздников, {voc}!",
  },
];

function textToLexical(text: string) {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: [
        {
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr" as const,
          textFormat: 0,
          textStyle: "",
          children: [
            {
              type: "text",
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
              version: 1,
            },
          ],
        },
      ],
    },
  };
}

function hasLexicalContent(val: unknown): boolean {
  if (!val || typeof val !== "object" || !("root" in val)) return false;
  const root = (val as { root?: { children?: unknown[] } }).root;
  return Array.isArray(root?.children) && root.children.length > 0;
}

async function main() {
  const payload = await getPayload();

  // 1. Seed initial admin user if users collection is empty
  const existingUsers = await payload.find({
    collection: "users",
    limit: 1,
    overrideAccess: true,
  });

  if (existingUsers.totalDocs === 0) {
    const firstEmail =
      process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ||
      "admin@videovitannya.com.ua";
    const initialPassword =
      process.env.ADMIN_PASSWORD?.trim() || "Admin123456!";

    await payload.create({
      collection: "users",
      overrideAccess: true,
      data: {
        email: firstEmail,
        password: initialPassword,
      },
    });
    console.log(`[seed-stage-a] Created initial Payload admin user: ${firstEmail}`);
  } else {
    console.log(
      `[seed-stage-a] Users already exist (${existingUsers.totalDocs}); skipping user creation.`
    );
  }

  // 2. Seed SiteSettings (uk & ru) non-destructively
  const siteUk = (await payload.findGlobal({
    slug: "site-settings",
    locale: "uk",
    overrideAccess: true,
  })) as unknown as Record<string, unknown>;

  const existingSocials = Array.isArray(siteUk.socialLinks)
    ? siteUk.socialLinks
    : [];

  await payload.updateGlobal({
    slug: "site-settings",
    locale: "uk",
    overrideAccess: true,
    data: {
      siteName: (siteUk.siteName as string) || "VideoVitannya",
      tagline:
        (siteUk.tagline as string) ||
        "Персоналізовані відеопривітання та казки-книги PDF для дітей",
      contactEmail:
        (siteUk.contactEmail as string) || "hello@videovitannya.com.ua",
      telegramBotUrl:
        (siteUk.telegramBotUrl as string) ||
        "https://t.me/skynet_forever_bot",
      footerText: hasLexicalContent(siteUk.footerText)
        ? siteUk.footerText
        : textToLexical(
            "VideoVitannya — теплі персоналізовані відеопривітання та ілюстровані казки PDF для дітей в Україні."
          ),
      copyrightText: hasLexicalContent(siteUk.copyrightText)
        ? siteUk.copyrightText
        : textToLexical("Усі права захищено."),
      socialLinks:
        existingSocials.length > 0
          ? existingSocials
          : [
              {
                platform: "telegram",
                label: "Telegram-бот",
                url: "https://t.me/skynet_forever_bot",
              },
            ],
    },
  });

  const siteRu = (await payload.findGlobal({
    slug: "site-settings",
    locale: "ru",
    overrideAccess: true,
  })) as unknown as Record<string, unknown>;

  await payload.updateGlobal({
    slug: "site-settings",
    locale: "ru",
    overrideAccess: true,
    data: {
      siteName: (siteRu.siteName as string) || "VideoVitannya",
      tagline:
        (siteRu.tagline as string) ||
        "Персонализированные видеопоздравления и сказки-книги PDF для детей",
      footerText: hasLexicalContent(siteRu.footerText)
        ? siteRu.footerText
        : textToLexical(
            "VideoVitannya — тёплые персонализированные видеопоздравления и иллюстрированные сказки PDF для детей в Украине."
          ),
      copyrightText: hasLexicalContent(siteRu.copyrightText)
        ? siteRu.copyrightText
        : textToLexical("Все права защищены."),
    },
  });
  console.log("[seed-stage-a] SiteSettings (uk/ru) verified.");

  // 3. Seed AISettings (Content / SEO / Translate / Assistant)
  const currentAi = (await payload.findGlobal({
    slug: "ai-settings",
    overrideAccess: true,
  })) as unknown as Record<string, unknown>;

  const envOpenAiKey =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPEN_AI_KEY?.trim() ||
    "";
  const envElevenKey = process.env.ELEVENLABS_API_KEY?.trim() || "";

  await payload.updateGlobal({
    slug: "ai-settings",
    overrideAccess: true,
    data: {
      enabled: typeof currentAi.enabled === "boolean" ? currentAi.enabled : true,
      provider:
        (currentAi.provider as "openai" | "anthropic" | "google") || "openai",
      apiKey: (currentAi.apiKey as string) || envOpenAiKey || undefined,
      model:
        (currentAi.model as string) ||
        process.env.OPENAI_MODEL?.trim() ||
        "gpt-6.2-astra",
      reasoningEffort: (currentAi.reasoningEffort as string) || "low",
      maxTokens:
        typeof currentAi.maxTokens === "number" ? currentAi.maxTokens : 2500,
      temperature:
        typeof currentAi.temperature === "number" ? currentAi.temperature : 0.7,
      imageProvider:
        (currentAi.imageProvider as "openai" | "google") || "openai",
      imageApiKey:
        (currentAi.imageApiKey as string) || envOpenAiKey || undefined,
      imageModel:
        (currentAi.imageModel as string) ||
        process.env.OPENAI_IMAGE_MODEL?.trim() ||
        "gpt-image-2.5-sunburst-2026-09-08",
      siteDescription:
        (currentAi.siteDescription as string) ||
        "VideoVitannya — украинский сервис персонализированных видеопоздравлений (Святой Николай), иллюстрированных сказок-книг PDF с портретом ребёнка, оживления фото и персональных песен.",
      aiPersona:
        (currentAi.aiPersona as string) ||
        "Тёплый, бережный и живой тон для родителей в Украине. Без канцелярита и штампов. Для украинского языка — естественная литературная речь и кличний відмінок.",
    },
  });
  console.log("[seed-stage-a] AISettings verified/seeded.");

  // 4. Seed StorybookAISettings (separate global)
  const currentSb = (await payload.findGlobal({
    slug: "storybook-ai-settings",
    overrideAccess: true,
  })) as unknown as Record<string, unknown>;

  await payload.updateGlobal({
    slug: "storybook-ai-settings",
    overrideAccess: true,
    data: {
      writerProvider:
        (currentSb.writerProvider as "openai" | "anthropic" | "google") ||
        "openai",
      writerApiKey: (currentSb.writerApiKey as string) || envOpenAiKey || undefined,
      writerModel:
        (currentSb.writerModel as string) ||
        process.env.OPENAI_MODEL?.trim() ||
        "gpt-6.2-astra",
      writerReasoningEffort:
        (currentSb.writerReasoningEffort as string) || "low",
      directorProvider:
        (currentSb.directorProvider as "openai" | "anthropic" | "google") ||
        "openai",
      directorApiKey:
        (currentSb.directorApiKey as string) || envOpenAiKey || undefined,
      directorModel:
        (currentSb.directorModel as string) ||
        process.env.OPENAI_DIRECTOR_MODEL?.trim() ||
        "gpt-6.2-sol",
      directorReasoningEffort:
        (currentSb.directorReasoningEffort as string) || "low",
      visionQaEnabled:
        typeof currentSb.visionQaEnabled === "boolean"
          ? currentSb.visionQaEnabled
          : process.env.OPENAI_VISION_QA !== "false",
      imageProvider:
        (currentSb.imageProvider as "openai" | "google") || "openai",
      imageApiKey: (currentSb.imageApiKey as string) || envOpenAiKey || undefined,
      imageModel:
        (currentSb.imageModel as string) ||
        process.env.OPENAI_IMAGE_MODEL?.trim() ||
        "gpt-image-2.5-sunburst-2026-09-08",
      imageQuality:
        (currentSb.imageQuality as "low" | "medium" | "high" | "auto") ||
        ((process.env.OPENAI_IMAGE_QUALITY?.trim() as
          | "low"
          | "medium"
          | "high"
          | "auto") ||
          "medium"),
    },
  });
  console.log("[seed-stage-a] StorybookAISettings verified/seeded.");

  // 5. Seed ElevenLabsSettings (separate global)
  const currentEl = (await payload.findGlobal({
    slug: "elevenlabs-settings",
    overrideAccess: true,
  })) as unknown as Record<string, unknown>;

  await payload.updateGlobal({
    slug: "elevenlabs-settings",
    overrideAccess: true,
    data: {
      apiKey: (currentEl.apiKey as string) || envElevenKey || undefined,
      modelId:
        (currentEl.modelId as string) ||
        process.env.ELEVENLABS_MODEL_ID?.trim() ||
        "eleven_v4",
      voiceId:
        (currentEl.voiceId as string) ||
        process.env.ELEVENLABS_VOICE_ID?.trim() ||
        "NOpBlnGInO9m6vDvFkFC",
      stability:
        typeof currentEl.stability === "number" ? currentEl.stability : 0.5,
      similarityBoost:
        typeof currentEl.similarityBoost === "number"
          ? currentEl.similarityBoost
          : 0.78,
    },
  });
  console.log("[seed-stage-a] ElevenLabsSettings verified/seeded.");

  // 5b. Seed PlatformLimits global from SQLite defaults
  const sqliteLimits = getPlatformLimits();
  const currentLimits = (await payload.findGlobal({
    slug: "platform-limits",
    overrideAccess: true,
  })) as unknown as Record<string, unknown>;

  await payload.updateGlobal({
    slug: "platform-limits",
    overrideAccess: true,
    data: {
      maxPreviewOrdersPerSession:
        typeof currentLimits.maxPreviewOrdersPerSession === "number"
          ? currentLimits.maxPreviewOrdersPerSession
          : sqliteLimits.maxPreviewOrdersPerSession,
      maxAiEditsPerBook:
        typeof currentLimits.maxAiEditsPerBook === "number"
          ? currentLimits.maxAiEditsPerBook
          : sqliteLimits.maxAiEditsPerBook,
      maxAiEditsPerVideo:
        typeof currentLimits.maxAiEditsPerVideo === "number"
          ? currentLimits.maxAiEditsPerVideo
          : sqliteLimits.maxAiEditsPerVideo,
      orderRetentionDays:
        typeof currentLimits.orderRetentionDays === "number"
          ? currentLimits.orderRetentionDays
          : sqliteLimits.orderRetentionDays,
    },
  });
  console.log("[seed-stage-a] PlatformLimits verified/seeded.");

  // 4. Seed AIPrompts without overwriting existing custom templates
  const currentPromptsDoc = (await payload.findGlobal({
    slug: "ai-prompts",
    overrideAccess: true,
  })) as unknown as {
    prompts?: Array<SeedPromptItem & { id?: string }>;
  };

  const existingPrompts = currentPromptsDoc.prompts ?? [];
  const existingTypes = new Set(existingPrompts.map((p) => p.type));
  const missingPrompts = DEFAULT_PROMPTS.filter(
    (p) => !existingTypes.has(p.type)
  );

  if (missingPrompts.length > 0) {
    await payload.updateGlobal({
      slug: "ai-prompts",
      overrideAccess: true,
      data: {
        prompts: [...existingPrompts, ...missingPrompts],
      },
    });
    console.log(
      `[seed-stage-a] Added ${missingPrompts.length} default prompt template(s) (total: ${
        existingPrompts.length + missingPrompts.length
      }).`
    );
  } else {
    console.log(
      `[seed-stage-a] All ${DEFAULT_PROMPTS.length} prompt templates already present.`
    );
  }

  console.log("[seed-stage-a] Stage A seed completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-stage-a] Failed:", err);
  process.exit(1);
});
