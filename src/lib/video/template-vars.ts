import { formatAgeWithUnit } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export interface VideoTemplateVarsInput {
  lang: Lang;
  fields: Record<string, string>;
}

/**
 * Builds computed template variables (like `voc`, `age`, `ageNum`, `agePrefix`,
 * `name`, `ach`) on top of raw user form fields so templates can stay clean.
 */
export function buildTemplateVars(input: VideoTemplateVarsInput): Record<string, string> {
  const { lang, fields } = input;
  const vars: Record<string, string> = {};

  for (const [k, v] of Object.entries(fields)) {
    vars[k] = typeof v === "string" ? v.trim() : String(v ?? "").trim();
  }

  // Convenience aliases for backward compatibility with existing prompt templates
  const childName = vars.childName || vars.name || "";
  const childNameVocative = vars.childNameVocative || vars.voc || childName;
  if (childName) {
    vars.childName = childName;
    vars.name = childName;
  }
  if (childNameVocative) {
    vars.childNameVocative = childNameVocative;
    vars.voc = childNameVocative;
  }

  const achievement = vars.achievement || vars.ach || "";
  if (achievement) {
    vars.achievement = achievement;
    vars.ach = achievement;
  }

  // Age & grammatical agePrefix
  const rawAge = vars.age || "";
  const rawAgeNum = vars.ageNum || "";
  let formattedAge = rawAge;
  let ageNumStr = rawAgeNum;

  if (!formattedAge && rawAgeNum) {
    const parsed = Number(rawAgeNum);
    if (Number.isFinite(parsed) && parsed > 0) {
      formattedAge = formatAgeWithUnit(parsed, lang);
      ageNumStr = String(Math.round(parsed));
    }
  } else if (formattedAge && !ageNumStr) {
    const m = formattedAge.match(/^(\d+)/);
    if (m) ageNumStr = m[1];
  } else if (formattedAge && /^\d+$/.test(formattedAge)) {
    const parsed = Number(formattedAge);
    if (Number.isFinite(parsed) && parsed > 0) {
      formattedAge = formatAgeWithUnit(parsed, lang);
      ageNumStr = String(Math.round(parsed));
    }
  }

  vars.age = formattedAge;
  vars.ageNum = ageNumStr;

  if (!vars.agePrefix) {
    if (lang === "uk") {
      vars.agePrefix = formattedAge
        ? /^1\b/.test(formattedAge)
          ? `У свій ${formattedAge} ти`
          : `У свої ${formattedAge} ти`
        : "Цього року ти";
    } else {
      vars.agePrefix = formattedAge
        ? /^1\b/.test(formattedAge)
          ? `В свой ${formattedAge} ты`
          : `В свои ${formattedAge} ты`
        : "В этом году ты";
    }
  }

  // Normalized gender
  const g = (vars.gender || "").toLowerCase();
  vars.gender = g === "girl" || g === "female" ? "girl" : "boy";

  return vars;
}

/**
 * Interpolates a voice line template string with:
 * - Conditional blocks: `{?fieldKey:text if non-empty|fallback}` (supports nested `{fieldKey}`)
 * - Gender inflection: `{gender:boyForm|girlForm}`
 * - Standard variables: `{fieldKey}` and `{{fieldKey}}`
 */
export function interpolateVideoText(
  template: string,
  vars: Record<string, string>
): string {
  if (!template) return "";
  let out = template;

  // 1. Gender inline syntax: {gender:boyText|girlText}
  const isGirl = vars.gender === "girl";
  out = out.replace(/\{gender:([^|{}]*)\|([^{}]*)\}/g, (_m, boyPart, girlPart) =>
    isGirl ? String(girlPart) : String(boyPart)
  );

  // 2. Variable substitution first: {{key}} and {key} (leaves {?key:...} intact)
  for (const [key, val] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, val);
    out = out.replaceAll(`{${key}}`, val);
  }

  // 3. Conditional syntax: {?key:thenText|elseText} or {?key:thenText}
  // Runs after {key} substitution so nested variables inside branches resolve cleanly.
  for (let pass = 0; pass < 2; pass++) {
    out = out.replace(
      /\{\?([a-zA-Z0-9_]+):([^|{}]*)(?:\|([^{}]*))?\}/g,
      (_m, key: string, thenPart: string, elsePart?: string) => {
        const val = (vars[key] || "").trim();
        return val.length > 0 ? thenPart : elsePart ?? "";
      }
    );
  }

  // Clean up duplicate spaces caused by empty optional variables
  return out.replace(/\s{2,}/g, " ").trim();
}
