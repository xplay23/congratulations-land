import { NextResponse } from "next/server";
import { getAdminAuthCapabilities, requireAdminApi } from "@/lib/admin-auth";
import { getCmsAiConfig } from "@/lib/cms-ai-config";
import { isMonoSandboxMode } from "@/lib/payments/mono";
import {
  getAiRatesConfig,
  getPlatformLimits,
  getPricingConfig,
} from "@/lib/settings";
import { getTelegramBotUsername } from "@/lib/telegram/bot";

export const dynamic = "force-dynamic";

async function getSystemHealth() {
  const caps = getAdminAuthCapabilities();
  const aiCfg = await getCmsAiConfig();
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
  const hasSmtp = Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );

  return {
    hasOpenAI: Boolean(aiCfg.apiKey),
    textModel: aiCfg.storybookWriterModel,
    directorModel: aiCfg.storybookDirectorModel,
    imageModel: aiCfg.storybookImageModel,
    imageQuality: aiCfg.storybookImageQuality,
    visionQaEnabled: aiCfg.storybookVisionQaEnabled,
    hasElevenLabs: Boolean(aiCfg.elevenLabsApiKey),
    elevenLabsVoiceId: aiCfg.elevenLabsVoiceId,
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

  const [pricing, limits, aiRates, system] = await Promise.all([
    getPricingConfig(),
    getPlatformLimits(),
    getAiRatesConfig(),
    getSystemHealth(),
  ]);

  return NextResponse.json(
    {
      pricing,
      limits,
      aiRates,
      system,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
