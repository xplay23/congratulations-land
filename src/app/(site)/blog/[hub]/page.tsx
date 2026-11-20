import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndexView } from "@/components/BlogViews";
import { makeBlogIndexMetadata } from "@/lib/page-helpers";
import { BLOG_HUBS } from "@/lib/site-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hub: string }>;
}): Promise<Metadata> {
  const { hub: hubSlug } = await params;
  return makeBlogIndexMetadata(hubSlug);
}

export default async function BlogHubPage({
  params,
}: {
  params: Promise<{ hub: string }>;
}) {
  const { hub: hubSlug } = await params;
  const hub = BLOG_HUBS.find((h) => h.slug === hubSlug);
  if (!hub) notFound();
  return <BlogIndexView hub={hub} />;
}
