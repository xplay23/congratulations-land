import { getPayload } from "@engine/lib/payload";
import type { ArtStyle } from "./types";

export interface CmsAiRuntimeConfig {
  enabled: boolean;
  provider: "openai" | "anthropic" | "google";
  apiKey: string | null;
  textModel: string;
  imageProvider: "openai" | "google";
  imageApiKey: string | null;
  storybookWriterModel: string;
  storybookDirectorModel: string;
  storybookImageModel: string;
  storybookImageQuality: "low" | "medium" | "high" | "auto";
  storybookVisionQaEnabled: boolean;
  elevenLabsApiKey: string | null;
  elevenLabsModelId: string;
  elevenLabsVoiceId: string;
  elevenLabsStability: number;
  elevenLabsSimilarityBoost: number;
  siteDescription: string;
  aiPersona: string;
  prompts: Record<string, string>;
}

const CACHE_TTL_MS = 30_000;
let cachedConfig: { value: CmsAiRuntimeConfig; expiresAt: number } | null = null;
let inFlight: Promise<CmsAiRuntimeConfig> | null = null;

export function invalidateCmsAiConfigCache(): void {
  cachedConfig = null;
}

function normalizeQuality(
  raw: unknown
): "low" | "medium" | "high" | "auto" {
  if (raw === "low" || raw === "medium" || raw === "high" || raw === "auto") {
    return raw;
  }
  return "medium";
}

function clamp01(val: unknown, fallback: number): number {
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0 || n > 1) return fallback;
  return n;
}

export function getEnvAiFallback(): CmsAiRuntimeConfig {
  const openAiKey =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPEN_AI_KEY?.trim() ||
    null;

  return {
    enabled: true,
    provider: "openai",
    apiKey: openAiKey,
    textModel: process.env.OPENAI_MODEL?.trim() || "gpt-6.2-astra",
    imageProvider: "openai",
    imageApiKey: openAiKey,
    storybookWriterModel: process.env.OPENAI_MODEL?.trim() || "gpt-6.2-astra",
    storybookDirectorModel:
      process.env.OPENAI_DIRECTOR_MODEL?.trim() || "gpt-6.2-sol",
    storybookImageModel:
      process.env.OPENAI_IMAGE_MODEL?.trim() ||
      "gpt-image-2.5-sunburst-2026-09-08",
    storybookImageQuality: normalizeQuality(
      process.env.OPENAI_IMAGE_QUALITY?.trim()
    ),
    storybookVisionQaEnabled: process.env.OPENAI_VISION_QA !== "false",
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY?.trim() || null,
    elevenLabsModelId: process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_v4",
    elevenLabsVoiceId:
      process.env.ELEVENLABS_VOICE_ID?.trim() || "NOpBlnGInO9m6vDvFkFC",
    elevenLabsStability: 0.5,
    elevenLabsSimilarityBoost: 0.78,
    siteDescription: "",
    aiPersona: "",
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
      const [aiSettingsRaw, aiPromptsRaw] = await Promise.all([
        payload.findGlobal({ slug: "ai-settings" }),
        payload.findGlobal({ slug: "ai-prompts" }),
      ]);

      const ai = aiSettingsRaw as unknown as Record<string, unknown>;
      const promptsDoc = aiPromptsRaw as unknown as {
        prompts?: Array<{ type?: string; template?: string }>;
      };

      const promptsMap: Record<string, string> = {};
      for (const item of promptsDoc.prompts ?? []) {
        if (item.type && typeof item.template === "string" && item.template.trim()) {
          promptsMap[item.type] = item.template;
        }
      }

      const dbApiKey =
        typeof ai.apiKey === "string" && ai.apiKey.trim()
          ? ai.apiKey.trim()
          : fallback.apiKey;

      const dbImageKey =
        typeof ai.imageApiKey === "string" && ai.imageApiKey.trim()
          ? ai.imageApiKey.trim()
          : dbApiKey;

      const dbElevenKey =
        typeof ai.elevenLabsApiKey === "string" && ai.elevenLabsApiKey.trim()
          ? ai.elevenLabsApiKey.trim()
          : fallback.elevenLabsApiKey;

      const resolved: CmsAiRuntimeConfig = {
        enabled: typeof ai.enabled === "boolean" ? ai.enabled : true,
        provider:
          ai.provider === "anthropic" || ai.provider === "google"
            ? ai.provider
            : "openai",
        apiKey: dbApiKey,
        textModel:
          typeof ai.model === "string" && ai.model.trim()
            ? ai.model.trim()
            : fallback.textModel,
        imageProvider: ai.imageProvider === "google" ? "google" : "openai",
        imageApiKey: dbImageKey,
        storybookWriterModel:
          typeof ai.storybookWriterModel === "string" &&
          ai.storybookWriterModel.trim()
            ? ai.storybookWriterModel.trim()
            : fallback.storybookWriterModel,
        storybookDirectorModel:
          typeof ai.storybookDirectorModel === "string" &&
          ai.storybookDirectorModel.trim()
            ? ai.storybookDirectorModel.trim()
            : fallback.storybookDirectorModel,
        storybookImageModel:
          typeof ai.storybookImageModel === "string" &&
          ai.storybookImageModel.trim()
            ? ai.storybookImageModel.trim()
            : fallback.storybookImageModel,
        storybookImageQuality: normalizeQuality(
          ai.storybookImageQuality || fallback.storybookImageQuality
        ),
        storybookVisionQaEnabled:
          typeof ai.storybookVisionQaEnabled === "boolean"
            ? ai.storybookVisionQaEnabled
            : fallback.storybookVisionQaEnabled,
        elevenLabsApiKey: dbElevenKey,
        elevenLabsModelId:
          typeof ai.elevenLabsModelId === "string" &&
          ai.elevenLabsModelId.trim()
            ? ai.elevenLabsModelId.trim()
            : fallback.elevenLabsModelId,
        elevenLabsVoiceId:
          typeof ai.elevenLabsVoiceId === "string" &&
          ai.elevenLabsVoiceId.trim()
            ? ai.elevenLabsVoiceId.trim()
            : fallback.elevenLabsVoiceId,
        elevenLabsStability: clamp01(
          ai.elevenLabsStability,
          fallback.elevenLabsStability
        ),
        elevenLabsSimilarityBoost: clamp01(
          ai.elevenLabsSimilarityBoost,
          fallback.elevenLabsSimilarityBoost
        ),
        siteDescription:
          typeof ai.siteDescription === "string" ? ai.siteDescription : "",
        aiPersona: typeof ai.aiPersona === "string" ? ai.aiPersona : "",
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
