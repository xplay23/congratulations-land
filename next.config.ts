import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "pdf-lib", "@pdf-lib/fontkit", "openai"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
