import { getPayload } from "@engine/lib/payload";
import { buildLexicalFromSections } from "@/lib/lexical-render";
import { UI_TEXT } from "@/lib/i18n";
import {
  DEFAULT_AI_RATES_CONFIG,
  DEFAULT_PRICING_CONFIG,
} from "@/lib/pricing-defaults";
import {
  BLOG_ARTICLES,
  BLOG_HUBS,
  DEMO_STORYBOOKS,
  DEMO_VIDEOS,
  HOME_FAQ,
  LEGAL_PAGES,
  PRICE_FAQ,
  SERVICE_CATALOG,
} from "@/lib/site-content";
import { buildBaselinePricing } from "@/lib/settings";

const SEED_REVIEWS = [
  {
    serviceSlug: "svyatyj-mykolaj",
    rating: 5,
    publishedDate: "2026-11-12",
    sortOrder: 10,
    authorName: "Олена К.",
    authorLocation: "Київ · мама Андрійка (6 років)",
    quote:
      "Син просто завмер, коли Миколай назвав його по імені і показав його фото прямо в Книзі добрих справ! Потім ми вручили подарунок — емоції неймовірні.",
  },
  {
    serviceSlug: "kazka",
    rating: 5,
    publishedDate: "2026-11-15",
    sortOrder: 20,
    authorName: "Марина С.",
    authorLocation: "Львів · мама Миколки (5 років)",
    quote:
      "Замовляли іменну казку разом із нашим котиком Мухою. Дуже сподобалося, що можна переглянути текст і перші сторінки ще до оплати, а PDF одразу роздрукували у фотокнигу.",
  },
  {
    serviceSlug: "svyatyj-mykolaj",
    rating: 5,
    publishedDate: "2026-11-18",
    sortOrder: 30,
    authorName: "Игорь Т.",
    authorLocation: "Днепр · папа Софии (4 года)",
    quote:
      "Озвучка звучит очень тепло и естественно, без «роботизированного» акцента. Скачал HD-видео за минуту и сразу переслал в Telegram бабушке.",
  },
  {
    serviceSlug: "kazka",
    rating: 5,
    publishedDate: "2026-11-19",
    sortOrder: 40,
    authorName: "Наталья В.",
    authorLocation: "Одесса · мама Димы (7 лет)",
    quote:
      "Здорово, что фото ребёнка удаляется сразу после создания образа. Сын перечитывает свою сказку каждый вечер перед сном и показывает всем друзьям.",
  },
];

