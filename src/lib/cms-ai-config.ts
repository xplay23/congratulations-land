import { getPayload } from "@engine/lib/payload";
import type { ArtStyle } from "./types";

export type ReasoningEffortLevel =
  | "auto"
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high";

export type AiTextProvider = "openai" | "anthropic" | "google";
export type AiImageProvider = "openai" | "google";

export interface CmsAiRuntimeConfig {
  // General AI (Content / SEO / Translate / Assistant)
  enabled: boolean;
  provider: AiTextProvider;
  apiKey: string | null;
  textModel: string;
  reasoningEffort: ReasoningEffortLevel;
  maxTokens: number;
  temperature: number;
  imageProvider: AiImageProvider;
  imageApiKey: string | null;
  imageModel: string;
  siteDescription: string;
  aiPersona: string;

  // Storybook Pipeline (separate global)
  storybookWriterProvider: AiTextProvider;
  storybookWriterApiKey: string | null;
  storybookWriterModel: string;
  storybookWriterReasoningEffort: ReasoningEffortLevel;

  storybookDirectorProvider: AiTextProvider;
  storybookDirectorApiKey: string | null;
  storybookDirectorModel: string;
  storybookDirectorReasoningEffort: ReasoningEffortLevel;
  storybookVisionQaEnabled: boolean;

  storybookImageProvider: AiImageProvider;
  storybookImageApiKey: string | null;
  storybookImageModel: string;
  storybookImageQuality: "low" | "medium" | "high" | "auto";

  // ElevenLabs TTS (separate global)
  elevenLabsApiKey: string | null;
  elevenLabsModelId: string;
  elevenLabsVoiceId: string;
  elevenLabsStability: number;
  elevenLabsSimilarityBoost: number;

  // Prompt templates
  prompts: Record<string, string>;
}

const CACHE_TTL_MS = 30_000;
let cachedConfig: { value: CmsAiRuntimeConfig; expiresAt: number } | null = null;
let inFlight: Promise<CmsAiRuntimeConfig> | null = null;

export function invalidateCmsAiConfigCache(): void {
  cachedConfig = null;
}

function normalizeProvider(raw: unknown): AiTextProvider {
  if (raw === "anthropic" || raw === "google") return raw;
  return "openai";
}

function normalizeImageProvider(raw: unknown): AiImageProvider {
  return raw === "google" ? "google" : "openai";
}

function normalizeQuality(raw: unknown): "low" | "medium" | "high" | "auto" {
  if (raw === "low" || raw === "medium" || raw === "high" || raw === "auto") {
    return raw;
  }
  return "medium";
}

function normalizeReasoningEffort(
  raw: unknown,
  fallback: ReasoningEffortLevel = "low"
): ReasoningEffortLevel {
  if (
    raw === "auto" ||
    raw === "none" ||
    raw === "minimal" ||
    raw === "low" ||
    raw === "medium" ||
    raw === "high"
  ) {
    return raw;
  }
  return fallback;
}

function clamp01(val: unknown, fallback: number): number {
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0 || n > 1) return fallback;
  return n;
}

function envKeyForProvider(provider: AiTextProvider): string | null {
  if (provider === "anthropic") {
    return process.env.ANTHROPIC_API_KEY?.trim() || null;
  }
  if (provider === "google") {
    return (
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      null
    );
  }
  return (
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPEN_AI_KEY?.trim() ||
    null
  );
}

