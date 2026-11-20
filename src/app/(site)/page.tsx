import { HomePageClient } from "@/components/HomePageClient";
import { RenderBlocks } from "@/components/RenderBlocks";
import {
  getCmsHomeTemplate,
  getCmsPosts,
  getCmsReviews,
  getCmsServices,
  getCmsShowcases,
} from "@/lib/cms-content";
import { getServerLocale } from "@/lib/page-helpers";

export default async function HomePage() {
  const locale = await getServerLocale();
  const [homeTemplate, services, showcases, reviews, posts] = await Promise.all([
    getCmsHomeTemplate(locale),
    getCmsServices(locale),
    getCmsShowcases(locale),
    getCmsReviews(),
    getCmsPosts(locale),
  ]);

  if (homeTemplate.sections.length > 0) {
    return (
      <div className="pb-12">
        <RenderBlocks
          blocks={homeTemplate.sections}
          services={services}
          showcases={showcases}
          articles={posts}
        />
      </div>
    );
  }

  return (
    <HomePageClient
      showcases={showcases}
      reviews={reviews.slice(0, 4)}
      articles={posts.slice(0, 3)}
    />
  );
}
