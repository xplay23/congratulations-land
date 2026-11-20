import { notFound } from "next/navigation";
import { CmsPageView } from "@/components/CmsPageView";
import { LegalDocumentView } from "@/components/LegalDocumentView";
import {
  getCmsPageBySlug,
  getCmsPosts,
  getCmsServices,
  getCmsShowcases,
} from "@/lib/cms-content";
import { getServerLocale } from "@/lib/page-helpers";
import type { LegalPageItem } from "@/lib/site-content";

const LEGAL_SLUGS = new Set<LegalPageItem["slug"]>([
  "pro-nas",
  "kontakty",
  "oferta",
  "konfidentsiynist",
]);

export async function CmsPageBySlug({ slug }: { slug: string }) {
  const locale = await getServerLocale();
  const [page, services, showcases, posts] = await Promise.all([
    getCmsPageBySlug(slug, locale),
    getCmsServices(locale),
    getCmsShowcases(locale),
    getCmsPosts(locale),
  ]);

  if (page) {
    return (
      <CmsPageView
        page={page}
        services={services}
        showcases={showcases}
        articles={posts}
      />
    );
  }

  if (LEGAL_SLUGS.has(slug as LegalPageItem["slug"])) {
    return <LegalDocumentView pageKey={slug as LegalPageItem["slug"]} />;
  }

  notFound();
}
