import { getPayload } from "@engine/lib/payload";
import { getCmsAiConfig } from "@/lib/cms-ai-config";

const LITELLM_URL =
  "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";
const NBU_USD_URL =
  "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json";

/**
 * Documented output-token counts per generated image for OpenAI gpt-image family
 * (quality × size). Per-call price = tokens × output_cost_per_image_token.
 * Verified against current defaults (e.g. medium 1024² = 1056 tok ≈ $0.042).
 */
const IMAGE_OUTPUT_TOKENS: Record<string, number> = {
  "low:1024x1024": 272,
  "low:1536x1024": 408,
  "low:1024x1536": 408,
  "medium:1024x1024": 1056,
  "medium:1536x1024": 1584,
  "medium:1024x1536": 1584,
  "high:1024x1024": 4160,
  "high:1536x1024": 6240,
  "high:1024x1536": 6240,
};

interface RegistryEntry {
  input_cost_per_token?: number;
  output_cost_per_token?: number;
  output_cost_per_image_token?: number;
  mode?: string;
}

export interface AiRatesSyncReport {
  ok: boolean;
  dryRun: boolean;
  usdToUah: { value: number | null; source: string; date?: string };
  textModels: Array<{
    modelId: string;
    role: string;
    status: "updated" | "not_found";
    inputPer1M?: number;
    outputPer1M?: number;
    registryKey?: string;
  }>;
  imageModel: {
    modelId: string;
    status: "updated" | "not_found";
    registryKey?: string;
    presets: number;
  };
  notes: string[];
  error?: string;
}

function candidateKeys(modelId: string): string[] {
  const base = modelId.trim();
  const noDate = base.replace(/-\d{4}-\d{2}-\d{2}$/, "");
  const noSuffixDate = noDate.replace(/-\d{8}$/, "");
  const variants = Array.from(new Set([base, noDate, noSuffixDate]));
  const out: string[] = [];
  for (const v of variants) {
    out.push(v, `openai/${v}`, `anthropic/${v}`, `gemini/${v}`, `google/${v}`);
  }
  return out;
}

function findEntry(
  registry: Record<string, RegistryEntry>,
  modelId: string,
  mode?: "chat" | "image_generation"
): { key: string; entry: RegistryEntry } | null {
  for (const key of candidateKeys(modelId)) {
    const entry = registry[key];
    if (!entry || typeof entry !== "object") continue;
    if (mode && entry.mode && entry.mode !== mode && mode === "image_generation") {
      continue;
    }
    return { key, entry };
  }
  return null;
}

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

