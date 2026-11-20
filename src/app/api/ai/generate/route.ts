import { NextRequest, NextResponse } from "next/server";
import { generateObject, generateText } from "ai";
import { getPayload } from "@engine/lib/payload";
import { initAIProvider } from "@engine/lib/ai/providers";
import {
  PostCategorizationSchema,
  SeoSchema,
} from "@engine/lib/ai/schemas";
import { getCmsAiConfig } from "@/lib/cms-ai-config";
import {
  buildVercelReasoningOptions,
  isOpenAIReasoningModel,
} from "@/lib/openai-client";

export const maxDuration = 60;

const PROVIDER_LINKS = {
  openai: {
    status: "https://status.openai.com",
    support: "https://help.openai.com",
  },
  anthropic: {
    status: "https://status.anthropic.com",
    support: "https://support.anthropic.com",
  },
  google: {
    status: "https://status.cloud.google.com",
    support: "https://ai.google.dev/gemini-api/docs/troubleshooting",
  },
} as const;

type ProviderKey = keyof typeof PROVIDER_LINKS;

function classifyProviderError(httpStatus: number): string {
  if (httpStatus === 401) return "invalid_key";
  if (httpStatus === 403) return "key_no_access";
  if (httpStatus === 404) return "model_not_found";
  if (httpStatus === 429) return "quota_exceeded";
  if (httpStatus === 400) return "bad_request";
  if (httpStatus >= 500) return "provider_error";
  return "unknown_error";
}

type GenerateContext = {
  locale?: string;
  language?: string;
  title?: string;
  brief?: string;
  additionalContext?: string;
  excerpt?: string;
  allPostCategories?: string;
  aiPersona?: string;
  siteName?: string;
  siteDescription?: string;
  pageTitle?: string;
  pageContext?: string;
  [key: string]: unknown;
};

function interpolate(template: string, ctx: GenerateContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const val = ctx[key];
    if (val === undefined || val === null) return "";
    return typeof val === "string" ? val : JSON.stringify(val);
  });
}

export async function POST(req: NextRequest) {
  const payload = await getPayload();
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cfg = await getCmsAiConfig();
  if (!cfg.enabled) {
    return NextResponse.json(
      { error: "AI is disabled. Enable it in AI Settings." },
      { status: 400 }
    );
  }

  const provider = cfg.provider;
  const model = cfg.textModel;
  const apiKey = cfg.apiKey || "";

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is not configured in AI Settings or .env.local." },
      { status: 400 }
    );
  }

  let body: { type: string; context?: GenerateContext };
  try {
    body = (await req.json()) as { type: string; context?: GenerateContext };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, context = {} } = body;

  const aiPrompts = (await payload.findGlobal({
    slug: "ai-prompts",
  })) as unknown as {
    prompts?: Array<{
      type: string;
      label: string;
      template: string;
      maxTokens?: number | null;
    }>;
  };

  const promptEntry = (aiPrompts.prompts ?? []).find((p) => p.type === type);
  if (!promptEntry) {
    return NextResponse.json(
      { error: `Prompt type "${type}" not found in AI Prompts settings.` },
      { status: 400 }
    );
  }

  const localeCode = context.locale === "ru" ? "ru" : "uk";
  const languageLabel =
    context.language ||
    (localeCode === "ru"
      ? "Русский язык (Russian)"
      : "Українська мова (Ukrainian)");

  const siteSettings = (await payload.findGlobal({
    slug: "site-settings",
    locale: localeCode,
  })) as unknown as { siteName?: string | null };

  const enrichedContext: GenerateContext = {
    ...context,
    locale: localeCode,
    language: languageLabel,
    aiPersona: context.aiPersona ?? cfg.aiPersona ?? "",
    siteName: context.siteName ?? siteSettings.siteName ?? "VideoVitannya",
    siteDescription: context.siteDescription ?? cfg.siteDescription ?? "",
  };

  const prompt = interpolate(promptEntry.template, enrichedContext);
  const aiProvider = initAIProvider(provider, apiKey);
  const providerOptions = buildVercelReasoningOptions(
    provider,
    model,
    cfg.reasoningEffort
  );

  const isStructured =
    type.endsWith("-seo") || type === "post-categorization";

  try {
    if (isStructured) {
      const schema =
        type === "post-categorization" ? PostCategorizationSchema : SeoSchema;
      const result = await generateObject({
        model: aiProvider(model),
        schema,
        prompt,
        ...(providerOptions ? { providerOptions: providerOptions as never } : {}),
      });

      if (result.finishReason === "length") {
        return NextResponse.json({
          error: "response_truncated",
          providerStatus: 0,
          providerMessage: "Response was cut off due to token limit.",
          model,
          provider,
        });
      }

      return NextResponse.json({ result: result.object });
    }

    const effectiveMaxTokens = promptEntry.maxTokens ?? cfg.maxTokens ?? 2500;
    const isReasoningModel =
      provider === "openai" && isOpenAIReasoningModel(model);

    const result = await generateText({
      model: aiProvider(model),
      prompt,
      maxOutputTokens: effectiveMaxTokens,
      ...(isReasoningModel ? {} : { temperature: cfg.temperature ?? 0.7 }),
      ...(providerOptions ? { providerOptions: providerOptions as never } : {}),
    });

    if (result.finishReason === "length") {
      return NextResponse.json({
        error: "response_truncated",
        providerStatus: 0,
        providerMessage: "Response was cut off due to token limit.",
        model,
        provider,
      });
    }

    const raw = result.text.trim();
    if (type === "post-tags") {
      const jsonStr = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      try {
        return NextResponse.json({ result: JSON.parse(jsonStr) });
      } catch {
        // fall through to plain text
      }
    }

    const text = raw.replace(/^["']|["']$/g, "").trim();
    return NextResponse.json({ result: text });
  } catch (err: unknown) {
    console.error("[api/ai/generate] error:", { type, provider, model }, err);
    let providerStatus = 500;
    let providerMessage = "Unexpected error";
    if (err instanceof Error) {
      providerMessage = err.message;
      const errObj = err as Error & { status?: number; statusCode?: number };
      if (errObj.status != null) providerStatus = errObj.status;
      else if (errObj.statusCode != null) providerStatus = errObj.statusCode;
    }

    return NextResponse.json(
      {
        error: classifyProviderError(providerStatus),
        providerStatus,
        providerMessage,
        model,
        provider,
        links: PROVIDER_LINKS[provider as ProviderKey] ?? {},
      },
      { status: 502 }
    );
  }
}
