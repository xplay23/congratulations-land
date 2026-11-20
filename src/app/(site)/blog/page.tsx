import { BlogIndexView } from "@/components/BlogViews";
import { makeBlogIndexMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeBlogIndexMetadata();
}

export default function BlogPage() {
  return <BlogIndexView />;
}
