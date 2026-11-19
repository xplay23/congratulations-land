<script setup>
import ProductImage from './ProductImage.vue';
import { PhArrowUpRight } from '@phosphor-icons/vue';
import { russianProductLabels } from '../content.mjs';
defineProps({ product: Object, featured: Boolean, lang: String });
const russianDescriptions = { song: 'Именная песня с вашими пожеланиями.', photo: 'Короткое видео из любимой фотографии.', mykolay: 'Святой Николай поздравляет по имени.', newyear: 'Именное новогоднее видеопоздравление.' };
</script>
<template>
  <a class="product-card" :class="{ featured }" :href="'/' + product.slug + '/'">
    <div class="product-copy"><div class="product-meta"><span>{{ lang === 'ru' ? russianProductLabels[product.id] : product.label }}</span><span>{{ lang === 'ru' ? 'от' : 'від' }} {{ product.price }} грн</span></div><h3>{{ lang === 'ru' ? russianDescriptions[product.id] : product.short }}</h3><PhArrowUpRight class="product-arrow" :size="24" weight="light" aria-hidden="true" /></div>
    <div class="card-art" :class="product.art"><ProductImage :product="product" /></div>
  </a>
</template>
