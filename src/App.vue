<script setup>
import ProductImage from './components/ProductImage.vue';
import { features } from './features.mjs';
import { computed, ref, defineAsyncComponent } from 'vue';
import { products, hubs, articles, articlePath } from './content.mjs';
import { metadata, priceFaq } from './seo.mjs';
import SiteHeader from './components/SiteHeader.vue';
import SiteFooter from './components/SiteFooter.vue';
import CookieConsent from './components/CookieConsent.vue';
import ProductCard from './components/ProductCard.vue';
import HowItWorks from './components/HowItWorks.vue';
import FaqSection from './components/FaqSection.vue';
import ArticleCards from './components/ArticleCards.vue';
const OrderForm = defineAsyncComponent(() => import('./components/OrderForm.vue'));
import HomePage from './components/HomePage.vue';
const props = defineProps({ path: String });
const page = computed(() => metadata(props.path));
const p = computed(() => page.value.product);
const relatedProducts = computed(() => p.value?.related
  ? p.value.related.map(id => products.find(product => product.id === id)).filter(Boolean)
  : products.filter(product => product.id !== p.value?.id && product.price !== null).slice(0, 3));
const cookies = ref(null);
const blogArticles = computed(() => page.value.hub ? articles.filter(a => a.hub === page.value.hub.slug) : articles);
const crumbs = computed(() => {
  const result = [{ label: 'Головна', href: '/' }];
  if (props.path.startsWith('/blog/') && props.path !== '/blog/') result.push({ label: 'Блог', href: '/blog/' });
  if (page.value.article) result.push({ label: hubs.find(h => h.slug === page.value.article.hub).label, href: `/blog/${page.value.article.hub}/` });
  result.push({ label: p.value?.label || page.value.h1 });
  return result;
});
</script>

