import { LegalDocumentView } from "@/components/LegalDocumentView";
import { makeLegalMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeLegalMetadata("oferta");
}

export default function OfertaPage() {
  return <LegalDocumentView pageKey="oferta" />;
}
