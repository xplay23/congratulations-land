import { getCmsAiConfig, type CmsAiRuntimeConfig } from "@/lib/cms-ai-config";

const FALLBACK_PREMADE_VOICE_ID = "pqHfZKP75CvOlQylNhV4"; // Bill - Wise, Mature, Balanced (premade)

export interface ElevenLabsSynthesisOptions {
  text: string;
  languageCode?: string | null;
  voiceId?: string | null;
  modelId?: string | null;
  stability?: number | null;
  similarityBoost?: number | null;
  cmsConfig?: CmsAiRuntimeConfig;
}

export interface ElevenLabsSynthesisResult {
  buffer: Buffer;
  voiceIdUsed: string;
  modelIdUsed: string;
  charCount: number;
}

async function callElevenLabsTts(
  apiKey: string,
  voiceId: string,
  modelId: string,
  text: string,
  stability = 0.5,
  similarityBoost = 0.78,
  languageCode?: string | null
): Promise<Response> {
  const payload: Record<string, unknown> = {
    text,
    model_id: modelId,
    voice_settings: {
      stability,
      similarity_boost: similarityBoost,
    },
  };

  // ISO 639-1 language enforcement (e.g. "uk", "ru"); not supported on eleven_multilingual_v2
  const normalizedLang = languageCode?.trim().toLowerCase();
  if (normalizedLang && modelId !== "eleven_multilingual_v2") {
    payload.language_code = normalizedLang;
  }

  return fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
}

export async function synthesizeElevenLabsBuffer(
  opts: ElevenLabsSynthesisOptions
): Promise<ElevenLabsSynthesisResult> {
  const cfg = opts.cmsConfig || (await getCmsAiConfig());
  const apiKey = cfg.elevenLabsApiKey?.trim();
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const text = opts.text.trim();
  if (!text) {
    throw new Error("TTS text cannot be empty");
  }

  let voiceId =
    opts.voiceId?.trim() ||
    cfg.elevenLabsVoiceId?.trim() ||
    "NOpBlnGInO9m6vDvFkFC";
  const modelId =
    opts.modelId?.trim() || cfg.elevenLabsModelId?.trim() || "eleven_v4";
  const stability =
    typeof opts.stability === "number" && Number.isFinite(opts.stability)
      ? opts.stability
      : cfg.elevenLabsStability ?? 0.5;
  const similarityBoost =
    typeof opts.similarityBoost === "number" &&
    Number.isFinite(opts.similarityBoost)
      ? opts.similarityBoost
      : cfg.elevenLabsSimilarityBoost ?? 0.78;

  let res = await callElevenLabsTts(
    apiKey,
    voiceId,
    modelId,
    text,
    stability,
    similarityBoost,
    opts.languageCode
  );

  if (res.status === 402 && voiceId !== FALLBACK_PREMADE_VOICE_ID) {
    console.warn(
      `[elevenlabs] Voice ${voiceId} requires paid plan (402); falling back to premade voice ${FALLBACK_PREMADE_VOICE_ID}`
    );
    voiceId = FALLBACK_PREMADE_VOICE_ID;
    res = await callElevenLabsTts(
      apiKey,
      voiceId,
      modelId,
      text,
      stability,
      similarityBoost,
      opts.languageCode
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `ElevenLabs TTS failed (${res.status}): ${errText.slice(0, 220)}`
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    buffer,
    voiceIdUsed: voiceId,
    modelIdUsed: modelId,
    charCount: text.length,
  };
}
