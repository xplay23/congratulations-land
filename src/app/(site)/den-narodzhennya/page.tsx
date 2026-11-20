import { ServiceLandingBySlug } from "@/components/ServiceLandingBySlug";
import { makeServiceMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeServiceMetadata("den-narodzhennya");
}

export default function DenNarodzhennyaPage() {
  return <ServiceLandingBySlug slug="den-narodzhennya" />;
}
