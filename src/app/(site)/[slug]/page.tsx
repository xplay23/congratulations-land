import type { Metadata } from "next";
import { CmsPageBySlug } from "@/components/CmsPageBySlug";
import { makeCmsPageMetadata } from "@/lib/page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return makeCmsPageMetadata(slug);
}

export default async function DynamicCmsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CmsPageBySlug slug={slug} />;
}
