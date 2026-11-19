<script setup>
import { features } from '../features.mjs';
import { products, russianProductLabels } from '../content.mjs';
defineProps({ ru: Boolean });
defineEmits(['cookies']);
</script>
<template>
  <footer class="footer"><div class="wrap"><div class="footer-top"><a class="brand" href="/"><img class="brand-symbol" :src="'/assets/video-gift.svg'" alt="VideoVitannya" width="256" height="256"></a><p>{{ ru ? 'Для тех, кто дарит' : 'Для тих, хто дарує' }}<br>{{ ru ? 'чуть больше, чем подарок.' : 'трохи більше, ніж подарунок.' }}</p></div>
    <div class="footer-links"><div><span>{{ ru ? 'Поздравления' : 'Привітання' }}</span><a v-for="p in products.filter(p => p.price !== null)" :key="p.id" :href="ru && p.id === 'birthday' ? '/ru/den-rozhdeniya/' : `/${p.slug}/`">{{ ru ? russianProductLabels[p.id] : p.label }}</a></div><div><span>{{ ru ? 'Сервис' : 'Сервіс' }}</span><a href="/tsiny/">{{ ru ? 'Цены' : 'Ціни' }}</a><a href="/pro-nas/">{{ ru ? 'О нас' : 'Про нас' }}</a><a v-if="features.blogVisible" href="/blog/">Блог</a><a href="/kontakty/">{{ ru ? 'Контакты' : 'Контакти' }}</a></div><div><span>{{ ru ? 'Информация' : 'Важливе' }}</span><a href="/oferta/">{{ ru ? 'Публичная оферта' : 'Публічна оферта' }}</a><a href="/konfidentsiynist/">{{ ru ? 'Конфиденциальность' : 'Конфіденційність' }}</a><button class="text-button" @click="$emit('cookies')">{{ ru ? 'Настройки cookies' : 'Налаштування cookies' }}</button></div></div>
    <div class="footer-bottom"><span>© 2026 Videovitannya</span><span>{{ ru ? 'Личные истории. Настоящие эмоции.' : 'Особисті історії. Справжні емоції.' }}</span><span>{{ ru ? 'Сделано для Украины' : 'Зроблено для України' }}</span></div>
  </div></footer>
</template>
