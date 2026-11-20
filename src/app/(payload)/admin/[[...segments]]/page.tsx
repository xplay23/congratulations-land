import type { Metadata } from "next";
import { connection } from "next/server";
import { RootPage, generatePageMetadata } from "@payloadcms/next/views";
import config from "@payload-config";
import { importMap } from "../importMap.js";

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Args): Promise<Metadata> {
  return generatePageMetadata({ config, params, searchParams });
}

export default async function Page({ params, searchParams }: Args) {
  await connection();
  return RootPage({ config, importMap, params, searchParams });
}
