import { ServiceLandingBySlug } from "@/components/ServiceLandingBySlug";
import { makeServiceMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeServiceMetadata("pisnya-na-zamovlennya");
}

export default function PisnyaPage() {
  return <ServiceLandingBySlug slug="pisnya-na-zamovlennya" />;
}
