import { LegalDocumentView } from "@/components/LegalDocumentView";
import { makeLegalMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeLegalMetadata("konfidentsiynist");
}

export default function KonfidentsiynistPage() {
  return <LegalDocumentView pageKey="konfidentsiynist" />;
}