export function getEnvAiFallback(): CmsAiRuntimeConfig {
  const openAiKey = envKeyForProvider("openai");
  const defaultTextModel = process.env.OPENAI_MODEL?.trim() || "gpt-6.2-astra";
  const defaultDirectorModel =
    process.env.OPENAI_DIRECTOR_MODEL?.trim() || "gpt-6.2-sol";
  const defaultImageModel =
    process.env.OPENAI_IMAGE_MODEL?.trim() ||
    "gpt-image-2.5-sunburst-2026-09-08";

  return {
    enabled: true,
    provider: "openai",
    apiKey: openAiKey,
    textModel: defaultTextModel,
    reasoningEffort: "low",
    maxTokens: 2500,
    temperature: 0.7,
    imageProvider: "openai",
    imageApiKey: openAiKey,
    imageModel: defaultImageModel,
    siteDescription: "",
    aiPersona: "",

    storybookWriterProvider: "openai",
    storybookWriterApiKey: openAiKey,
    storybookWriterModel: defaultTextModel,
    storybookWriterReasoningEffort: "low",

    storybookDirectorProvider: "openai",
    storybookDirectorApiKey: openAiKey,
    storybookDirectorModel: defaultDirectorModel,
    storybookDirectorReasoningEffort: "low",
    storybookVisionQaEnabled: process.env.OPENAI_VISION_QA !== "false",

    storybookImageProvider: "openai",
    storybookImageApiKey: openAiKey,
    storybookImageModel: defaultImageModel,
    storybookImageQuality: normalizeQuality(
      process.env.OPENAI_IMAGE_QUALITY?.trim()
    ),

    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY?.trim() || null,
    elevenLabsModelId: process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_v4",
    elevenLabsVoiceId:
      process.env.ELEVENLABS_VOICE_ID?.trim() || "NOpBlnGInO9m6vDvFkFC",
    elevenLabsStability: 0.5,
    elevenLabsSimilarityBoost: 0.78,
    prompts: {},
  };
}

