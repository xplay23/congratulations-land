import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticleView } from "@/components/BlogViews";
import { makeBlogArticleMetadata } from "@/lib/page-helpers";
import { BLOG_ARTICLES } from "@/lib/site-content";

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
  const { hub, slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.hub === hub && a.slug === slug);
  if (!article) notFound();
  return <BlogArticleView article={article} />;
}
