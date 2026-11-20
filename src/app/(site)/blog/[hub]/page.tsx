import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndexView } from "@/components/BlogViews";
import {
  getCmsBlogCategories,
  getCmsPosts,
  getCmsServiceBySlug,
} from "@/lib/cms-content";
import { getServerLocale, makeBlogIndexMetadata } from "@/lib/page-helpers";

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
  const locale = await getServerLocale();
  const [categories, posts] = await Promise.all([
    getCmsBlogCategories(locale),
    getCmsPosts(locale, hubSlug),
  ]);
  const hub = categories.find((h) => h.slug === hubSlug);
  if (!hub) notFound();

  const targetService = hub.targetServiceSlug
    ? await getCmsServiceBySlug(hub.targetServiceSlug, locale)
    : undefined;

  return (
    <BlogIndexView
      categories={categories}
      posts={posts}
      hub={hub}
      targetService={targetService}
    />
  );
}
