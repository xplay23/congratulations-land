import { CmsPageBySlug } from "@/components/CmsPageBySlug";
import { makeLegalMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeLegalMetadata("kontakty");
}

export default function KontaktyPage() {
  return <CmsPageBySlug slug="kontakty" />;
}
