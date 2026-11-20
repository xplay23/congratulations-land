import { notFound } from "next/navigation";
import { ServiceLandingView } from "@/components/ServiceLandingView";
import {
  getCmsPosts,
  getCmsServiceBySlug,
  getCmsServices,
  getCmsServiceVariations,
  getCmsShowcases,
} from "@/lib/cms-content";
import { getServerLocale } from "@/lib/page-helpers";

export async function ServiceLandingBySlug({ slug }: { slug: string }) {
  const locale = await getServerLocale();
  const [item, allServices, variations, showcases, posts] = await Promise.all([
    getCmsServiceBySlug(slug, locale),
    getCmsServices(locale),
    getCmsServiceVariations(locale, slug),
    getCmsShowcases(locale),
    getCmsPosts(locale),
  ]);

  if (!item) notFound();

  const relatedItems = item.relatedSlugs
    .map((relSlug) => allServices.find((s) => s.slug === relSlug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <ServiceLandingView
      item={item}
      allServices={allServices}
      variations={variations}
      showcases={showcases}
      relatedItems={relatedItems}
      articles={posts.slice(0, 3)}
    />
  );
}
