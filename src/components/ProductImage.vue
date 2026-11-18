<script setup>
import ResponsiveImage from './ResponsiveImage.vue';
defineProps({ product: Object, eager: Boolean });
</script>
<template>
  <ResponsiveImage :base="product.imageSet || product.image.replace(/\.webp$/, '')" :widths="product.imageSet ? [360, 640, 960, 1280] : [360, 640, 720]" :width="product.imageSet ? 1280 : 720" :height="product.imageSet ? 720 : 480" :alt="product.imageAlt" :eager="eager" :sizes="eager ? '(max-width: 640px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 64px), 540px' : '(max-width: 640px) calc(100vw - 64px), (max-width: 900px) calc(50vw - 56px), 540px'" />
</template>
