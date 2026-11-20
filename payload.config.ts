import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { seoPlugin } from "@payloadcms/plugin-seo";

import { Users } from "./engine/collections/Users";
import { Media } from "./engine/collections/Media";
import { SiteSettings } from "./engine/globals/SiteSettings";
import { AISettings } from "./engine/globals/AISettings";
import { AIPrompts } from "./engine/globals/AIPrompts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const { loadEnvConfig } = nextEnv;

// Ensure .env.local is loaded when running Payload CLI (`npx payload ...`)
if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  loadEnvConfig(dirname);
}

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_URL ?? process.env.APP_BASE_URL ?? "",
  localization: {
    locales: [
      { label: "Українська (UA)", code: "uk" },
      { label: "Русский (RU)", code: "ru" },
    ],
    defaultLocale: "uk",
    fallback: true,
  },
  admin: {
    user: "users",
    importMap: {
      baseDir: path.resolve(dirname, "src", "app", "(payload)").replace(/\\/g, "/"),
    },
    components: {
      Nav: "engine/components/admin/Nav#AdminNav",
      actions: ["engine/views/AdminHeaderLink/index"],
      views: {
        dashboard: {
          Component: "engine/views/Dashboard/index",
        },
        Orders: {
          Component: "engine/views/Orders/index#OrdersPageView",
          path: "/orders",
        },
        Tariffs: {
          Component: "engine/views/Tariffs/index#TariffsPageView",
          path: "/tariffs",
        },
      },
      graphics: {
        Logo: "engine/views/AdminLogo/index",
        Icon: "engine/views/AdminIcon/index",
      },
    },
  },
  editor: lexicalEditor(),
  collections: [Users, Media],
  globals: [SiteSettings, AISettings, AIPrompts],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL ?? "",
    },
    push: process.env.PAYLOAD_DB_PUSH !== "false",
  }),
  plugins: [seoPlugin({})],
  typescript: {
    outputFile: path.resolve(dirname, "engine", "types", "payload.ts"),
  },
  secret: process.env.PAYLOAD_SECRET ?? "",
});
