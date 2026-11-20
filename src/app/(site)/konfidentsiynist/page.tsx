import { CmsPageBySlug } from "@/components/CmsPageBySlug";
import { makeLegalMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeLegalMetadata("konfidentsiynist");
}

export default function KonfidentsiynistPage() {
  return <CmsPageBySlug slug="konfidentsiynist" />;
}