async function fetchJson<T>(url: string, timeoutMs = 25_000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pulls actual per-token prices for the models used in production (from AI settings)
 * from the open LiteLLM registry + USD→UAH rate from the National Bank of Ukraine,
 * and writes them into the `ai-economics` global.
 */
export async function refreshAiRatesFromRegistry(opts?: {
  dryRun?: boolean;
}): Promise<AiRatesSyncReport> {
  const dryRun = Boolean(opts?.dryRun);
  const report: AiRatesSyncReport = {
    ok: false,
    dryRun,
    usdToUah: { value: null, source: "NBU" },
    textModels: [],
    imageModel: { modelId: "", status: "not_found", presets: 0 },
    notes: [],
  };

  try {
    const cfg = await getCmsAiConfig();

    // 1) Models actually used in production
    const textRoles: Array<{ modelId: string; role: string }> = [
      { modelId: cfg.textModel, role: "Контент / SEO / перевод / ассистент" },
      { modelId: cfg.storybookWriterModel, role: "Сказки: писатель и корректор" },
      {
        modelId: cfg.storybookDirectorModel,
        role: "Сказки: режиссура и Vision QA",
      },
    ].filter((r) => r.modelId?.trim());

    const [registry, nbu] = await Promise.all([
      fetchJson<Record<string, RegistryEntry>>(LITELLM_URL, 40_000),
      fetchJson<Array<{ rate?: number; exchangedate?: string }>>(
        NBU_USD_URL
      ).catch(() => null),
    ]);

    // 2) USD → UAH
    const nbuRate = nbu?.[0]?.rate;
    if (typeof nbuRate === "number" && nbuRate > 0) {
      report.usdToUah = {
        value: round(nbuRate, 4),
        source: "НБУ (bank.gov.ua)",
        date: nbu?.[0]?.exchangedate,
      };
    } else {
      report.notes.push("Курс НБУ недоступен — курс USD→UAH оставлен без изменений.");
    }

    // 3) Text models
    const textUpdates = new Map<string, { input: number; output: number }>();
    const seen = new Set<string>();
    for (const { modelId, role } of textRoles) {
      if (seen.has(modelId)) continue;
      seen.add(modelId);
      const found = findEntry(registry, modelId, "chat");
      const inp = found?.entry.input_cost_per_token;
      const out = found?.entry.output_cost_per_token;
      if (found && typeof inp === "number" && typeof out === "number") {
        const inputPer1M = round(inp * 1_000_000, 4);
        const outputPer1M = round(out * 1_000_000, 4);
        textUpdates.set(modelId, { input: inputPer1M, output: outputPer1M });
        report.textModels.push({
          modelId,
          role,
          status: "updated",
          inputPer1M,
          outputPer1M,
          registryKey: found.key,
        });
      } else {
        report.textModels.push({ modelId, role, status: "not_found" });
      }
    }

    // 4) Image model (per-call price = output image tokens × price per image token)
    const imageModelId = cfg.storybookImageModel;
    report.imageModel.modelId = imageModelId;
    const imageFound = imageModelId
      ? findEntry(registry, imageModelId, "image_generation")
      : null;
    const imgTokenPrice = imageFound?.entry.output_cost_per_image_token;
    const imagePresets: Array<{ key: string; priceUsd: number }> = [];
    if (imageFound && typeof imgTokenPrice === "number") {
      for (const [key, tokens] of Object.entries(IMAGE_OUTPUT_TOKENS)) {
        imagePresets.push({ key, priceUsd: round(tokens * imgTokenPrice, 4) });
      }
      report.imageModel = {
        modelId: imageModelId,
        status: "updated",
        registryKey: imageFound.key,
        presets: imagePresets.length,
      };
      report.notes.push(
        "Цена изображения = число выходных image-токенов (quality × size, из документации OpenAI) × цена токена из реестра — это оценка."
      );
    }

    report.notes.push(
      "ElevenLabs: публичного API с ценой нет — «$ за 1000 символов» зависит от вашего тарифа и редактируется вручную."
    );

    // 5) Save into the global (merge with existing rows, keep manual ones)
    if (!dryRun) {
      const payload = await getPayload();
      const current = (await payload.findGlobal({
        slug: "ai-economics",
        overrideAccess: true,
      })) as unknown as {
        textModelRates?: Array<{
          modelId?: string | null;
          inputPer1M?: number | null;
          outputPer1M?: number | null;
        }> | null;
        imageRates?: Array<{
          key?: string | null;
          priceUsd?: number | null;
        }> | null;
      };

      const textRows = new Map<
        string,
        { modelId: string; inputPer1M: number; outputPer1M: number }
      >();
      for (const row of current.textModelRates ?? []) {
        const id = String(row.modelId || "").trim();
        if (!id) continue;
        textRows.set(id, {
          modelId: id,
          inputPer1M: Number(row.inputPer1M ?? 0),
          outputPer1M: Number(row.outputPer1M ?? 0),
        });
      }
      for (const [modelId, v] of textUpdates) {
        textRows.set(modelId, {
          modelId,
          inputPer1M: v.input,
          outputPer1M: v.output,
        });
      }

      const imageRows = new Map<string, { key: string; priceUsd: number }>();
      for (const row of current.imageRates ?? []) {
        const key = String(row.key || "").trim();
        if (!key) continue;
        imageRows.set(key, { key, priceUsd: Number(row.priceUsd ?? 0) });
      }
      for (const p of imagePresets) imageRows.set(p.key, p);

      await payload.updateGlobal({
        slug: "ai-economics",
        overrideAccess: true,
        data: {
          ...(report.usdToUah.value ? { usdToUah: report.usdToUah.value } : {}),
          textModelRates: Array.from(textRows.values()),
          imageRates: Array.from(imageRows.values()),
          lastSyncedAt: new Date().toISOString(),
        } as never,
      });
    }

    report.ok = true;
    return report;
  } catch (err) {
    report.error = err instanceof Error ? err.message : "Sync failed";
    return report;
  }
}
