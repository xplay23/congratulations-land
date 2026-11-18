<script setup>
import { features } from '../features.mjs';
import { ref } from 'vue';
import { PhArrowRight, PhCaretDown, PhShieldCheck } from '@phosphor-icons/vue';
import { products, articles, defaultProductId } from '../content.mjs';
import { homeFaq } from '../seo.mjs';
import ProductCard from './ProductCard.vue';
import HowItWorks from './HowItWorks.vue';
import FaqSection from './FaqSection.vue';
import ArticleCards from './ArticleCards.vue';
import HeroVideo from './HeroVideo.vue';
import ResponsiveImage from './ResponsiveImage.vue';
const selected = ref(defaultProductId);
</script>

<template>
  <section class="home-hero hero-with-video">
    <HeroVideo />
    <div class="hero-shade"></div>
    <div class="hero-content wrap">
      <h1>Відеопривітання<br>на замовлення з іменем</h1>
      <p>Персональне відео, оживлене фото або пісня.<br class="desktop-break"> Ваша історія — подарунок для близької людини.</p>
      <form class="hero-order" action="/zamovlennya/" method="get">
        <div class="hero-select"><label for="hero-product" class="sr-only">Оберіть привітання</label><select id="hero-product" v-model="selected" name="product"><option v-for="p in products.filter(p => p.price !== null)" :key="p.id" :value="p.id">{{ p.label }}</option></select><PhCaretDown :size="16" aria-hidden="true" /></div>
        <button class="button primary" type="submit">Замовити <PhArrowRight :size="18" aria-hidden="true" /></button>
      </form>
    </div>
    <a href="#gifts" class="hero-discover" aria-label="Переглянути привітання"><PhCaretDown :size="22" weight="light" aria-hidden="true" /></a>
  </section>
  <section id="gifts" class="section wrap gifts-section">
    <div class="section-heading centered"><h2>Особистий подарунок.<br>Для кожної вашої людини.</h2><p>Оберіть, як привітати. Ім’я та ваша історія зроблять решту.</p></div>
    <div class="product-grid"><ProductCard v-for="(product, i) in products.filter(p => p.price !== null)" :key="product.id" :product="product" :featured="i < 2" /></div>
  </section>
  <section class="section wrap preview-story">
    <div class="story-copy"><h2>Спочатку побачити.<br>Потім подарувати.</h2><p>Перегляньте короткий фрагмент з іменем та вашим звертанням. Ви самі вирішуєте, чи замовляти повну версію.</p><p>Готове відео — без водяного знака. Його можна надіслати посиланням, навіть коли ви далеко.</p><a class="button ghost" href="/tsiny/">Переглянути ціни <PhArrowRight :size="18" aria-hidden="true" /></a></div>
    <figure class="story-photo"><ResponsiveImage base="/assets/christmas-photo" alt="Фотографія в дерев’яній рамці з червоною святковою стрічкою" /><figcaption>Те, що хочеться зберегти.</figcaption></figure>
  </section>
  <HowItWorks />
  <section class="privacy-strip wrap"><PhShieldCheck :size="36" weight="light" aria-hidden="true" /><div><h2>Особисте залишається особистим</h2><p>Ваші фото — лише для вашого замовлення. Жодної реклами з вашими знімками без згоди.</p></div><a href="/konfidentsiynist/" aria-label="Правила конфіденційності"><PhArrowRight :size="24" weight="light" aria-hidden="true" /></a></section>
  <FaqSection :items="homeFaq" />
  <section v-if="features.blogVisible" class="section wrap"><div class="section-heading"><h2>Трохи натхнення<br>для теплих слів.</h2><a class="text-link" href="/blog/">Усі матеріали <PhArrowRight :size="18" aria-hidden="true" /></a></div><ArticleCards :articles="articles" /></section>
  <section class="closing christmas-closing"><div class="wrap"><h2>Зробіть звичайну мить<br>особливою.</h2><p>Привітання, яке створене саме для вашої людини.</p><a class="button ghost" href="#gifts">Обрати привітання <PhArrowRight :size="18" aria-hidden="true" /></a></div></section>
</template>
