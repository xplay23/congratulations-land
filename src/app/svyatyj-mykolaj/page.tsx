import { ServiceLandingBySlug } from "@/components/ServiceLandingBySlug";
import { makeServiceMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makeServiceMetadata("svyatyj-mykolaj");
}

export default function SvyatyjMykolajPage() {
  return <ServiceLandingBySlug slug="svyatyj-mykolaj" />;
}