async function seedStageB() {
  console.log("[seed-stage-b] Starting Stage B migration seed...");
  const payload = await getPayload();
  const currentPricing = buildBaselinePricing();
  const currentRates = DEFAULT_AI_RATES_CONFIG;

  // ── 1. Services (+ FAQ block in extraBlocks) ───────────────────────────────
  const serviceIdBySlug = new Map<string, number | string>();

  for (let i = 0; i < SERVICE_CATALOG.length; i++) {
    const item = SERVICE_CATALOG[i];
    const pCfg = item.serviceId
      ? currentPricing.services[item.serviceId] ||
        DEFAULT_PRICING_CONFIG.services[item.serviceId]
      : undefined;

    const faqBlockUk =
      item.faq.length > 0
        ? [
            {
              blockType: "faq",
              heading: "Питання та відповіді",
              subtitle: "Щоб обрати подарунок було легко.",
              layout: "accordion",
              items: item.faq.map((f) => ({ question: f.q.uk, answer: f.a.uk })),
            },
          ]
        : [];
    const faqBlockRu =
      item.faq.length > 0
        ? [
            {
              blockType: "faq",
              heading: "Вопросы и ответы",
              subtitle: "Чтобы выбрать подарок было легко.",
              layout: "accordion",
              items: item.faq.map((f) => ({ question: f.q.ru, answer: f.a.ru })),
            },
          ]
        : [];

    const existing = await payload.find({
      collection: "services",
      where: { slug: { equals: item.slug } },
      locale: "uk",
      limit: 1,
      overrideAccess: true,
    });

    if (existing.docs.length > 0) {
      const doc = existing.docs[0] as unknown as {
        id: number | string;
        extraBlocks?: unknown[];
      };
      serviceIdBySlug.set(item.slug, doc.id);

      // Backfill FAQ into extraBlocks if empty
      if (
        (!Array.isArray(doc.extraBlocks) || doc.extraBlocks.length === 0) &&
        faqBlockUk.length > 0
      ) {
        await payload.update({
          collection: "services",
          id: doc.id,
          locale: "uk",
          context: { skipPricingSync: true },
          overrideAccess: true,
          data: { extraBlocks: faqBlockUk } as never,
        });
        await payload.update({
          collection: "services",
          id: doc.id,
          locale: "ru",
          context: { skipPricingSync: true },
          overrideAccess: true,
          data: { extraBlocks: faqBlockRu } as never,
        });
        console.log(`[seed-stage-b] Backfilled FAQ block on service: ${item.slug}`);
      } else {
        console.log(`[seed-stage-b] Service exists, skipping: ${item.slug}`);
      }
      continue;
    }

    const status = pCfg
      ? pCfg.enabled
        ? "active"
        : pCfg.comingSoon
          ? "coming_soon"
          : "hidden"
      : item.comingSoonDefault
        ? "coming_soon"
        : "active";

    const tiersUk = pCfg?.tiers
      ? Object.entries(pCfg.tiers).map(([key, priceUah]) => ({
          key,
          label:
            item.serviceId === "storybook"
              ? `${key} сторінок`
              : key === "single"
                ? "1 фото"
                : key === "pack_3"
                  ? "Пакет 3 фото"
                  : key,
          priceUah,
          isPopular: key === "6",
        }))
      : [];

    const tiersRu = pCfg?.tiers
      ? Object.entries(pCfg.tiers).map(([key, priceUah]) => ({
          key,
          label:
            item.serviceId === "storybook"
              ? `${key} страниц`
              : key === "single"
                ? "1 фото"
                : key === "pack_3"
                  ? "Пакет 3 фото"
                  : key,
          priceUah,
          isPopular: key === "6",
        }))
      : [];

    const created = await payload.create({
      collection: "services",
      locale: "uk",
      context: { skipPricingSync: true },
      overrideAccess: true,
      data: {
        slug: item.slug,
        serviceKey: item.serviceId ?? "custom",
        status,
        sortOrder: (i + 1) * 10,
        ctaOrderUrl: item.constructorHref || "",
        showcaseKind: item.showcaseKind ?? "none",
        fallbackImageUrl: item.previewImage,
        previewIsConcept: Boolean(item.previewIsConcept),
        basePriceUah: pCfg?.basePriceUah ?? item.fallbackPriceUah ?? 0,
        pricingTiers: tiersUk,
        title: pCfg?.title.uk || item.label.uk,
        label: item.label.uk,
        badge: pCfg?.badgeLabel?.uk || item.tag.uk,
        shortDescription: pCfg?.description.uk || item.short.uk,
        ctaLabel: pCfg?.ctaLabel?.uk || "Замовити",
        features: (pCfg?.features?.uk ?? []).map((text) => ({ text })),
        h1: item.h1.uk,
        intro: item.intro.uk,
        heroFootnote: item.heroFootnote.uk,
        sections: item.sections.map((s) => ({
          title: s.title.uk,
          text: s.text?.uk || "",
          steps: (s.steps?.uk ?? []).map((step) => ({ step })),
          includePriceNote: Boolean(s.includePriceNote),
          priceLink: Boolean(s.priceLink),
        })),
        extraBlocks: faqBlockUk,
        meta: {
          title: item.seoTitle.uk,
          description: item.seoDescription.uk,
        },
      } as never,
    });

    const createdTiers =
      (created as unknown as { pricingTiers?: Array<{ id?: string }> })
        .pricingTiers ?? [];
    const tiersRuWithIds = tiersRu.map((t, idx) => ({
      ...t,
      ...(createdTiers[idx]?.id ? { id: createdTiers[idx].id } : {}),
    }));

    await payload.update({
      collection: "services",
      id: created.id,
      locale: "ru",
      context: { skipPricingSync: true },
      overrideAccess: true,
      data: {
        pricingTiers: tiersRuWithIds,
        title: pCfg?.title.ru || item.label.ru,
        label: item.label.ru,
        badge: pCfg?.badgeLabel?.ru || item.tag.ru,
        shortDescription: pCfg?.description.ru || item.short.ru,
        ctaLabel: pCfg?.ctaLabel?.ru || "Заказать",
        features: (pCfg?.features?.ru ?? []).map((text) => ({ text })),
        h1: item.h1.ru,
        intro: item.intro.ru,
        heroFootnote: item.heroFootnote.ru,
        sections: item.sections.map((s) => ({
          title: s.title.ru,
          text: s.text?.ru || "",
          steps: (s.steps?.ru ?? []).map((step) => ({ step })),
          includePriceNote: Boolean(s.includePriceNote),
          priceLink: Boolean(s.priceLink),
        })),
        extraBlocks: faqBlockRu,
        meta: {
          title: item.seoTitle.ru,
          description: item.seoDescription.ru,
        },
      } as never,
    });

    serviceIdBySlug.set(item.slug, created.id);
    console.log(`[seed-stage-b] Created service: ${item.slug}`);
  }

  for (const item of SERVICE_CATALOG) {
    const id = serviceIdBySlug.get(item.slug);
    if (!id || !item.relatedSlugs.length) continue;
    const doc = (await payload.findByID({
      collection: "services",
      id,
      depth: 0,
      overrideAccess: true,
    })) as unknown as { relatedServices?: unknown[] };
    if (Array.isArray(doc.relatedServices) && doc.relatedServices.length > 0) {
      continue;
    }
    const relIds = item.relatedSlugs
      .map((s) => serviceIdBySlug.get(s))
      .filter((v): v is number | string => v !== undefined);
    if (relIds.length > 0) {
      await payload.update({
        collection: "services",
        id,
        context: { skipPricingSync: true },
        overrideAccess: true,
        data: { relatedServices: relIds } as never,
      });
    }
  }

  // ── 2. ServiceVariations ───────────────────────────────────────────────────
  const nikolaiId = serviceIdBySlug.get("svyatyj-mykolaj");
  let defaultVariationId: number | string | undefined;

  if (nikolaiId) {
    const existingVar = await payload.find({
      collection: "service-variations",
      where: { variationSlug: { equals: "st-nicholas-room" } },
      limit: 1,
      overrideAccess: true,
    });
    if (existingVar.docs.length > 0) {
      defaultVariationId = existingVar.docs[0].id;
    } else {
      const created = await payload.create({
        collection: "service-variations",
        locale: "uk",
        overrideAccess: true,
        data: {
          service: nikolaiId,
          variationSlug: "st-nicholas-room",
          enabled: true,
          isDefault: true,
          sortOrder: 10,
          title: "Святий Миколай у казковій резиденції",
          shortBadge: "Класичний сюжет · ~47 с",
          description:
            "Затишна зимова кімната з каміном, ялинкою та Книгою добрих справ, де з’являється фото отримувача.",
          fallbackPosterUrl: "/samples/nicholas_preview.jpg",
          demoVideoUrl: "/samples/demo_video_uk.mp4",
          pipelineTemplateId: "st_nicholas_room",
        } as never,
      });
      await payload.update({
        collection: "service-variations",
        id: created.id,
        locale: "ru",
        overrideAccess: true,
        data: {
          title: "Святой Николай в сказочной резиденции",
          shortBadge: "Классический сюжет · ~47 с",
          description:
            "Уютная зимняя резиденция с камином, ёлкой и Книгой добрых дел, на странице которой появляется фото получателя.",
        } as never,
      });
      defaultVariationId = created.id;
      console.log("[seed-stage-b] Created variation: st-nicholas-room");
    }
  }

  // ── 3. Showcases ───────────────────────────────────────────────────────────
  for (let i = 0; i < DEMO_VIDEOS.length; i++) {
    const v = DEMO_VIDEOS[i];
    const slug = `demo-video-${v.id}`;
    const existing = await payload.find({
      collection: "showcases",
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs.length > 0) continue;

    const created = await payload.create({
      collection: "showcases",
      locale: "uk",
      overrideAccess: true,
      data: {
        slug,
        kind: "video",
        demoLang: v.lang,
        service: nikolaiId,
        serviceVariation: defaultVariationId,
        featuredOnHome: true,
        sortOrder: (i + 1) * 10,
        title: `Відео від Миколая (${v.recipientName}, ${v.age})`,
        label: v.label.uk,
        audienceNote: v.audienceNote.uk,
        recipientName: v.recipientName,
        age: v.age,
        achievement: v.achievement,
        duration: v.duration,
        mediaUrl: v.videoUrl,
        posterUrl: v.posterUrl,
      } as never,
    });
    await payload.update({
      collection: "showcases",
      id: created.id,
      locale: "ru",
      overrideAccess: true,
      data: {
        title: `Видео от Николая (${v.recipientName}, ${v.age})`,
        label: v.label.ru,
        audienceNote: v.audienceNote.ru,
      } as never,
    });
    console.log(`[seed-stage-b] Created showcase: ${slug}`);
  }

  const kazkaId = serviceIdBySlug.get("kazka");
  for (let i = 0; i < DEMO_STORYBOOKS.length; i++) {
    const sb = DEMO_STORYBOOKS[i];
    const slug = `demo-storybook-${sb.id}`;
    const existing = await payload.find({
      collection: "showcases",
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs.length > 0) continue;

    const created = await payload.create({
      collection: "showcases",
      locale: "uk",
      overrideAccess: true,
      data: {
        slug,
        kind: "storybook_pdf",
        demoLang: sb.lang,
        service: kazkaId,
        featuredOnHome: true,
        sortOrder: 30 + i * 10,
        title: sb.title,
        subtitle: sb.subtitle,
        badge: sb.badge.uk,
        label: sb.badge.uk,
        recipientName: sb.childName,
        age: sb.ageGroup,
        artStyle: sb.artStyle,
        layoutMode: sb.layoutMode,
        companionLabel: sb.companionLabel || "",
        mediaUrl: sb.pdfUrl,
        posterUrl: sb.coverImage,
      } as never,
    });
    await payload.update({
      collection: "showcases",
      id: created.id,
      locale: "ru",
      overrideAccess: true,
      data: {
        title: sb.title,
        subtitle: sb.subtitle,
        badge: sb.badge.ru,
        label: sb.badge.ru,
      } as never,
    });
    console.log(`[seed-stage-b] Created showcase: ${slug}`);
  }

  // ── 4. Reviews (unlocalized, original author language) ─────────────────────
  const existingReviews = await payload.find({
    collection: "reviews",
    limit: 20,
    overrideAccess: true,
  });
  const hasPopulatedReview = (
    existingReviews.docs as unknown as Array<{ authorName?: string }>
  ).some((r) => Boolean(r.authorName?.trim()));

  if (!hasPopulatedReview) {
    // Clean any empty leftover rows from schema transition
    for (const row of existingReviews.docs) {
      await payload.delete({
        collection: "reviews",
        id: row.id,
        overrideAccess: true,
      });
    }
    for (const r of SEED_REVIEWS) {
      await payload.create({
        collection: "reviews",
        overrideAccess: true,
        data: {
          reviewType: "text",
          authorName: r.authorName,
          authorLocation: r.authorLocation,
          quote: r.quote,
          rating: r.rating,
          service: serviceIdBySlug.get(r.serviceSlug),
          publishedDate: r.publishedDate,
          sortOrder: r.sortOrder,
        } as never,
      });
    }
    console.log(`[seed-stage-b] Seeded ${SEED_REVIEWS.length} original-language reviews.`);
  } else {
    console.log("[seed-stage-b] Reviews exist, skipping.");
  }

  // ── 5. Authors ─────────────────────────────────────────────────────────────
  let defaultAuthorId: number | string | undefined;
  const existingAuthors = await payload.find({
    collection: "authors",
    limit: 1,
    overrideAccess: true,
  });
  if (existingAuthors.docs.length > 0) {
    defaultAuthorId = existingAuthors.docs[0].id;
  } else {
    const author = await payload.create({
      collection: "authors",
      locale: "uk",
      overrideAccess: true,
      data: {
        name: "Редакція VideoVitannya",
        role: "Команда сервісу персональних подарунків",
        bio: "Пишемо теплі поради для батьків про вибір персональних привітань, казок і святкових сюрпризів.",
      } as never,
    });
    await payload.update({
      collection: "authors",
      id: author.id,
      locale: "ru",
      overrideAccess: true,
      data: {
        name: "Редакция VideoVitannya",
        role: "Команда сервиса персональных подарков",
        bio: "Пишем тёплые советы для родителей о выборе персональных поздравлений, сказок и праздничных сюрпризов.",
      } as never,
    });
    defaultAuthorId = author.id;
  }

  // ── 6. PostCategories & Posts ──────────────────────────────────────────────
  const catIdBySlug = new Map<string, number | string>();
  for (let i = 0; i < BLOG_HUBS.length; i++) {
    const h = BLOG_HUBS[i];
    const existing = await payload.find({
      collection: "post-categories",
      where: { slug: { equals: h.slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs.length > 0) {
      catIdBySlug.set(h.slug, existing.docs[0].id);
      continue;
    }

    const created = await payload.create({
      collection: "post-categories",
      locale: "uk",
      overrideAccess: true,
      data: {
        slug: h.slug,
        label: h.label.uk,
        title: h.title.uk,
        h1: h.h1.uk,
        description: h.description.uk,
        targetService: serviceIdBySlug.get(h.targetServiceSlug),
        sortOrder: (i + 1) * 10,
      } as never,
    });
    await payload.update({
      collection: "post-categories",
      id: created.id,
      locale: "ru",
      overrideAccess: true,
      data: {
        label: h.label.ru,
        title: h.title.ru,
        h1: h.h1.ru,
        description: h.description.ru,
      } as never,
    });
    catIdBySlug.set(h.slug, created.id);
  }

  for (const a of BLOG_ARTICLES) {
    const existing = await payload.find({
      collection: "posts",
      where: { slug: { equals: a.slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs.length > 0) continue;
    const categoryId = catIdBySlug.get(a.hub);
    if (!categoryId) continue;

    const created = await payload.create({
      collection: "posts",
      locale: "uk",
      overrideAccess: true,
      data: {
        slug: a.slug,
        status: "published",
        category: categoryId,
        author: defaultAuthorId,
        ctaService: serviceIdBySlug.get(a.ctaServiceSlug),
        publishedAt: a.updatedAt,
        readTime: a.readTime.uk,
        title: a.title.uk,
        excerpt: a.description.uk,
        lead: a.lead.uk,
        content: buildLexicalFromSections(
          a.sections.map((s) => ({ title: s.title.uk, text: s.text.uk }))
        ),
        tags: [
          { tag: "святий миколай" },
          { tag: "відеопривітання" },
          { tag: "подарунок" },
        ],
        meta: {
          title: `${a.title.uk} | VideoVitannya`,
          description: a.description.uk,
        },
      } as never,
    });

    await payload.update({
      collection: "posts",
      id: created.id,
      locale: "ru",
      overrideAccess: true,
      data: {
        readTime: a.readTime.ru,
        title: a.title.ru,
        excerpt: a.description.ru,
        lead: a.lead.ru,
        content: buildLexicalFromSections(
          a.sections.map((s) => ({ title: s.title.ru, text: s.text.ru }))
        ),
        meta: {
          title: `${a.title.ru} | VideoVitannya`,
          description: a.description.ru,
        },
      } as never,
    });
  }

  // ── 7. HomeTemplate (mandatory non-deletable home page) ────────────────────
  const homeCur = (await payload.findGlobal({
    slug: "home-template",
    locale: "uk",
    overrideAccess: true,
  })) as unknown as { sections?: unknown[] };

  if (!Array.isArray(homeCur.sections) || homeCur.sections.length === 0) {
    const homeSectionsUk = [
      {
        blockType: "hero",
        badge: "Україна • UA / RU • Plata by mono",
        heading: UI_TEXT.uk.heroTitle,
        subtitle: UI_TEXT.uk.heroSub,
        showQuickPicker: true,
      },
      {
        blockType: "live-demos",
        eyebrow: "Живі приклади готових замовлень",
        heading: "Подивіться й послухайте перед замовленням",
        defaultTab: "video",
      },
      {
        blockType: "services-catalog",
        heading: "Особистий подарунок. Для кожної вашої людини.",
        subtitle:
          "Оберіть привітання, у якому прозвучить ім’я та ваші слова. Можна переглянути детальний опис або одразу перейти у конструктор.",
        showUpcoming: true,
      },
      {
        blockType: "steps",
        heading: UI_TEXT.uk.howItWorks,
        columns: "4",
        steps: UI_TEXT.uk.steps.map((s) => ({
          title: s.title,
          description: s.desc,
        })),
      },
      {
        blockType: "privacy-trust",
        title: "Особисте залишається особистим",
        text: "Усі завантажені фото очищуються від EXIF/GPS-метаданих перед обробкою, а вихідні знімки автоматично видаляються з сервера одразу після створення книжкового образу героя або відео.",
        href: "/konfidentsiynist",
      },
      {
        blockType: "text",
        heading: "Персональні відео привітання та казки на замовлення: для кого і коли",
        content: buildLexicalFromSections([
          {
            text: "Персональне привітання або книга на замовлення чудово підходять там, де звичайної листівки замало. Святий Миколай звернеться до дитини чи дорослого по імені й покаже фото у Книзі добрих справ. Ілюстрована казка PDF перетворить дитину на головного героя власної пригоди. Ви самі задаєте деталі — ім’я, досягнення чи сюжет і стиль ілюстрацій — а перед оплатою завжди бачите реальне прев’ю.",
          },
        ]),
        showCookieSettingsButton: false,
      },
      {
        blockType: "reviews",
        eyebrow: "Живі враження батьків",
        heading: "Відгуки про VideoVitannya",
        mode: "all",
        limit: 4,
      },
      {
        blockType: "faq",
        heading: "Питання та відповіді",
        subtitle: "Щоб обрати подарунок було легко.",
        layout: "accordion",
        items: HOME_FAQ.map((f) => ({ question: f.q.uk, answer: f.a.uk })),
      },
      {
        blockType: "blog-grid",
        heading: "Трохи натхнення для теплих слів",
        viewAllLabel: "Усі матеріали",
        limit: 3,
      },
      {
        blockType: "cta",
        heading: "Зробіть звичайну мить особливою.",
        subtitle:
          "Замовте персональне відео привітання або казку з іменем для людини, яка вам дорога.",
        buttonLabel: "Обрати привітання",
        buttonHref: "#gifts",
      },
    ];

    const homeSectionsRu = [
      {
        blockType: "hero",
        badge: "Украина • UA / RU • Plata by mono",
        heading: UI_TEXT.ru.heroTitle,
        subtitle: UI_TEXT.ru.heroSub,
        showQuickPicker: true,
      },
      {
        blockType: "live-demos",
        eyebrow: "Живые примеры готовых заказов",
        heading: "Посмотрите и послушайте перед заказом",
        defaultTab: "video",
      },
      {
        blockType: "services-catalog",
        heading: "Личный подарок. Для каждого дорогого человека.",
        subtitle:
          "Выберите поздравление, в котором прозвучит имя и ваши слова. Можно изучить подробное описание или сразу перейти в конструктор.",
        showUpcoming: true,
      },
      {
        blockType: "steps",
        heading: UI_TEXT.ru.howItWorks,
        columns: "4",
        steps: UI_TEXT.ru.steps.map((s) => ({
          title: s.title,
          description: s.desc,
        })),
      },
      {
        blockType: "privacy-trust",
        title: "Личное остаётся личным",
        text: "Все загруженные фото очищаются от EXIF/GPS-метаданных перед обработкой, а исходные снимки автоматически удаляются с сервера сразу после создания книжного образа героя или видео.",
        href: "/konfidentsiynist",
      },
      {
        blockType: "text",
        heading: "Персональные видеопоздравления и сказки на заказ: для кого и когда",
        content: buildLexicalFromSections([
          {
            text: "Персональное видеопоздравление или сказка на заказ идеально подходят там, где обычной открытки недостаточно. Святой Николай обратится к ребёнку или взрослому по имени и покажет фото в Книге добрых дел. Иллюстрированная сказка PDF сделает ребёнка главным героем настоящего приключения. Вы сами задаёте детали — имя, достижение или сюжет и стиль иллюстраций — и всегда видите реальное превью до оплаты.",
          },
        ]),
        showCookieSettingsButton: false,
      },
      {
        blockType: "reviews",
        eyebrow: "Живые впечатления родителей",
        heading: "Отзывы о VideoVitannya",
        mode: "all",
        limit: 4,
      },
      {
        blockType: "faq",
        heading: "Вопросы и ответы",
        subtitle: "Чтобы выбрать подарок было легко.",
        layout: "accordion",
        items: HOME_FAQ.map((f) => ({ question: f.q.ru, answer: f.a.ru })),
      },
      {
        blockType: "blog-grid",
        heading: "Немного вдохновения для тёплых слов",
        viewAllLabel: "Все материалы",
        limit: 3,
      },
      {
        blockType: "cta",
        heading: "Сделайте обычный момент особенным.",
        subtitle:
          "Закажите персональное видеопоздравление или сказку с именем для человека, который вам дорог.",
        buttonLabel: "Выбрать поздравление",
        buttonHref: "#gifts",
      },
    ];

    await payload.updateGlobal({
      slug: "home-template",
      locale: "uk",
      overrideAccess: true,
      data: {
        sections: homeSectionsUk,
        meta: {
          title: "VideoVitannya — Персональні відеопривітання та казки PDF",
          description:
            "Платформа персоналізованих цифрових подарунків для дітей і дорослих: іменні відео від Святого Миколая та ілюстровані казки в PDF.",
        },
      } as never,
    });
    await payload.updateGlobal({
      slug: "home-template",
      locale: "ru",
      overrideAccess: true,
      data: {
        sections: homeSectionsRu,
        meta: {
          title: "VideoVitannya — Персональные видеопоздравления и сказки PDF",
          description:
            "Платформа персонализированных цифровых подарков для детей и взрослых: именные видео от Святого Николая и иллюстрированные сказки в PDF.",
        },
      } as never,
    });
    console.log("[seed-stage-b] Seeded HomeTemplate (UA/RU).");
  }

  // ── 8. Pages (tsiny + legal pages built on blocks) ─────────────────────────
  const existingTsiny = await payload.find({
    collection: "pages",
    where: { slug: { equals: "tsiny" } },
    limit: 1,
    overrideAccess: true,
  });
  if (existingTsiny.docs.length === 0) {
    const created = await payload.create({
      collection: "pages",
      locale: "uk",
      overrideAccess: true,
      data: {
        slug: "tsiny",
        status: "published",
        title: "Ціни",
        eyebrow: "Лише те, що ви обрали",
        h1: "Ціни на іменні казки, відео привітання та майбутні формати",
        subtitle:
          "У таблиці вказано разову вартість одного замовлення без підписок. Спочатку ви переглядаєте прев’ю, і лише потім оплачуєте через Plata by mono.",
        sections: [
          {
            blockType: "pricing-table",
            includedHeading: "Що входить у ціну",
            includedSubtitle:
              "Один разовий платіж за готовий персональний подарунок.",
            includedBullets: [
              { text: "Повна версія без водяного знака" },
              { text: "Зручна доставка на Email і в Telegram" },
              { text: "Зберігання файлів у кабінеті 30 днів" },
            ],
          },
          {
            blockType: "faq",
            heading: "Питання про оплату та ціни",
            subtitle: "Чесні умови без підписок і прихованих платежів.",
            layout: "accordion",
            items: PRICE_FAQ.map((f) => ({ question: f.q.uk, answer: f.a.uk })),
          },
        ],
        meta: {
          title:
            "Ціни на відеопривітання від Святого Миколая та іменні казки PDF | VideoVitannya",
          description:
            "Актуальні ціни на персональні відеопривітання від Святого Миколая та ілюстровані казки PDF. Разова оплата без підписки з прев’ю до оплати.",
        },
      } as never,
    });
    await payload.update({
      collection: "pages",
      id: created.id,
      locale: "ru",
      overrideAccess: true,
      data: {
        title: "Цены",
        eyebrow: "Только то, что вы выбрали",
        h1: "Цены на именные сказки, видеопоздравления и будущие форматы",
        subtitle:
          "В таблице указана разовая стоимость одного заказа без подписок. Сначала вы смотрите превью, и только потом оплачиваете через Plata by mono.",
        sections: [
          {
            blockType: "pricing-table",
            includedHeading: "Что входит в цену",
            includedSubtitle:
              "Один разовый платёж за готовый персональный подарок.",
            includedBullets: [
              { text: "Полная версия без водяного знака" },
              { text: "Удобная доставка на Email и в Telegram" },
              { text: "Хранение файлов в кабинете 30 дней" },
            ],
          },
          {
            blockType: "faq",
            heading: "Вопросы об оплате и ценах",
            subtitle: "Честные условия без подписок и скрытых платежей.",
            layout: "accordion",
            items: PRICE_FAQ.map((f) => ({ question: f.q.ru, answer: f.a.ru })),
          },
        ],
        meta: {
          title:
            "Цены на видеопоздравления от Святого Николая и именные сказки PDF | VideoVitannya",
          description:
            "Актуальные цены на персональные видеопоздравления от Святого Николая и иллюстрированные сказки PDF. Разовая оплата без подписки с превью до оплаты.",
        },
      } as never,
    });
    console.log("[seed-stage-b] Created page: tsiny");
  }

  for (const doc of Object.values(LEGAL_PAGES)) {
    const existing = await payload.find({
      collection: "pages",
      where: { slug: { equals: doc.slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs.length > 0) continue;

    const created = await payload.create({
      collection: "pages",
      locale: "uk",
      overrideAccess: true,
      data: {
        slug: doc.slug,
        status: "published",
        title: doc.h1.uk,
        eyebrow: doc.eyebrow.uk,
        h1: doc.h1.uk,
        subtitle: doc.description.uk,
        sections: [
          {
            blockType: "text",
            content: buildLexicalFromSections(
              doc.sections.map((s) => ({
                title: s.title?.uk,
                text: s.text.uk,
              }))
            ),
            showCookieSettingsButton: doc.slug === "konfidentsiynist",
          },
        ],
        meta: {
          title: doc.title.uk,
          description: doc.description.uk,
        },
      } as never,
    });
    await payload.update({
      collection: "pages",
      id: created.id,
      locale: "ru",
      overrideAccess: true,
      data: {
        title: doc.h1.ru,
        eyebrow: doc.eyebrow.ru,
        h1: doc.h1.ru,
        subtitle: doc.description.ru,
        sections: [
          {
            blockType: "text",
            content: buildLexicalFromSections(
              doc.sections.map((s) => ({
                title: s.title?.ru,
                text: s.text.ru,
              }))
            ),
            showCookieSettingsButton: doc.slug === "konfidentsiynist",
          },
        ],
        meta: {
          title: doc.title.ru,
          description: doc.description.ru,
        },
      } as never,
    });
    console.log(`[seed-stage-b] Created page: ${doc.slug}`);
  }

  // ── 9. HeaderNav, FooterNav, AiEconomics ───────────────────────────────────
  const headerCur = (await payload.findGlobal({
    slug: "header-nav",
    locale: "uk",
    overrideAccess: true,
  })) as unknown as { items?: unknown[] };
  if (!Array.isArray(headerCur.items) || headerCur.items.length === 0) {
    const headerItemsUk = [
      { label: "Головна", href: "/", icon: "none", serviceKey: "none", openInNewTab: false },
      { label: "Відео від Миколая", href: "/svyatyj-mykolaj", icon: "video", serviceKey: "video", openInNewTab: false },
      { label: "Створити казку", href: "/kazka", icon: "book", serviceKey: "storybook", openInNewTab: false },
      { label: "Ціни", href: "/tsiny", icon: "none", serviceKey: "none", openInNewTab: false },
      { label: "Блог", href: "/blog", icon: "none", serviceKey: "none", openInNewTab: false },
      { label: "Мої замовлення", href: "/my-orders", icon: "orders", serviceKey: "none", openInNewTab: false },
    ];
    const headerItemsRu = [
      { label: "Главная", href: "/", icon: "none", serviceKey: "none", openInNewTab: false },
      { label: "Видео от Николая", href: "/svyatyj-mykolaj", icon: "video", serviceKey: "video", openInNewTab: false },
      { label: "Создать сказку", href: "/kazka", icon: "book", serviceKey: "storybook", openInNewTab: false },
      { label: "Цены", href: "/tsiny", icon: "none", serviceKey: "none", openInNewTab: false },
      { label: "Блог", href: "/blog", icon: "none", serviceKey: "none", openInNewTab: false },
      { label: "Мои заказы", href: "/my-orders", icon: "orders", serviceKey: "none", openInNewTab: false },
    ];
    const saved = (await payload.updateGlobal({
      slug: "header-nav",
      locale: "uk",
      overrideAccess: true,
      data: { items: headerItemsUk } as never,
    })) as unknown as { items?: Array<{ id?: string }> };
    await payload.updateGlobal({
      slug: "header-nav",
      locale: "ru",
      overrideAccess: true,
      data: {
        items: headerItemsRu.map((it, idx) => ({
          ...it,
          ...(saved.items?.[idx]?.id ? { id: saved.items[idx].id } : {}),
        })),
      } as never,
    });
  }

  const footerCur = (await payload.findGlobal({
    slug: "footer-nav",
    locale: "uk",
    overrideAccess: true,
  })) as unknown as { columns?: unknown[] };
  if (!Array.isArray(footerCur.columns) || footerCur.columns.length === 0) {
    const footerServices = SERVICE_CATALOG.filter(
      (s) => s.slug !== "novyj-rik" && s.slug !== "multfilm-pro-dytynu"
    );
    const savedFooter = (await payload.updateGlobal({
      slug: "footer-nav",
      locale: "uk",
      overrideAccess: true,
      data: {
        columns: [
          {
            heading: "Послуги",
            links: footerServices.map((s) => ({
              label: s.label.uk,
              href: `/${s.slug}`,
              openInNewTab: false,
            })),
          },
          {
            heading: "Сервіс",
            links: [
              { label: "Ціни", href: "/tsiny", openInNewTab: false },
              { label: "Мої замовлення", href: "/my-orders", openInNewTab: false },
              { label: "Про нас", href: "/pro-nas", openInNewTab: false },
              { label: "Блог", href: "/blog", openInNewTab: false },
              { label: "Контакти", href: "/kontakty", openInNewTab: false },
            ],
          },
        ],
        legalLinks: [
          { label: "Публічна оферта", href: "/oferta" },
          { label: "Конфіденційність", href: "/konfidentsiynist" },
        ],
      } as never,
    })) as unknown as {
      columns?: Array<{ id?: string; links?: Array<{ id?: string }> }>;
      legalLinks?: Array<{ id?: string }>;
    };

    await payload.updateGlobal({
      slug: "footer-nav",
      locale: "ru",
      overrideAccess: true,
      data: {
        columns: [
          {
            id: savedFooter.columns?.[0]?.id,
            heading: "Услуги",
            links: footerServices.map((s, idx) => ({
              id: savedFooter.columns?.[0]?.links?.[idx]?.id,
              label: s.label.ru,
              href: `/${s.slug}`,
              openInNewTab: false,
            })),
          },
          {
            id: savedFooter.columns?.[1]?.id,
            heading: "Сервис",
            links: [
              { id: savedFooter.columns?.[1]?.links?.[0]?.id, label: "Цены", href: "/tsiny", openInNewTab: false },
              { id: savedFooter.columns?.[1]?.links?.[1]?.id, label: "Мои заказы", href: "/my-orders", openInNewTab: false },
              { id: savedFooter.columns?.[1]?.links?.[2]?.id, label: "О нас", href: "/pro-nas", openInNewTab: false },
              { id: savedFooter.columns?.[1]?.links?.[3]?.id, label: "Блог", href: "/blog", openInNewTab: false },
              { id: savedFooter.columns?.[1]?.links?.[4]?.id, label: "Контакты", href: "/kontakty", openInNewTab: false },
            ],
          },
        ],
        legalLinks: [
          { id: savedFooter.legalLinks?.[0]?.id, label: "Публичная оферта", href: "/oferta" },
          { id: savedFooter.legalLinks?.[1]?.id, label: "Конфиденциальность", href: "/konfidentsiynist" },
        ],
      } as never,
    });
  }

  const econCur = (await payload.findGlobal({
    slug: "ai-economics",
    overrideAccess: true,
  })) as unknown as { textModelRates?: unknown[] };
  if (!Array.isArray(econCur.textModelRates) || econCur.textModelRates.length === 0) {
    const rates = currentRates || DEFAULT_AI_RATES_CONFIG;
    await payload.updateGlobal({
      slug: "ai-economics",
      overrideAccess: true,
      data: {
        usdToUah: rates.usdToUah,
        elevenLabsPer1kCharsUsd: rates.elevenLabsPer1kCharsUsd,
        textModelRates: Object.entries(rates.textModels).map(([modelId, r]) => ({
          modelId,
          inputPer1M: r.inputPer1M,
          outputPer1M: r.outputPer1M,
        })),
        imageRates: Object.entries(rates.imagePerCallUsd).map(([key, priceUsd]) => ({
          key,
          priceUsd,
        })),
      } as never,
    });
  }

  console.log("[seed-stage-b] Completed successfully!");
  process.exit(0);
}

seedStageB().catch((err) => {
  console.error("[seed-stage-b] Failed:", err);
  process.exit(1);
});
