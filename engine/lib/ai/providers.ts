import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

export function initAIProvider(provider: string, apiKey: string) {
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey });
    case "anthropic":
      return createAnthropic({ apiKey });
    case "google":
      return createGoogleGenerativeAI({ apiKey });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Returns a ready-to-use Vercel AI SDK LanguageModel instance from AISettings.
 */
export function getAIProvider(settings: {
  provider?: string | null;
  model?: string | null;
  apiKey?: string | null;
}): LanguageModel {
  const provider = settings.provider ?? "openai";
  const model = settings.model ?? "gpt-6.2-astra";
  const apiKey = settings.apiKey ?? "";
  return initAIProvider(provider, apiKey)(model);
}
