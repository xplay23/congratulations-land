"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Sparkles, Tag, User } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleCards } from "@/components/ArticleCards";
import type {
  CmsBlogCategoryItem,
  CmsBlogPostItem,
  CmsServiceItem,
} from "@/lib/cms-content";

export function BlogIndexView({
  categories,
  posts,
  hub,
  targetService,
}: {
  categories: CmsBlogCategoryItem[];
  posts: CmsBlogPostItem[];
  hub?: CmsBlogCategoryItem;
  targetService?: CmsServiceItem;
}) {
  const { lang, l } = useLanguage();
  const isUk = lang === "uk";

  return (
    <div className="space-y-10 pb-12">
      <div>
        <Breadcrumbs
          items={
            hub
              ? [{ label: "Блог", href: "/blog" }, { label: hub.label }]
              : [{ label: "Блог" }]
          }
        />

        <header className="space-y-3 rounded-3xl border border-amber-200/20 bg-gradient-to-br from-[#141f3f] to-[#0b1020] p-6 sm:p-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            {isUk ? "Трохи натхнення" : "Немного вдохновения"}
          </span>
          <h1 className="font-serif-book text-3xl font-bold text-amber-50 sm:text-4xl">
            {hub
              ? hub.h1
              : isUk
                ? "Блог про привітання та казки"
                : "Блог о поздравлениях и сказках"}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {hub
              ? hub.description
              : isUk
                ? "Ідеї, теплі слова й маленькі деталі, з яких починаються особисті подарунки для дітей та близьких."
                : "Идеи, тёплые слова и маленькие детали, с которых начинаются личные подарки для детей и близких."}
          </p>
        </header>
      </div>

      {/* Hub Filter Tabs */}
      <nav
        aria-label={isUk ? "Теми блогу" : "Темы блога"}
        className="flex flex-wrap gap-2"
      >
        <Link
          href={l("/blog")}
          className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
            !hub
              ? "border-amber-300 bg-amber-400 text-[#0b1020]"
              : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
          }`}
        >
          {isUk ? "Усі історії" : "Все истории"}
        </Link>
        {categories.map((h) => {
          const active = h.slug === hub?.slug;
          return (
            <Link
              key={h.slug}
              href={l(`/blog/${h.slug}`)}
              className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                active
                  ? "border-amber-300 bg-amber-400 text-[#0b1020]"
                  : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              {h.label}
            </Link>
          );
        })}
      </nav>

      {posts.length > 0 ? (
        <ArticleCards articles={posts} />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#121a30]/80 p-8 text-center space-y-3">
          <BookOpen className="mx-auto h-8 w-8 text-amber-300" />
          <h2 className="font-serif-book text-xl font-bold text-white">
            {isUk ? "Нові історії вже в роботі" : "Новые истории уже готовятся"}
          </h2>
          <p className="text-sm text-slate-300">
            {isUk
              ? "Готуємо добірку порад і прикладів для цієї теми."
              : "Готовим подборку советов и примеров для этой темы."}
          </p>
          <div className="pt-2">
            <Link
              href={l("/blog")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-amber-200"
            >
              {isUk
                ? "Переглянути опубліковані матеріали"
                : "Посмотреть опубликованные материалы"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {hub && targetService && (
        <section className="flex flex-col justify-between gap-4 rounded-3xl border border-amber-300/20 bg-gradient-to-r from-[#141f3f] to-[#101831] p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="space-y-1.5">
            <h2 className="font-serif-book text-xl font-bold text-amber-50 sm:text-2xl">
              {isUk
                ? "А якщо подарувати власну історію?"
                : "А если подарить собственную историю?"}
            </h2>
            <p className="text-sm text-slate-300">
              {targetService.shortDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              href={l(`/${targetService.slug}`)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              {targetService.label}
            </Link>
            {targetService.ctaOrderUrl && targetService.status === "active" && (
              <Link
                href={l(targetService.ctaOrderUrl)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-bold text-[#0b1020] transition hover:bg-amber-300"
              >
                {isUk ? "Замовити" : "Заказать"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export function BlogArticleView({
  article,
  hub,
  ctaService,
  otherArticles,
}: {
  article: CmsBlogPostItem;
  hub?: CmsBlogCategoryItem;
  ctaService?: CmsServiceItem;
  otherArticles: CmsBlogPostItem[];
}) {
  const { lang, l } = useLanguage();
  const isUk = lang === "uk";

  return (
    <div className="space-y-12 pb-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <Breadcrumbs
          items={[
            { label: "Блог", href: "/blog" },
            ...(hub ? [{ label: hub.label, href: `/blog/${hub.slug}` }] : []),
            { label: article.title },
          ]}
        />

        <header className="space-y-4 rounded-3xl border border-amber-200/20 bg-gradient-to-br from-[#141f3f] to-[#0b1020] p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-3 text-xs text-amber-300">
            <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 font-semibold">
              {hub?.label || article.hubLabel} · {article.readTime}
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              {isUk ? "Оновлено" : "Обновлено"} {article.publishedAt}
            </span>
            {article.authorName && (
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <User className="h-3.5 w-3.5" />
                {article.authorName}
              </span>
            )}
          </div>

          <h1 className="font-serif-book text-3xl font-bold leading-tight text-amber-50 sm:text-4xl">
            {article.title}
          </h1>

          {article.lead && (
            <p className="text-base leading-relaxed text-slate-200">
              {article.lead}
            </p>
          )}
        </header>

        {article.coverImageUrl && (
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}

        <div className="space-y-6 rounded-3xl border border-white/10 bg-[#121a30]/80 p-6 sm:p-9">
          {article.contentHtml ? (
            <div
              className="space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base [&_h2]:mt-6 [&_h2]:font-serif-book [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-amber-100 [&_h3]:mt-4 [&_h3]:font-serif-book [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-amber-50 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-amber-300/60 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-amber-100/90 [&_strong]:text-white [&_a]:text-amber-300 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />
          ) : (
            (article.sectionsFallback ?? []).map((section) => (
              <section key={section.title} className="space-y-2">
                <h2 className="font-serif-book text-xl font-bold text-amber-100">
                  {section.title}
                </h2>
                <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
                  {section.text}
                </p>
              </section>
            ))
          )}

          {article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
              <Tag className="h-3.5 w-3.5 text-amber-300" />
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {ctaService && (
          <aside className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-6 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <h2 className="font-serif-book text-xl font-bold text-amber-50">
                {ctaService.title}
              </h2>
              <p className="text-xs text-slate-200 sm:text-sm">
                {ctaService.shortDescription}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                href={l(`/${ctaService.slug}`)}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                {isUk ? "Детальніше" : "Подробнее"}
              </Link>
              {ctaService.ctaOrderUrl && ctaService.status === "active" && (
                <Link
                  href={l(ctaService.ctaOrderUrl)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-[#0b1020] transition hover:bg-amber-300"
                >
                  {isUk ? "Замовити" : "Заказать"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </aside>
        )}

        {hub && (
          <div>
            <Link
              href={l(`/blog/${hub.slug}`)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-amber-200"
            >
              {isUk
                ? `Усі матеріали розділу «${hub.label}»`
                : `Все материалы раздела «${hub.label}»`}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </article>

      {otherArticles.length > 0 && (
        <section className="space-y-5">
          <h2 className="font-serif-book text-2xl font-bold text-amber-50">
            {isUk ? "Ще трохи натхнення" : "Ещё немного вдохновения"}
          </h2>
          <ArticleCards articles={otherArticles} />
        </section>
      )}
    </div>
  );
}
