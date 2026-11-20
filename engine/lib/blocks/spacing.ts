import type { Field } from "payload";

export type BlockSpacingValue = "none" | "sm" | "md" | "lg";

export const SPACING_CLASS: Record<BlockSpacingValue, string> = {
  none: "",
  sm: "py-3",
  md: "py-6",
  lg: "py-12",
};

/**
 * Vertical padding select shared by builder blocks (adapted from domainer-platform).
 * `dbName` keeps Postgres enum identifiers under the 63-char limit.
 */
export function makeSpacingField(
  dbPrefix: string,
  defaultValue: BlockSpacingValue = "none"
): Field {
  return {
    name: "spacing",
    type: "select",
    defaultValue,
    dbName: `${dbPrefix}_sp`,
    label: {
      ru: "Вертикальный отступ блока",
      uk: "Вертикальний відступ блоку",
      en: "Vertical Spacing",
    },
    options: [
      { label: { ru: "Нет", uk: "Немає", en: "None" }, value: "none" },
      { label: { ru: "Маленький (12px)", uk: "Малий (12px)", en: "Small (12px)" }, value: "sm" },
      { label: { ru: "Средний (24px)", uk: "Середній (24px)", en: "Medium (24px)" }, value: "md" },
      { label: { ru: "Большой (48px)", uk: "Великий (48px)", en: "Large (48px)" }, value: "lg" },
    ],
    admin: {
      description: {
        ru: "Дополнительный отступ сверху и снизу блока.",
        uk: "Додатковий відступ зверху та знизу блоку.",
        en: "Extra padding above and below this block.",
      },
    },
  };
}

export function resolveSpacingClass(value?: string | null): string {
  if (value === "sm" || value === "md" || value === "lg") {
    return SPACING_CLASS[value];
  }
  return "";
}
