import path from "node:path";
import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "filename",
    group: "Content",
  },
  upload: {
    staticDir: path.resolve(process.cwd(), "public", "media"),
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Alt Text",
      localized: true,
    },
  ],
};
