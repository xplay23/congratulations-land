import { mergeOrderAiCost } from "./db";
import { getAiRatesConfig } from "./settings";
import type { AiUsageStep, OrderAiCost } from "./types";

interface PendingStep {
  step: string;
  provider: AiUsageStep["provider"];
  model: string;
  calls: number;
  inputTokens?: number;
  outputTokens?: number;
  size?: string;
  quality?: string;
  characters?: number;
}

export class AiCostTracker {
  private steps: PendingStep[] = [];
  private qaRetries = 0;

  addChatUsage(
    step: string,
    model: string,
    usage?: { prompt_tokens?: number; completion_tokens?: number } | null,
    isVision = false
  ): void {
    const inputTokens = Math.max(0, Number(usage?.prompt_tokens || 0));
    const outputTokens = Math.max(0, Number(usage?.completion_tokens || 0));

    this.steps.push({
      step,
      provider: isVision ? "openai_vision" : "openai_text",
      model,
      calls: 1,
      inputTokens,
      outputTokens,
    });
  }

  addImageCall(
    step: string,
    model: string,
    size: string,
    quality: string,
    isQaRetry = false
  ): void {
    if (isQaRetry) {
      this.qaRetries += 1;
    }

    this.steps.push({
      step,
      provider: "openai_image",
      model,
      calls: 1,
      size,
      quality,
    });
  }

  addElevenLabsUsage(step: string, characters: number, modelId?: string): void {
    const chars = Math.max(0, Math.round(characters));

    this.steps.push({
      step,
      provider: "elevenlabs",
      model: modelId?.trim() || process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_v4",
      calls: 1,
      characters: chars,
    });
  }

  hasEntries(): boolean {
    return this.steps.length > 0;
  }

  async flushToOrder(orderId: string): Promise<OrderAiCost | null> {
    if (this.steps.length === 0) return null;

    const rates = await getAiRatesConfig();
    const pending = this.steps;
    const qaRetries = this.qaRetries;
    // Clear buffer immediately so subsequent flushes don't double-count
    this.steps = [];
    this.qaRetries = 0;

    let totalUsd = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalImageCalls = 0;
    let elevenLabsChars = 0;

    const grouped = new Map<string, AiUsageStep>();
    for (const s of pending) {
      let costUsd = 0;
      if (s.provider === "openai_text" || s.provider === "openai_vision") {
        const modelRate = rates.textModels[s.model] ||
          rates.textModels.default || {
            inputPer1M: 1.25,
            outputPer1M: 5.0,
          };
        costUsd = Number(
          (
            ((s.inputTokens || 0) / 1_000_000) * modelRate.inputPer1M +
            ((s.outputTokens || 0) / 1_000_000) * modelRate.outputPer1M
          ).toFixed(6)
        );
      } else if (s.provider === "openai_image") {
        const key = `${s.quality || "medium"}:${s.size || "1536x1024"}`;
        costUsd = Number(
          (
            rates.imagePerCallUsd[key] ??
            rates.imagePerCallUsd.default ??
            0.045
          ).toFixed(6)
        );
      } else if (s.provider === "elevenlabs") {
        costUsd = Number(
          (((s.characters || 0) / 1000) * rates.elevenLabsPer1kCharsUsd).toFixed(6)
        );
      }

      totalUsd += costUsd;
      totalInputTokens += s.inputTokens || 0;
      totalOutputTokens += s.outputTokens || 0;
      if (s.provider === "openai_image") totalImageCalls += s.calls;
      if (s.provider === "elevenlabs") elevenLabsChars += s.characters || 0;

      const key = `${s.provider}|${s.step}|${s.model}|${s.size || ""}|${s.quality || ""}`;
      const prev = grouped.get(key);
      if (prev) {
        prev.calls += s.calls;
        prev.inputTokens = (prev.inputTokens || 0) + (s.inputTokens || 0);
        prev.outputTokens = (prev.outputTokens || 0) + (s.outputTokens || 0);
        prev.characters = (prev.characters || 0) + (s.characters || 0);
        prev.costUsd = Number((prev.costUsd + costUsd).toFixed(6));
      } else {
        grouped.set(key, {
          ...s,
          costUsd,
        });
      }
    }

    const roundedTotalUsd = Number(totalUsd.toFixed(6));
    const delta: OrderAiCost = {
      currency: "USD",
      usdToUahRate: rates.usdToUah,
      totalUsd: roundedTotalUsd,
      totalUahKopiykas: Math.round(roundedTotalUsd * rates.usdToUah * 100),
      totalInputTokens,
      totalOutputTokens,
      totalImageCalls,
      visionQaRetries: qaRetries,
      elevenLabsChars,
      breakdown: Array.from(grouped.values()),
      updatedAt: new Date().toISOString(),
    };

    return mergeOrderAiCost(orderId, delta);
  }
}
