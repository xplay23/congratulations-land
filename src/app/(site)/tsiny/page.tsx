import { CmsPageView } from "@/components/CmsPageView";
import { PricingPageView } from "@/components/PricingPageView";
import {
  getCmsPageBySlug,
  getCmsPosts,
  getCmsServices,
  getCmsShowcases,
} from "@/lib/cms-content";
import { getServerLocale, makePricingMetadata } from "@/lib/page-helpers";

export async function generateMetadata() {
  return makePricingMetadata();
}

export default async function TsinyPage() {
  const locale = await getServerLocale();
  const [page, services, showcases, posts] = await Promise.all([
    getCmsPageBySlug("tsiny", locale),
    getCmsServices(locale),
    getCmsShowcases(locale),
    getCmsPosts(locale),
  ]);

  if (page && page.sections.length > 0) {
    return (
      <CmsPageView
        page={page}
        services={services}
        showcases={showcases}
        articles={posts}
      />
    );
  }

  return <PricingPageView services={services} />;
}
