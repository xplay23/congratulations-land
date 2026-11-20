import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "@engine/lib/payload";

type ProviderError = { message: string; status: number };

const modelsCache = new Map<string, { models: string[]; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

function getCached(key: string): string[] | null {
  const entry = modelsCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    modelsCache.delete(key);
    return null;
  }
  return entry.models;
}

function setCached(key: string, models: string[]): void {
  modelsCache.set(key, { models, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateModelsCache(): void {
  modelsCache.clear();
}

function extractProviderError(body: unknown, httpStatus: number): ProviderError {
  if (typeof body === "object" && body !== null && "error" in body) {
    const e = (body as Record<string, unknown>).error;
    if (typeof e === "object" && e !== null) {
      const obj = e as Record<string, unknown>;
      return {
        message: typeof obj.message === "string" ? obj.message : JSON.stringify(e),
        status: typeof obj.status === "number" ? obj.status : httpStatus,
      };
    }
    if (typeof e === "string") return { message: e, status: httpStatus };
  }
  return { message: `HTTP ${httpStatus}`, status: httpStatus };
}

async function fetchModels(
  provider: string,
  apiKey: string
): Promise<{ models?: string[]; error?: string; providerStatus?: number }> {
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
    return { models: data.data.map((m) => m.id).sort() };
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
    return { models: data.data.map((m) => m.id).sort() };
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
    };
  }

  return { error: `Unknown provider: ${provider}`, providerStatus: 400 };
}

export async function GET(req: NextRequest) {
  const payload = await getPayload();
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  let apiKey = searchParams.get("apiKey");

  if (!apiKey && provider === "openai") {
    apiKey =
      process.env.OPENAI_API_KEY?.trim() ||
      process.env.OPEN_AI_KEY?.trim() ||
      null;
  }

  if (!provider || !apiKey) {
    return NextResponse.json(
      { error: "provider and apiKey are required" },
      { status: 400 }
    );
  }

  const cacheKey = `${provider}:${apiKey}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ models: cached });
  }

  try {
    const result = await fetchModels(provider, apiKey);
    if (result.error) {
      return NextResponse.json(
        { error: result.error, providerStatus: result.providerStatus },
        { status: 502 }
      );
    }
    const models = result.models ?? [];
    setCached(cacheKey, models);
    return NextResponse.json({ models });
  } catch (err: unknown) {
    console.error("[api/ai/models] error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message, providerStatus: 0 }, { status: 502 });
  }
}
