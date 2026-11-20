import { PricingPageView } from "@/components/PricingPageView";
import { makePricingMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makePricingMetadata();
}

export default function TsinyPage() {
  return <PricingPageView />;
}
