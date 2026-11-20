import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "@engine/lib/payload";

type ProviderError = { message: string; status: number };

interface ModelsCacheEntry {
  models: string[];
  source: "api" | "fallback";
  note?: string;
  expiresAt: number;
}

const modelsCache = new Map<string, ModelsCacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;

const ELEVENLABS_FALLBACK_MODELS = [
  "eleven_v4",
  "eleven_v3",
  "eleven_multilingual_v2",
  "eleven_flash_v2_5",
  "eleven_turbo_v2_5",
  "eleven_monolingual_v1",
];

function getCached(key: string): ModelsCacheEntry | null {
  const entry = modelsCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    modelsCache.delete(key);
    return null;
  }
  return entry;
}

function setCached(
  key: string,
  data: { models: string[]; source: "api" | "fallback"; note?: string }
): void {
  modelsCache.set(key, { ...data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateModelsCache(): void {
  modelsCache.clear();
}

function extractProviderError(body: unknown, httpStatus: number): ProviderError {
  if (typeof body === "object" && body !== null) {
    const rec = body as Record<string, unknown>;
    if ("error" in rec) {
      const e = rec.error;
      if (typeof e === "object" && e !== null) {
        const obj = e as Record<string, unknown>;
        return {
          message:
            typeof obj.message === "string" ? obj.message : JSON.stringify(e),
          status: typeof obj.status === "number" ? obj.status : httpStatus,
        };
      }
      if (typeof e === "string") return { message: e, status: httpStatus };
    }
    if ("detail" in rec) {
      const d = rec.detail;
      if (typeof d === "object" && d !== null) {
        const obj = d as Record<string, unknown>;
        return {
          message:
            typeof obj.message === "string" ? obj.message : JSON.stringify(d),
          status: httpStatus,
        };
      }
      if (typeof d === "string") return { message: d, status: httpStatus };
    }
  }
  return { message: `HTTP ${httpStatus}`, status: httpStatus };
}

async function fetchModels(
  provider: string,
  apiKey: string
): Promise<{
  models?: string[];
  source?: "api" | "fallback";
  note?: string;
  error?: string;
  providerStatus?: number;
}> {
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const body: unknown = await res.json().catch(() => ({}));
      const { message, status } = extractProviderError(body, res.status);
      return { error: message, providerStatus: status };
    }
    const data = (await res.json()) as { data: { id: string }[] };
    return { models: data.data.map((m) => m.id).sort(), source: "api" };
  }

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    });
    if (!res.ok) {
      const body: unknown = await res.json().catch(() => ({}));
      const { message, status } = extractProviderError(body, res.status);
      return { error: message, providerStatus: status };
    }
    const data = (await res.json()) as { data: { id: string }[] };
    return { models: data.data.map((m) => m.id).sort(), source: "api" };
  }

  if (provider === "google") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
        apiKey
      )}`
    );
    if (!res.ok) {
      const body: unknown = await res.json().catch(() => ({}));
      const { message, status } = extractProviderError(body, res.status);
      return { error: message, providerStatus: status };
    }
    const data = (await res.json()) as { models: { name: string }[] };
    return {
      models: data.models.map((m) => m.name.replace(/^models\//, "")).sort(),
      source: "api",
    };
  }

  if (provider === "elevenlabs") {
    if (apiKey) {
      try {
        const res = await fetch("https://api.elevenlabs.io/v1/models", {
          headers: { "xi-api-key": apiKey },
        });
        if (res.ok) {
          const data = (await res.json()) as Array<{
            model_id: string;
            can_do_text_to_speech?: boolean;
          }>;
          const ttsModels = Array.isArray(data)
            ? data
                .filter((m) => m.can_do_text_to_speech !== false && m.model_id)
                .map((m) => m.model_id)
            : [];
          if (ttsModels.length > 0) {
            // Ensure eleven_v4 is available in the list if account uses it
            const set = new Set(ttsModels);
            set.add("eleven_v4");
            return { models: Array.from(set), source: "api" };
          }
        } else {
          const body: unknown = await res.json().catch(() => ({}));
          const rawStr = JSON.stringify(body);
          if (res.status === 401 && /models_read|missing_permissions/i.test(rawStr)) {
            return {
              models: ELEVENLABS_FALLBACK_MODELS,
              source: "fallback",
              note: "Показан стандартный список TTS-моделей ElevenLabs (у текущего API-ключа нет права models_read, но TTS работает).",
            };
          }
          if (res.status === 401 || res.status === 403) {
            return {
              models: ELEVENLABS_FALLBACK_MODELS,
              source: "fallback",
              note: "Показан стандартный список TTS-моделей ElevenLabs.",
            };
          }
        }
      } catch {
        // fall through to curated fallback list
      }
    }
    return {
      models: ELEVENLABS_FALLBACK_MODELS,
      source: "fallback",
      note: "Показан стандартный список TTS-моделей ElevenLabs.",
    };
  }

  return { error: `Unknown provider: ${provider}`, providerStatus: 400 };
}

async function resolveFallbackApiKey(
  payload: Awaited<ReturnType<typeof getPayload>>,
  provider: string,
  fallbackScope: string | null
): Promise<string | null> {
  if (provider === "elevenlabs") {
    try {
      const el = (await payload.findGlobal({
        slug: "elevenlabs-settings",
      })) as unknown as { apiKey?: string | null };
      if (el.apiKey?.trim()) return el.apiKey.trim();
    } catch {
      // ignore
    }
    return process.env.ELEVENLABS_API_KEY?.trim() || null;
  }

  try {
    const ai = (await payload.findGlobal({
      slug: "ai-settings",
    })) as unknown as {
      provider?: string | null;
      apiKey?: string | null;
      imageProvider?: string | null;
      imageApiKey?: string | null;
    };

    if (
      fallbackScope === "ai-image" &&
      ai.imageProvider === provider &&
      ai.imageApiKey?.trim()
    ) {
      return ai.imageApiKey.trim();
    }
    if (ai.provider === provider && ai.apiKey?.trim()) {
      return ai.apiKey.trim();
    }
  } catch {
    // ignore
  }

  if (provider === "openai") {
    return (
      process.env.OPENAI_API_KEY?.trim() ||
      process.env.OPEN_AI_KEY?.trim() ||
      null
    );
  }
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
  return null;
}

export async function GET(req: NextRequest) {
  const payload = await getPayload();
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  const fallbackScope = searchParams.get("fallbackScope");
  let apiKey = searchParams.get("apiKey")?.trim() || null;

  if (!provider) {
    return NextResponse.json({ error: "provider is required" }, { status: 400 });
  }

  if (!apiKey) {
    apiKey = await resolveFallbackApiKey(payload, provider, fallbackScope);
  }

  if (!apiKey && provider !== "elevenlabs") {
    return NextResponse.json(
      { error: "API key is not configured for this provider" },
      { status: 400 }
    );
  }

  const cacheKey = `${provider}:${apiKey || "none"}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({
      models: cached.models,
      source: cached.source,
      note: cached.note,
    });
  }

  try {
    const result = await fetchModels(provider, apiKey || "");
    if (result.error) {
      return NextResponse.json(
        { error: result.error, providerStatus: result.providerStatus },
        { status: 502 }
      );
    }
    const models = result.models ?? [];
    const source = result.source ?? "api";
    setCached(cacheKey, { models, source, note: result.note });
    return NextResponse.json({ models, source, note: result.note });
  } catch (err: unknown) {
    console.error("[api/ai/models] error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json(
      { error: message, providerStatus: 0 },
      { status: 502 }
    );
  }
}
