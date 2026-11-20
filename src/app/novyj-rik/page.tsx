import { ServiceLandingBySlug } from "@/components/ServiceLandingBySlug";
import { makeServiceMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeServiceMetadata("novyj-rik");
}

export default function NovyjRikPage() {
  return <ServiceLandingBySlug slug="novyj-rik" />;
}
