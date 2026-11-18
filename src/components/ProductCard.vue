<script setup>
import ProductImage from './ProductImage.vue';
import { PhArrowUpRight } from '@phosphor-icons/vue';
defineProps({ product: Object, featured: Boolean });
</script>
<template>
  <a class="product-card" :class="{ featured }" :href="'/' + product.slug + '/'">
    <div class="product-copy"><div class="product-meta"><span>{{ product.label }}</span><span>від {{ product.price }} грн</span></div><h3>{{ product.short }}</h3><PhArrowUpRight class="product-arrow" :size="24" weight="light" aria-hidden="true" /></div>
    <div class="card-art" :class="product.art"><ProductImage :product="product" /></div>
  </a>
</template>
