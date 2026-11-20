import { CmsPageBySlug } from "@/components/CmsPageBySlug";
import { makeLegalMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeLegalMetadata("pro-nas");
}

export default function ProNasPage() {
  return <CmsPageBySlug slug="pro-nas" />;
}
