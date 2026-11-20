import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  cacheComponents: false,
  serverExternalPackages: [
    "sharp",
    "pdf-lib",
    "@pdf-lib/fontkit",
    "openai",
    "pino",
    "pino-pretty",
    "thread-stream",
  ],
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@engine": path.resolve(dirname, "engine"),
      "@payload-config": path.resolve(dirname, "payload.config.ts"),
    };
    return config;
  },
};

export default withPayload(nextConfig);
