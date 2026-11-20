import OpenAI from "openai";
import { getCmsAiConfig, type CmsAiRuntimeConfig } from "./cms-ai-config";

export function getOpenAIApiKey(): string | null {
  const key =
    process.env.OPENAI_API_KEY?.trim() || process.env.OPEN_AI_KEY?.trim();
  return key || null;
}

export function getTextModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-6.2-astra";
}

export function getDirectorModel(): string {
  return process.env.OPENAI_DIRECTOR_MODEL?.trim() || "gpt-6.2-sol";
}

export function getImageModel(): string {
  return (
    process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2.5-sunburst-2026-09-08"
  );
}

export function getImageQuality(): "low" | "medium" | "high" | "auto" {
  const q = process.env.OPENAI_IMAGE_QUALITY?.trim();
  if (q === "low" || q === "medium" || q === "high" || q === "auto") return q;
  return "medium";
}

export function createOpenAIClient(apiKeyOverride?: string | null): OpenAI | null {
  const apiKey = apiKeyOverride?.trim() || getOpenAIApiKey();
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    maxRetries: 3,
    timeout: 120_000,
  });
}

export interface CmsOpenAIRuntime {
  client: OpenAI | null;
  imageClient: OpenAI | null;
  config: CmsAiRuntimeConfig;
}

export async function getCmsOpenAIRuntime(): Promise<CmsOpenAIRuntime> {
  const config = await getCmsAiConfig();
  return {
    client: createOpenAIClient(config.apiKey),
    imageClient: createOpenAIClient(config.imageApiKey ?? config.apiKey),
    config,
  };
}

function isRetryableOpenAIError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as {
    status?: number;
    code?: string;
    name?: string;
    message?: string;
  };
  if (typeof e.status === "number" && (e.status === 429 || e.status >= 500)) {
    return true;
  }
  if (e.name === "APIConnectionError" || e.name === "APIConnectionTimeoutError") {
    return true;
  }
  const msg = String(e.message || "");
  return /\b(429|500|502|503|504)\b|server had an error|overloaded|timed out|ECONNRESET/i.test(
    msg
  );
}

/**
 * Retries transient OpenAI API/network errors (5xx/429/timeout) so a single
 * upstream blip does not fail the entire storybook or video generation.
 */
export async function withOpenAIRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts || !isRetryableOpenAIError(err)) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[openai:${label}] attempt ${i}/${attempts} failed: ${msg}`);
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  throw lastErr;
}

export function buildChatModelParams(
  temperature: number,
  maxTokens: number,
  modelOverride?: string
): {
  model: string;
  max_completion_tokens?: number;
  max_tokens?: number;
  temperature?: number;
  reasoning_effort?: "low" | "medium" | "high";
} {
  const model = modelOverride || getTextModel();
  const isNextGen = /^(gpt-5|gpt-6|o1|o3|o4)/i.test(model);
  if (isNextGen) {
    return {
      model,
      max_completion_tokens: Math.max(maxTokens, 4500),
      reasoning_effort: "low",
    };
  }
  return {
    model,
    temperature,
    max_tokens: maxTokens,
  };
}
