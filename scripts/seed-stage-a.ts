import { getPayload } from "@engine/lib/payload";
import { buildBaselinePlatformLimits } from "@/lib/settings";

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

  // 5b. Seed PlatformLimits global from baseline defaults
  const defaultLimits = buildBaselinePlatformLimits();
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
          : defaultLimits.maxPreviewOrdersPerSession,
      maxAiEditsPerBook:
        typeof currentLimits.maxAiEditsPerBook === "number"
          ? currentLimits.maxAiEditsPerBook
          : defaultLimits.maxAiEditsPerBook,
      maxAiEditsPerVideo:
        typeof currentLimits.maxAiEditsPerVideo === "number"
          ? currentLimits.maxAiEditsPerVideo
          : defaultLimits.maxAiEditsPerVideo,
      orderRetentionDays:
        typeof currentLimits.orderRetentionDays === "number"
          ? currentLimits.orderRetentionDays
          : defaultLimits.orderRetentionDays,
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