export async function getCmsAiConfig(): Promise<CmsAiRuntimeConfig> {
  if (cachedConfig && Date.now() < cachedConfig.expiresAt) {
    return cachedConfig.value;
  }
  if (inFlight) return inFlight;

  inFlight = (async (): Promise<CmsAiRuntimeConfig> => {
    const fallback = getEnvAiFallback();
    try {
      const payload = await getPayload();
      const [aiSettingsRaw, storybookRaw, elevenLabsRaw, aiPromptsRaw] =
        await Promise.all([
          payload.findGlobal({ slug: "ai-settings" }),
          payload
            .findGlobal({ slug: "storybook-ai-settings" })
            .catch(() => ({})),
          payload
            .findGlobal({ slug: "elevenlabs-settings" })
            .catch(() => ({})),
          payload.findGlobal({ slug: "ai-prompts" }),
        ]);

      const ai = aiSettingsRaw as unknown as Record<string, unknown>;
      const sb = storybookRaw as unknown as Record<string, unknown>;
      const el = elevenLabsRaw as unknown as Record<string, unknown>;
      const promptsDoc = aiPromptsRaw as unknown as {
        prompts?: Array<{ type?: string; template?: string }>;
      };

      const promptsMap: Record<string, string> = {};
      for (const item of promptsDoc.prompts ?? []) {
        if (
          item.type &&
          typeof item.template === "string" &&
          item.template.trim()
        ) {
          promptsMap[item.type] = item.template;
        }
      }

      const mainProvider = normalizeProvider(ai.provider);
      const mainApiKey =
        (typeof ai.apiKey === "string" && ai.apiKey.trim()) ||
        envKeyForProvider(mainProvider);

      const mainImageProvider = normalizeImageProvider(ai.imageProvider);
      const mainImageApiKey =
        (typeof ai.imageApiKey === "string" && ai.imageApiKey.trim()) ||
        (mainImageProvider === mainProvider ? mainApiKey : null) ||
        envKeyForProvider(mainImageProvider);

      const sbWriterProvider = normalizeProvider(sb.writerProvider);
      const sbWriterApiKey =
        (typeof sb.writerApiKey === "string" && sb.writerApiKey.trim()) ||
        (sbWriterProvider === mainProvider ? mainApiKey : null) ||
        envKeyForProvider(sbWriterProvider);

      const sbDirectorProvider = normalizeProvider(sb.directorProvider);
      const sbDirectorApiKey =
        (typeof sb.directorApiKey === "string" && sb.directorApiKey.trim()) ||
        (sbDirectorProvider === sbWriterProvider ? sbWriterApiKey : null) ||
        (sbDirectorProvider === mainProvider ? mainApiKey : null) ||
        envKeyForProvider(sbDirectorProvider);

      const sbImageProvider = normalizeImageProvider(sb.imageProvider);
      const sbImageApiKey =
        (typeof sb.imageApiKey === "string" && sb.imageApiKey.trim()) ||
        (sbImageProvider === mainImageProvider ? mainImageApiKey : null) ||
        (sbImageProvider === mainProvider ? mainApiKey : null) ||
        envKeyForProvider(sbImageProvider);

      const dbElevenKey =
        (typeof el.apiKey === "string" && el.apiKey.trim()) ||
        (typeof ai.elevenLabsApiKey === "string" && ai.elevenLabsApiKey.trim()) ||
        fallback.elevenLabsApiKey;

      const resolved: CmsAiRuntimeConfig = {
        enabled: typeof ai.enabled === "boolean" ? ai.enabled : true,
        provider: mainProvider,
        apiKey: mainApiKey,
        textModel:
          (typeof ai.model === "string" && ai.model.trim()) ||
          fallback.textModel,
        reasoningEffort: normalizeReasoningEffort(ai.reasoningEffort, "low"),
        maxTokens:
          typeof ai.maxTokens === "number" && ai.maxTokens > 0
            ? ai.maxTokens
            : fallback.maxTokens,
        temperature:
          typeof ai.temperature === "number" && Number.isFinite(ai.temperature)
            ? ai.temperature
            : fallback.temperature,
        imageProvider: mainImageProvider,
        imageApiKey: mainImageApiKey,
        imageModel:
          (typeof ai.imageModel === "string" && ai.imageModel.trim()) ||
          fallback.imageModel,
        siteDescription:
          typeof ai.siteDescription === "string" ? ai.siteDescription : "",
        aiPersona: typeof ai.aiPersona === "string" ? ai.aiPersona : "",

        storybookWriterProvider: sbWriterProvider,
        storybookWriterApiKey: sbWriterApiKey,
        storybookWriterModel:
          (typeof sb.writerModel === "string" && sb.writerModel.trim()) ||
          fallback.storybookWriterModel,
        storybookWriterReasoningEffort: normalizeReasoningEffort(
          sb.writerReasoningEffort,
          "low"
        ),

        storybookDirectorProvider: sbDirectorProvider,
        storybookDirectorApiKey: sbDirectorApiKey,
        storybookDirectorModel:
          (typeof sb.directorModel === "string" && sb.directorModel.trim()) ||
          fallback.storybookDirectorModel,
        storybookDirectorReasoningEffort: normalizeReasoningEffort(
          sb.directorReasoningEffort,
          "low"
        ),
        storybookVisionQaEnabled:
          typeof sb.visionQaEnabled === "boolean"
            ? sb.visionQaEnabled
            : fallback.storybookVisionQaEnabled,

        storybookImageProvider: sbImageProvider,
        storybookImageApiKey: sbImageApiKey,
        storybookImageModel:
          (typeof sb.imageModel === "string" && sb.imageModel.trim()) ||
          fallback.storybookImageModel,
        storybookImageQuality: normalizeQuality(
          sb.imageQuality || fallback.storybookImageQuality
        ),

        elevenLabsApiKey: dbElevenKey,
        elevenLabsModelId:
          (typeof el.modelId === "string" && el.modelId.trim()) ||
          fallback.elevenLabsModelId,
        elevenLabsVoiceId:
          (typeof el.voiceId === "string" && el.voiceId.trim()) ||
          fallback.elevenLabsVoiceId,
        elevenLabsStability: clamp01(
          el.stability,
          fallback.elevenLabsStability
        ),
        elevenLabsSimilarityBoost: clamp01(
          el.similarityBoost,
          fallback.elevenLabsSimilarityBoost
        ),
        prompts: promptsMap,
      };

      cachedConfig = {
        value: resolved,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
      return resolved;
    } catch (err) {
      console.warn(
        "[cms-ai-config] Falling back to env defaults (Payload unavailable):",
        err instanceof Error ? err.message : String(err)
      );
      return fallback;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export async function getCmsPromptTemplate(
  type: string,
  fallback = ""
): Promise<string> {
  const cfg = await getCmsAiConfig();
  return cfg.prompts[type]?.trim() || fallback;
}

export async function getCmsArtStylePrompt(
  artStyle: ArtStyle,
  fallbackPrompt: string
): Promise<string> {
  const cfg = await getCmsAiConfig();
  return cfg.prompts[`style-${artStyle}`]?.trim() || fallbackPrompt;
}
