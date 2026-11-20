import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthCapabilities, requireAdminApi } from "@/lib/admin-auth";
import {
  getDirectorModel,
  getImageModel,
  getImageQuality,
  getOpenAIApiKey,
  getTextModel,
} from "@/lib/openai-client";
import { isMonoSandboxMode } from "@/lib/payments/mono";
import {
  getAiRatesConfig,
  getPlatformLimits,
  getPricingConfig,
  saveAiRatesConfig,
  savePlatformLimits,
  savePricingConfig,
} from "@/lib/settings";
import { getTelegramBotUsername } from "@/lib/telegram/bot";
import type {
  AiRatesConfig,
  PlatformLimitsConfig,
  PricingConfig,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function getSystemHealth() {
  const caps = getAdminAuthCapabilities();
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
  const hasSmtp = Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );

  return {
    hasOpenAI: Boolean(getOpenAIApiKey()),
    textModel: getTextModel(),
    directorModel: getDirectorModel(),
    imageModel: getImageModel(),
    imageQuality: getImageQuality(),
    visionQaEnabled: process.env.OPENAI_VISION_QA !== "false",
    hasElevenLabs: Boolean(process.env.ELEVENLABS_API_KEY?.trim()),
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID?.trim() || "NOpBlnGInO9m6vDvFkFC",
    monoSandbox: isMonoSandboxMode(),
    monoTokenConfigured: Boolean(process.env.MONO_TOKEN?.trim()),
    emailTransport: hasResend ? "resend" : hasSmtp ? "smtp" : "dev_outbox",
    telegramBotUsername: getTelegramBotUsername(),
    adminAuthMethods: {
      password: caps.passwordEnabled,
      email: caps.emailEnabled,
    },
  };
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    {
      pricing: getPricingConfig(),
      limits: getPlatformLimits(),
      aiRates: getAiRatesConfig(),
      system: getSystemHealth(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as {
      pricing?: Partial<PricingConfig>;
      limits?: Partial<PlatformLimitsConfig>;
      aiRates?: Partial<AiRatesConfig>;
    };

    const pricing = body.pricing ? savePricingConfig(body.pricing) : getPricingConfig();
    const limits = body.limits ? savePlatformLimits(body.limits) : getPlatformLimits();
    const aiRates = body.aiRates ? saveAiRatesConfig(body.aiRates) : getAiRatesConfig();

    return NextResponse.json({
      ok: true,
      pricing,
      limits,
      aiRates,
      system: getSystemHealth(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed saving settings";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
