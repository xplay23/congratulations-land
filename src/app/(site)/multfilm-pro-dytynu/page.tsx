import { ServiceLandingBySlug } from "@/components/ServiceLandingBySlug";
import { makeServiceMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeServiceMetadata("multfilm-pro-dytynu");
}

export default function MultfilmPage() {
  return <ServiceLandingBySlug slug="multfilm-pro-dytynu" />;
}
