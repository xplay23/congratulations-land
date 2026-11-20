import type { Metadata } from "next";
import "@payloadcms/next/css";
import "../../../engine/styles/admin-base.css";
import "../../../engine/styles/admin-layout.css";
import "../../../engine/styles/admin-payload.css";
import "../../../engine/styles/admin-custom-pages.css";
import "../../../engine/styles/admin-tailwind.css";
import { Inter } from "next/font/google";
import { RootLayout, handleServerFunctions } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";
import config from "@payload-config";
import { importMap } from "./admin/importMap.js";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VideoVitannya Admin",
};

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunction}
      htmlProps={{ className: inter.variable }}
    >
      {children}
    </RootLayout>
  );
}
