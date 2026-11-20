import { LegalDocumentView } from "@/components/LegalDocumentView";
import { makeLegalMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeLegalMetadata("kontakty");
}

export default function KontaktyPage() {
  return <LegalDocumentView pageKey="kontakty" />;
}
