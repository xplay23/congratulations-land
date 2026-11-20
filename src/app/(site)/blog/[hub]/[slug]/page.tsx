import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticleView } from "@/components/BlogViews";
import {
  getCmsBlogCategories,
  getCmsPostBySlug,
  getCmsPosts,
  getCmsServiceBySlug,
} from "@/lib/cms-content";
import { getServerLocale, makeBlogArticleMetadata } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hub: string; slug: string }>;
}): Promise<Metadata> {
  const { hub, slug } = await params;
  return makeBlogArticleMetadata(hub, slug);
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ hub: string; slug: string }>;
}) {
  const { hub: hubSlug, slug } = await params;
  const locale = await getServerLocale();
  const [article, categories, allPosts] = await Promise.all([
    getCmsPostBySlug(hubSlug, slug, locale),
    getCmsBlogCategories(locale),
    getCmsPosts(locale),
  ]);

  if (!article) notFound();

  const hub = categories.find((c) => c.slug === article.hubSlug);
  const ctaService = article.ctaServiceSlug
    ? await getCmsServiceBySlug(article.ctaServiceSlug, locale)
    : undefined;
  const otherArticles = allPosts
    .filter((p) => p.slug !== article.slug)
    .slice(0, 3);

  return (
    <BlogArticleView
      article={article}
      hub={hub}
      ctaService={ctaService}
      otherArticles={otherArticles}
    />
  );
}
