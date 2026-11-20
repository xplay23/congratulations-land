import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "@engine/lib/payload";

interface VoiceItem {
  voiceId: string;
  name: string;
  category?: string;
}

const voicesCache = new Map<string, { voices: VoiceItem[]; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

export async function GET(req: NextRequest) {
  const payload = await getPayload();
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let apiKey = searchParams.get("apiKey")?.trim() || "";

  if (!apiKey) {
    try {
      const el = (await payload.findGlobal({
        slug: "elevenlabs-settings",
      })) as unknown as { apiKey?: string | null };
      apiKey = el.apiKey?.trim() || "";
    } catch {
      // ignore
    }
  }
  if (!apiKey) {
    apiKey = process.env.ELEVENLABS_API_KEY?.trim() || "";
  }

  if (!apiKey) {
    return NextResponse.json({ voices: [] });
  }

  const cached = voicesCache.get(apiKey);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({ voices: cached.voices });
  }

  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
    });
    if (!res.ok) {
      return NextResponse.json(
        {
          voices: [],
          error: `ElevenLabs voices unavailable (HTTP ${res.status})`,
        },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      voices?: Array<{ voice_id: string; name: string; category?: string }>;
    };
    const voices: VoiceItem[] = (data.voices ?? [])
      .filter((v) => v.voice_id && v.name)
      .map((v) => ({
        voiceId: v.voice_id,
        name: v.name,
        category: v.category,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    voicesCache.set(apiKey, { voices, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ voices });
  } catch (err) {
    return NextResponse.json(
      {
        voices: [],
        error: err instanceof Error ? err.message : "Failed fetching voices",
      },
      { status: 502 }
    );
  }
}