<template>
  <div :class="path === '/' ? 'is-home' : 'inner-page'">
    <a class="skip-link" href="#main">До вмісту</a><SiteHeader :path="path" />
    <main id="main">
      <nav v-if="path !== '/'" class="breadcrumbs wrap" aria-label="Хлібні крихти"><ol><li v-for="(c, i) in crumbs" :key="i"><a v-if="c.href" :href="c.href">{{ c.label }}</a><span v-else aria-current="page">{{ c.label }}</span></li></ol></nav>

      <HomePage v-if="page.kind === 'home'" />

      <template v-else-if="page.kind === 'product'">
        <section class="product-hero wrap"><div><span class="eyebrow">{{ p.tag }}</span><h1>{{ p.h1 }}</h1><p class="lead">{{ p.intro }}</p><a v-if="!p.noindex" class="button primary" href="#order">{{ p.id === 'song' ? 'Замовити пісню' : 'Замовити відео' }} ↗</a><a v-else class="button ghost" href="/#gifts">Інші привітання ↗</a><div v-if="p.id === 'newyear'" class="hero-switch"><span>Дід Мороз / Санта</span><a href="/svyatyj-mykolaj/">Від Святого Миколая ↗</a></div><p class="hero-footnote">Без підписки. З увагою до вашої історії.</p></div><div id="example" class="example-card"><ProductImage :product="p" eager /><span class="example-label">Концепт атмосфери · не деморолик</span></div></section>
        <div v-if="!p.noindex" class="wrap section"><OrderForm :selected="p.id" /></div>
        <template v-if="p.sections">
          <template v-for="section in p.sections" :key="section.title">
            <HowItWorks v-if="section.steps" :title="section.title" :steps="section.steps" intro="" />
            <section v-else class="section wrap product-detail"><h2>{{ section.title }}</h2><p v-if="section.text || section.price"><template v-if="section.price">Від {{ p.price }} грн. </template>{{ section.text }}</p><template v-if="section.heroes"><p>Дід Мороз: традиційне привітання з рідною інтонацією.</p><p>Санта Клаус: яскраве привітання в новорічному стилі.</p><a class="text-link" href="#hero-choices">Обрати героя ↗</a></template><a v-if="section.price" class="text-link" href="/tsiny/">Переглянути всі ціни ↗</a></section>
          </template>
        </template>
        <section v-else class="section wrap product-detail"><h2>{{ p.detailTitle }}</h2><p>{{ p.detail }}</p></section>
        <FaqSection :items="p.faq" title="Питання та відповіді" />
        <section v-if="relatedProducts.length" class="section wrap"><div class="section-heading"><h2>Інші способи сказати «люблю»</h2><a class="text-link" href="/tsiny/">Усі ціни ↗</a></div><div class="related-products"><ProductCard v-for="product in relatedProducts" :key="product.id" :product="product" /></div></section>
        <section v-if="features.blogVisible" class="section wrap"><h2>Ідеї для вашого привітання</h2><ArticleCards :articles="articles" /></section>
      </template>

      <template v-else-if="page.kind === 'prices'">
        <section class="page-heading wrap"><span class="eyebrow">Лише те, що ви обрали</span><h1>{{ page.h1 }}</h1><p>Всі ціни — в одній таблиці. Підписки немає: платите лише за те, що замовили, після перегляду прев’ю.</p></section>
        <section class="wrap"><div class="price-table" role="table" aria-label="Ціни на привітання"><div class="price-row price-table-head" role="row"><span role="columnheader">Ваш подарунок</span><span role="columnheader">Вартість</span><span role="columnheader">Замовлення</span></div><div v-for="product in products.filter(p => p.price !== null)" :key="product.id" class="price-row" role="row"><div role="cell"><a :href="`/${product.slug}/`">{{ product.label }}</a><small>{{ product.id === 'birthday' ? 'Пакет: оживлене фото + пісня' : product.id === 'mykolay' ? 'Окреме привітання для дитини чи дорослого' : product.id === 'newyear' ? 'Одна дитина · двоє дітей — 599 грн' : product.id === 'photo' ? 'Коротке відео з однієї фотографії' : 'Особиста пісня з вашою історією' }}</small></div><span role="cell">{{ product.price }} грн</span><span role="cell"><a class="button ghost" :href="`/zamovlennya/?product=${product.id}`">Замовити ↗</a></span></div></div><p class="field-help">Стартові ціни. Оплата на цьому етапі розробки недоступна.</p></section>
        <section class="section wrap"><div class="section-heading"><h2>Що входить у ціну</h2><p class="muted">Один платіж за особистий подарунок.</p></div><div class="included"><span>Коротке прев’ю</span><span>Повна версія без водяного знака</span><span>Посилання для подарунка</span><span>Зберігання 12 місяців після запуску</span></div></section><FaqSection :items="priceFaq" />
      </template>

      <template v-else-if="page.kind === 'blog'">
        <section class="page-heading wrap"><span class="eyebrow">Трохи натхнення</span><h1>{{ page.h1 }}</h1><p>Ідеї, теплі слова й маленькі деталі, з яких починаються особисті подарунки.</p></section>
        <section class="wrap section"><nav class="blog-tabs" aria-label="Теми блогу"><a href="/blog/" :aria-current="!page.hub ? 'page' : undefined">Усі історії</a><a v-for="hub in hubs" :key="hub.slug" :href="`/blog/${hub.slug}/`" :aria-current="hub.slug === page.hub?.slug ? 'page' : undefined">{{ hub.label }}</a></nav><ArticleCards v-if="blogArticles.length" :articles="blogArticles" /><div v-else class="empty-state"><h2>Нові історії вже в роботі</h2><p>Готуємо поради та приклади для цієї теми.</p><a class="text-link" href="/blog/">Переглянути опубліковані матеріали ↗</a></div></section>
        <section v-if="page.hub" class="closing wrap"><h2>А якщо подарувати<br>власну історію?</h2><a class="button ghost" :href="`/${products.find(p => p.id === page.hub.product).slug}/`">{{ products.find(p => p.id === page.hub.product).label }} ↗</a></section>
      </template>

      <template v-else-if="page.kind === 'article'">
        <article class="article-body wrap"><span class="eyebrow">Святий Миколай · 3 хв читання</span><h1>{{ page.h1 }}</h1><div class="article-byline">Редакція Videovitannya <span>Оновлено <time datetime="2026-11-17">17 листопада 2026</time></span></div><p class="lead">{{ page.article.lead }}</p><template v-for="[title, text] in page.article.sections" :key="title"><h2>{{ title }}</h2><p>{{ text }}</p></template><aside class="article-cta"><h2>Нехай Миколай звернеться на ім’я</h2><p>Ім’я, добрі справи та ваше побажання — в особистому відео.</p><a class="button ghost" href="/svyatyj-mykolaj/">Замовити відео від Миколая ↗</a></aside><a class="text-link" :href="`/blog/${page.article.hub}/`">Усі матеріали про Миколая ↗</a></article><section class="section wrap"><h2>Ще трохи натхнення</h2><ArticleCards :articles="articles.filter(a => articlePath(a) !== path)" /></section>
      </template>

      <template v-else-if="page.kind === 'order'"><div class="page-heading wrap small-heading"><h1>{{ page.h1 }}</h1></div><div class="wrap"><OrderForm /></div></template>
      <article v-else-if="page.kind === 'document'" class="document wrap"><span class="eyebrow">Videovitannya</span><h1>{{ page.h1 }}</h1><template v-for="([title, text], i) in page.sections" :key="i"><h2 v-if="title">{{ title }}</h2><p>{{ text }}</p></template><button v-if="path === '/konfidentsiynist/'" class="button ghost" @click="cookies.show()">Налаштувати cookies</button><a v-else class="text-link" href="/#gifts">Оберіть ваше привітання ↗</a></article>
      <section v-else-if="page.kind === 'unavailable'" class="document wrap"><span class="eyebrow">Все особисте — в одному місці</span><h1>{{ page.h1 }}</h1><div class="empty-state"><h2>{{ path === '/kabinet/' ? 'Ваші подарунки будуть тут' : 'Готуємо сервіс до запуску' }}</h2><p>{{ path === '/kabinet/' ? 'Після запуску ви зможете входити за посиланням із пошти, переглядати статуси, завантажувати відео та видаляти свої дані.' : 'Генерація та оплата ще недоступні. Зараз можна перевірити демонстраційну форму замовлення.' }}</p><a class="button ghost" href="/#gifts">Переглянути привітання ↗</a></div></section>
      <section v-else class="document wrap error-page"><span class="eyebrow">404</span><h1>Сторінку не знайдено</h1><p>Ця історія ще не почалася. Але подарунок для близької людини — знайдемо.</p><a class="button primary" href="/">На головну ↗</a></section>
    </main>
    <SiteFooter @cookies="cookies.show()" /><CookieConsent ref="cookies" />
  </div>
</template>
