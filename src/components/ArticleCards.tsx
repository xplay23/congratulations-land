"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { BLOG_HUBS, type BlogArticleItem } from "@/lib/site-content";
import type { CmsBlogPostItem } from "@/lib/cms-content";

type ArticleCardInput = CmsBlogPostItem | BlogArticleItem;

function normalizeCard(article: ArticleCardInput, lang: "uk" | "ru") {
  if ("hubSlug" in article) {
    return {
      slug: article.slug,
      hubSlug: article.hubSlug,
      hubLabel: article.hubLabel,
      readTime: article.readTime,
      title: article.title,
      lead: article.lead || article.excerpt,
    };
  }
  const hub = BLOG_HUBS.find((h) => h.slug === article.hub);
  return {
    slug: article.slug,
    hubSlug: article.hub,
    hubLabel: hub?.label[lang] || article.hub,
    readTime: article.readTime[lang],
    title: article.title[lang],
    lead: article.lead[lang],
  };
}

export function ArticleCards({ articles }: { articles: ArticleCardInput[] }) {
  const { lang, l } = useLanguage();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {articles.map((raw) => {
        const article = normalizeCard(raw, lang);
        return (
          <Link
            key={`${article.hubSlug}-${article.slug}`}
            href={l(`/blog/${article.hubSlug}/${article.slug}`)}
            className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#121a30]/80 p-6 transition hover:border-amber-300/40 hover:bg-[#151f38]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-amber-300">
                <span className="font-semibold">{article.hubLabel}</span>
                <span className="text-slate-400">{article.readTime}</span>
              </div>
              <h3 className="font-serif-book text-lg font-bold text-white transition group-hover:text-amber-100">
                {article.title}
              </h3>
              <p className="text-xs leading-relaxed text-slate-300">
                {article.lead}
              </p>
            </div>

            <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200">
              {lang === "uk" ? "Читати статтю" : "Читать статью"}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
