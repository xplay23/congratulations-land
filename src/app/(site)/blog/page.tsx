import { BlogIndexView } from "@/components/BlogViews";
import { getCmsBlogCategories, getCmsPosts } from "@/lib/cms-content";
import { getServerLocale, makeBlogIndexMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeBlogIndexMetadata();
}

export default async function BlogPage() {
  const locale = await getServerLocale();
  const [categories, posts] = await Promise.all([
    getCmsBlogCategories(locale),
    getCmsPosts(locale),
  ]);
  return <BlogIndexView categories={categories} posts={posts} />;
}
