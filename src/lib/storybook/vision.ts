import fs from "node:fs";
import {
  buildChatModelParams,
  getCmsOpenAIRuntime,
  withOpenAIRetry,
} from "@/lib/openai-client";
import { resolveUploadPath } from "@/lib/storage";
import type { AiCostTracker } from "@/lib/ai-cost";
import type { StorybookOrderPayload } from "@/lib/types";

export interface PhotoVisualPassports {
  childVisualPassport?: string;
  companionVisualPassport?: string;
}

function fileToDataUrl(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function parseVisualPassportJson(raw: string): string | undefined {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return undefined;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as {
      visualPassport?: string;
    };
    return parsed.visualPassport?.trim() || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extracts strict factual visual traits from uploaded child and/or companion photos
 * BEFORE story writing so the writer & illustrator stay grounded in the real subject
 * (species, coat markings, hair, glasses) without inventing conflicting traits.
 */
export async function extractPhotoVisualPassports(
  payload: StorybookOrderPayload,
  costTracker?: AiCostTracker
): Promise<PhotoVisualPassports> {
  const { client, config } = await getCmsOpenAIRuntime();
  if (!client) return {};

  const directorModel = config.storybookDirectorModel;
  const result: PhotoVisualPassports = {};

  const childPhotoPath = resolveUploadPath(payload.photoUploadId);
  const companionAllowed =
    payload.companionType === "pet" || payload.companionType === "family";
  const companionPhotoPath = companionAllowed
    ? resolveUploadPath(payload.companionPhotoUploadId)
    : null;

  const tasks: Array<Promise<void>> = [];

  if (childPhotoPath) {
    tasks.push(
      (async () => {
        const dataUrl = fileToDataUrl(childPhotoPath);
        const res = await withOpenAIRetry("vision_child", () =>
          client.chat.completions.create({
            ...buildChatModelParams(0.2, 700, directorModel),
            messages: [
              {
                role: "system",
                content:
                  "You are a factual visual archivist for children's book character design. Describe ONLY directly visible facial/hair/eye traits in the photo. Never guess unseen items or invent background details. Return strict JSON only.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Authoritative form facts (DO NOT OVERRIDE): gender=${payload.gender}, ageGroup=${payload.ageGroup}.
Describe ONLY the child's visible identity traits for illustration consistency: hair color, hair length & hairstyle (bangs, curls, braids, part), eye color, eyebrow shape, skin tone, glasses (frame shape/color if worn), freckles/dimples. Ignore photo background and modern casual clothes unless relevant to hairstyle.
Return ONLY valid JSON: { "visualPassport": "..." }`,
                  },
                  { type: "image_url", image_url: { url: dataUrl } },
                ],
              },
            ],
          })
        );
        costTracker?.addChatUsage("vision_child", directorModel, res.usage, true);
        result.childVisualPassport = parseVisualPassportJson(
          res.choices[0]?.message?.content || ""
        );
      })()
    );
  }

  if (companionPhotoPath) {
    tasks.push(
      (async () => {
        const dataUrl = fileToDataUrl(companionPhotoPath);
        const declaredFacts =
          payload.companionType === "pet"
            ? `companionType=pet, species=${payload.companionSpecies || "pet"}, gender=${payload.companionGender || "unspecified"}`
            : `companionType=family, relation=${payload.companionRelation || "family member"}, gender=${payload.companionGender || "unspecified"}`;

        const res = await withOpenAIRetry("vision_companion", () =>
          client.chat.completions.create({
            ...buildChatModelParams(0.2, 700, directorModel),
            messages: [
              {
                role: "system",
                content:
                  "You are a factual visual archivist for children's book character design. Respect the user's declared species/relation and gender as authoritative. Describe ONLY directly visible appearance traits in the photo; never hallucinate unseen body parts (like a hidden tail) or change the declared species. Return strict JSON only.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Authoritative user form facts (DO NOT OVERRIDE): ${declaredFacts}${
                      payload.companionName ? `, name=${payload.companionName}` : ""
                    }${
                      payload.companionDescription
                        ? `, userNotes=${payload.companionDescription}`
                        : ""
                    }.
Describe ONLY what is directly visible in the photo for character illustration consistency (coat/plumage/hair colors, exact patches/markings, ear shape, muzzle/beak, eye color, beard/glasses if human, build). Ignore photo background.
Return ONLY valid JSON: { "visualPassport": "..." }`,
                  },
                  { type: "image_url", image_url: { url: dataUrl } },
                ],
              },
            ],
          })
        );
        costTracker?.addChatUsage("vision_companion", directorModel, res.usage, true);
        result.companionVisualPassport = parseVisualPassportJson(
          res.choices[0]?.message?.content || ""
        );
      })()
    );
  }

  await Promise.all(tasks);
  return result;
}
