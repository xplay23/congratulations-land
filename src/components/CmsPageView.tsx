"use client";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RenderBlocks } from "@/components/RenderBlocks";
import type {
  CmsBlogPostItem,
  CmsPageItem,
  CmsServiceItem,
  CmsShowcasesBundle,
} from "@/lib/cms-content";

export function CmsPageView({
  page,
  services = [],
  showcases,
  articles = [],
}: {
  page: CmsPageItem;
  services?: CmsServiceItem[];
  showcases?: CmsShowcasesBundle;
  articles?: CmsBlogPostItem[];
}) {
  return (
    <div className="space-y-12 pb-12">
      <div>
        <Breadcrumbs items={[{ label: page.title }]} />
        <header className="space-y-3 rounded-3xl border border-amber-200/20 bg-gradient-to-br from-[#141f3f] to-[#0b1020] p-6 sm:p-10">
          {page.eyebrow && (
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              {page.eyebrow}
            </span>
          )}
          <h1 className="font-serif-book text-3xl font-bold text-amber-50 sm:text-4xl">
            {page.h1}
          </h1>
          {page.subtitle && (
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {page.subtitle}
            </p>
          )}
        </header>
      </div>

      <RenderBlocks
        blocks={page.sections}
        services={services}
        showcases={showcases}
        articles={articles}
      />
    </div>
  );
}
