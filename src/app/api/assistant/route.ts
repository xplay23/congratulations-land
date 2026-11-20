import { NextRequest, NextResponse } from "next/server";
import {
  buildChatModelParams,
  getCmsOpenAIRuntime,
} from "@/lib/openai-client";
import type { Lang } from "@/lib/types";

interface AssistantRequest {
  lang: Lang;
  context?: "general" | "video" | "storybook";
  message: string;
  childName?: string;
  age?: string;
  gender?: "boy" | "girl";
}

function buildFallbackReply(req: AssistantRequest): string {
  const isUk = req.lang === "uk";
  const name = req.childName?.trim() || (isUk ? "Софійка" : "Миша");

  if (req.context === "video") {
    return isUk
      ? `Ось 3 чудові варіанти досягнень для ${name} (у межах 25–75 символів):\n1. «навчився кататися на велосипеді й помагаєш мамі»\n2. «старанно вчишся в школі та піклуєшся про молодших»\n3. «дуже любиш малювати й дарувати рідним усмішки»\n\nПідказка для кличного відмінка: ${
          name.endsWith("а")
            ? `${name.slice(0, -1)}о`
            : name.endsWith("я")
              ? `${name.slice(0, -1)}ю`
              : `${name}`
        }.`
      : `Вот 3 тёплых варианта достижения для ${name} (в пределах 25–75 символов):\n1. «научился кататься на велосипеде и помогаешь маме»\n2. «старательно читаешь книжки и заботишься о близких»\n3. «очень любишь рисовать и дарить родным улыбки»`;
  }

  return isUk
    ? `Я з радістю допоможу підготувати подарунок для ${name}! Для відеопривітання тримайте фразу досягнення в межах 25–75 символів (максимум 90), а для казки PDF достатньо 3 кроків — фото дитини необов'язкове, але за наявності ми зробимо канонічний портрет без збереження EXIF-даних.`
    : `С радостью помогу подготовить подарок для ${name}! Для видеопоздравления держите фразу достижения в пределах 25–75 символов (максимум 90), а для сказки PDF достаточно 3 простых шагов — фото ребёнка необязательно, а при загрузке мы удаляем EXIF-метаданные.`;
}

const DEFAULT_ASSISTANT_SYSTEM = `You are VideoVitannya's warm, concise AI gift concierge speaking {{language}}.
Help parents personalize:
1) Video greeting from St. Nicholas: name must be 2–15 chars (suggest Ukrainian кличний відмінок if Ukrainian), achievement phrase MUST be 25–75 chars (hard max 90 chars) and read naturally after "У свої {age} ти ..." / "В свои {age} ты ...".
2) Illustrated Storybook PDF: help brainstorm cozy, magical, age-appropriate plot ideas, settings, or recurring favorite toys.
Keep answers concise, practical, and friendly.`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AssistantRequest;
    const lang = body.lang === "ru" ? "ru" : "uk";
    const { client, config } = await getCmsOpenAIRuntime();

    if (!client) {
      return NextResponse.json({
        reply: buildFallbackReply({ ...body, lang }),
        mode: "fallback",
      });
    }

    const langLabel = lang === "uk" ? "Ukrainian" : "Russian";
    const promptTemplate =
      config.prompts["assistant-system"]?.trim() || DEFAULT_ASSISTANT_SYSTEM;
    const systemPrompt = promptTemplate.replace(/\{\{language\}\}/g, langLabel);

    const res = await client.chat.completions.create({
      ...buildChatModelParams(0.7, 700, config.textModel),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Context: ${body.context || "general"}, Child: ${
            body.childName || "not set"
          }, Age: ${body.age || "not set"}, Gender: ${
            body.gender || "not set"
          }.\nUser question: ${body.message}`,
        },
      ],
    });

    return NextResponse.json({
      reply:
        res.choices[0]?.message?.content?.trim() ||
        buildFallbackReply({ ...body, lang }),
      mode: "openai",
    });
  } catch (err) {
    console.error("[api/assistant] error:", err);
    const msg = err instanceof Error ? err.message : "Assistant error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
