import { CmsPageBySlug } from "@/components/CmsPageBySlug";
import { makeLegalMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeLegalMetadata("oferta");
}

export default function OfertaPage() {
  return <CmsPageBySlug slug="oferta" />;
}
