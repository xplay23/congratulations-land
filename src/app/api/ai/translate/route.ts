import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { getPayload } from "@engine/lib/payload";
import { initAIProvider } from "@engine/lib/ai/providers";
import { TranslationResultSchema } from "@engine/lib/ai/schemas";
import { getCmsAiConfig } from "@/lib/cms-ai-config";
import { buildVercelReasoningOptions } from "@/lib/openai-client";

export const maxDuration = 60;

interface TranslateBody {
  sourceLang: "uk" | "ru";
  targetLang: "uk" | "ru";
  fields: Record<string, string>;
}

export async function POST(req: NextRequest) {
  const payload = await getPayload();
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TranslateBody;
  try {
    body = (await req.json()) as TranslateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sourceLang, targetLang, fields } = body;
  if (
    (sourceLang !== "uk" && sourceLang !== "ru") ||
    (targetLang !== "uk" && targetLang !== "ru") ||
    sourceLang === targetLang ||
    !fields ||
    typeof fields !== "object" ||
    Object.keys(fields).length === 0
  ) {
    return NextResponse.json(
      { error: "Invalid translation payload" },
      { status: 400 }
    );
  }

  const cfg = await getCmsAiConfig();
  if (!cfg.enabled) {
    return NextResponse.json(
      { error: "AI is disabled in AI Settings" },
      { status: 400 }
    );
  }

  const provider = cfg.provider;
  const model = cfg.textModel;
  const apiKey = cfg.apiKey || "";

  if (!apiKey) {
    return NextResponse.json(
      { error: "AI API key is not configured" },
      { status: 400 }
    );
  }

  const customRule = cfg.prompts["translate-ru-uk"] || "";

  const sourceLabel =
    sourceLang === "ru" ? "Russian (Русский)" : "Ukrainian (Українська)";
  const targetLabel =
    targetLang === "uk" ? "Ukrainian (Українська)" : "Russian (Русский)";

  const prompt = `You are a native bilingual editor for VideoVitannya (personalized AI videos & children's books in Ukraine).
Translate every value in the JSON object from ${sourceLabel} into natural, warm, grammatically impeccable ${targetLabel}.

Rules:
1. Keep the exact same JSON keys in "translated".
2. Preserve all HTML tags (<p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <u>, <blockquote>, <br />) and line structure unchanged — translate only the human-readable text inside them.
3. Preserve brand names ("VideoVitannya", "Plata by mono", "Telegram", "PDF", "HD 720p") and placeholders like {{name}}, {{age}}, {{achievement}}, {{siteName}}.
4. When translating to Ukrainian: use natural literary Ukrainian (no surzhyk or Russian calques), use proper кличний відмінок where appropriate, and keep "Святий Миколай" / "Книга добрих справ" idiomatic.
5. When translating to Russian: use natural literary Russian ("Святой Николай", "Книга добрых дел").
${customRule ? `\nAdditional editorial instructions:\n${customRule}` : ""}

Input fields JSON:
${JSON.stringify(fields, null, 2)}`;

  try {
    const aiProvider = initAIProvider(provider, apiKey);
    const providerOptions = buildVercelReasoningOptions(
      provider,
      model,
      cfg.reasoningEffort
    );

    const result = await generateObject({
      model: aiProvider(model),
      schema: TranslationResultSchema,
      prompt,
      ...(providerOptions ? { providerOptions: providerOptions as never } : {}),
    });

    return NextResponse.json({ translated: result.object.translated });
  } catch (err) {
    console.error(
      "[api/ai/translate] error:",
      { sourceLang, targetLang, model },
      err
    );
    const message = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
