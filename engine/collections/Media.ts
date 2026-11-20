import path from "node:path";
import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: { ru: "Медиафайл", uk: "Медіафайл", en: "Media" },
    plural: { ru: "Медиа", uk: "Медіа", en: "Media" },
  },
  admin: {
    useAsTitle: "filename",
    group: { ru: "Контент", uk: "Контент", en: "Content" },
  },
  upload: {
    staticDir: path.resolve(process.cwd(), "public", "media"),
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: { ru: "Alt-текст", uk: "Alt-текст", en: "Alt Text" },
      localized: true,
    },
  ],
};
