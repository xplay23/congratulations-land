import { LegalDocumentView } from "@/components/LegalDocumentView";
import { makeLegalMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeLegalMetadata("pro-nas");
}

export default function ProNasPage() {
  return <LegalDocumentView pageKey="pro-nas" />;
}
