import { mergeOrderAiCost } from "./db";
import { getAiRatesConfig } from "./settings";
import type { AiUsageStep, OrderAiCost } from "./types";

export class AiCostTracker {
  private steps: AiUsageStep[] = [];
  private qaRetries = 0;

  addChatUsage(
    step: string,
    model: string,
    usage?: { prompt_tokens?: number; completion_tokens?: number } | null,
    isVision = false
  ): void {
    const inputTokens = Math.max(0, Number(usage?.prompt_tokens || 0));
    const outputTokens = Math.max(0, Number(usage?.completion_tokens || 0));
    const rates = getAiRatesConfig();
    const modelRate = rates.textModels[model] || rates.textModels.default || {
      inputPer1M: 1.25,
      outputPer1M: 5.0,
    };
    const costUsd = Number(
      (
        (inputTokens / 1_000_000) * modelRate.inputPer1M +
        (outputTokens / 1_000_000) * modelRate.outputPer1M
      ).toFixed(6)
    );

    this.steps.push({
      step,
      provider: isVision ? "openai_vision" : "openai_text",
      model,
      calls: 1,
      inputTokens,
      outputTokens,
      costUsd,
    });
  }

  addImageCall(
    step: string,
    model: string,
    size: string,
    quality: string,
    isQaRetry = false
  ): void {
    const rates = getAiRatesConfig();
    const key = `${quality}:${size}`;
    const costUsd = Number(
      (
        rates.imagePerCallUsd[key] ??
        rates.imagePerCallUsd.default ??
        0.045
      ).toFixed(6)
    );
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
      costUsd,
    });
  }

  addElevenLabsUsage(step: string, characters: number): void {
    const chars = Math.max(0, Math.round(characters));
    const rates = getAiRatesConfig();
    const costUsd = Number(
      ((chars / 1000) * rates.elevenLabsPer1kCharsUsd).toFixed(6)
    );

    this.steps.push({
      step,
      provider: "elevenlabs",
      model: process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_v4",
      calls: 1,
      characters: chars,
      costUsd,
    });
  }

  hasEntries(): boolean {
    return this.steps.length > 0;
  }

  flushToOrder(orderId: string): OrderAiCost | null {
    if (this.steps.length === 0) return null;

    const rates = getAiRatesConfig();
    let totalUsd = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalImageCalls = 0;
    let elevenLabsChars = 0;

    const grouped = new Map<string, AiUsageStep>();
    for (const s of this.steps) {
      totalUsd += s.costUsd;
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
        prev.costUsd = Number((prev.costUsd + s.costUsd).toFixed(6));
      } else {
        grouped.set(key, { ...s });
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
      visionQaRetries: this.qaRetries,
      elevenLabsChars,
      breakdown: Array.from(grouped.values()),
      updatedAt: new Date().toISOString(),
    };

    // Clear buffer so subsequent flushes don't double-count
    this.steps = [];
    this.qaRetries = 0;

    return mergeOrderAiCost(orderId, delta);
  }
}
