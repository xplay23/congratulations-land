<script setup>
import { features } from '../features.mjs';
import { ref } from 'vue';
import { PhArrowRight, PhCaretDown, PhShieldCheck } from '@phosphor-icons/vue';
import { products, articles, defaultProductId, home } from '../content.mjs';
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
      <h1>{{ home.h1 }}</h1>
      <p>Персональне відео від Святого Миколая, іменна пісня чи оживлене фото. Вкажіть ім’я та побажання. Готове привітання прийде на вашу пошту.</p>
      <form class="hero-order" :action="selected === 'birthday' ? '/den-narodzhennya/#order' : '/zamovlennya/'" method="get">
        <div class="hero-select"><label for="hero-product" class="sr-only">Оберіть привітання</label><select id="hero-product" v-model="selected" name="product" aria-describedby="hero-order-caption"><option v-for="p in products.filter(p => p.price !== null)" :key="p.id" :value="p.id">{{ p.label }}</option></select><PhCaretDown :size="16" aria-hidden="true" /></div>
        <input v-if="selected === 'birthday'" type="hidden" name="occasion" value="birthday">
        <button class="button primary" type="submit">Замовити <PhArrowRight :size="18" aria-hidden="true" /></button>
      </form>
      <p id="hero-order-caption" class="hero-order-caption">Для дитини, мами, колеги чи друга</p>
    </div>
    <a href="#gifts" class="hero-discover" aria-label="Переглянути привітання"><PhCaretDown :size="22" weight="light" aria-hidden="true" /></a>
  </section>
  <section id="gifts" class="section wrap gifts-section">
    <div class="section-heading centered"><h2>Особистий подарунок.<br>Для кожної вашої людини.</h2><p>Оберіть привітання, у якому прозвучить ім'я та ваші слова. Кожне створюється під конкретну людину, а не з шаблонного списку.</p></div>
    <div class="product-grid"><ProductCard v-for="(product, i) in products.filter(p => p.price !== null)" :key="product.id" :product="product" :featured="i < 2" /></div>
  </section>
  <section class="section wrap preview-story">
    <div class="story-copy"><h2>Фото з вашою історією</h2><p>Знайдіть фотографію, яку любите обоє. Згадайте, де її зробили й що тоді відбувалося. Ці деталі допоможуть розповісти вашу історію в привітанні.</p><a class="button ghost" href="/tsiny/">Переглянути ціни <PhArrowRight :size="18" aria-hidden="true" /></a></div>
    <figure class="story-photo"><ResponsiveImage base="/assets/christmas-photo" alt="Фотографія в дерев’яній рамці з червоною святковою стрічкою" /></figure>
  </section>
  <HowItWorks />
  <section class="privacy-strip wrap"><PhShieldCheck :size="36" weight="light" aria-hidden="true" /><div><h2>Особисте залишається особистим</h2><p>Фото й тексти, які ви вказуєте в замовленні, використовуються лише для його виконання. Докладніше в політиці конфіденційності.</p></div><a href="/konfidentsiynist/" aria-label="Правила конфіденційності"><PhArrowRight :size="24" weight="light" aria-hidden="true" /></a></section>
  <section class="section wrap product-detail"><h2>Відео привітання на замовлення: для кого і коли</h2><p>Персональне відео привітання на замовлення добре підходить там, де звичайна листівка здається замалою. Святий Миколай привітає дитину по імені. Іменинник отримає відео з улюбленим фото та піснею. Старе фото бабусі чи дідуся можна оживити й показати родині на святі. Ви самі обираєте привід і слова, а ми перетворюємо їх на готове відео. Сервіс зручний, коли про подарунок згадали в останній момент: привітання готується приблизно 5 хвилин і приходить на пошту.</p></section>
  <FaqSection :items="homeFaq" />
  <section v-if="features.blogVisible" class="section wrap"><div class="section-heading"><h2>Трохи натхнення<br>для теплих слів.</h2><a class="text-link" href="/blog/">Усі матеріали <PhArrowRight :size="18" aria-hidden="true" /></a></div><ArticleCards :articles="articles" /></section>
  <section class="closing christmas-closing"><div class="wrap"><h2>Зробіть звичайну мить<br>особливою.</h2><p>Замовте відео привітання з іменем для людини, яка вам дорога.</p><a class="button ghost" href="#gifts">Обрати привітання <PhArrowRight :size="18" aria-hidden="true" /></a></div></section>
</template>
