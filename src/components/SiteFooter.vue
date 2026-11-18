<script setup>
import { features } from '../features.mjs';
import { products } from '../content.mjs';
defineEmits(['cookies']);
</script>
<template>
  <footer class="footer"><div class="wrap"><div class="footer-top"><a class="brand" href="/"><img class="brand-symbol" :src="'/assets/video-gift.svg'" alt="VideoVitannya" width="256" height="256"></a><p>Для тих, хто дарує<br>трохи більше, ніж подарунок.</p></div>
    <div class="footer-links"><div><span>Привітання</span><a v-for="p in products.filter(p => p.price !== null)" :key="p.id" :href="`/${p.slug}/`">{{ p.label }}</a></div><div><span>Сервіс</span><a href="/tsiny/">Ціни</a><a href="/pro-nas/">Про нас</a><a v-if="features.blogVisible" href="/blog/">Блог</a><a href="/kontakty/">Контакти</a></div><div><span>Важливе</span><a href="/oferta/">Публічна оферта</a><a href="/konfidentsiynist/">Конфіденційність</a><button class="text-button" @click="$emit('cookies')">Налаштування cookies</button></div></div>
    <div class="footer-bottom"><span>© 2026 Videovitannya</span><span>Особисті історії. Справжні емоції.</span><span>Зроблено для України</span></div>
  </div></footer>
</template>
