import { ServiceLandingBySlug } from "@/components/ServiceLandingBySlug";
import { makeServiceMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeServiceMetadata("kazka");
}

export default function KazkaPage() {
  return <ServiceLandingBySlug slug="kazka" />;
}
