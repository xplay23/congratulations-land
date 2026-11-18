<script setup>
const props = defineProps({
  base: String, alt: { type: String, default: '' },
  widths: { type: Array, default: () => [360, 640, 720] },
  width: { type: Number, default: 720 }, height: { type: Number, default: 480 },
  sizes: { type: String, default: '(max-width: 640px) calc(100vw - 40px), 560px' },
  eager: Boolean
});
const srcset = format => props.widths.map(w => `${props.base}-${w}.${format} ${w}w`).join(', ');
</script>
<template>
  <picture>
    <source type="image/avif" :srcset="srcset('avif')" :sizes="sizes">
    <source type="image/webp" :srcset="srcset('webp')" :sizes="sizes">
    <img :src="`${base}-${width}.jpg`" :srcset="srcset('jpg')" :sizes="sizes" :width="width" :height="height" :alt="alt" :loading="eager ? 'eager' : 'lazy'" :fetchpriority="eager ? 'high' : 'auto'" decoding="async">
  </picture>
</template>
