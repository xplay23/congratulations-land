import { ServiceLandingBySlug } from "@/components/ServiceLandingBySlug";
import { makeServiceMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeServiceMetadata("ozhyvyty-foto");
}

export default function OzhyvytyFotoPage() {
  return <ServiceLandingBySlug slug="ozhyvyty-foto" />;
}
