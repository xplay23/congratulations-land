<script setup>
import { PhPlus } from '@phosphor-icons/vue';
defineProps({ items: Array, subtitle: { type: String, default: 'Щоб обрати подарунок було легко.' }, title: { type: String, default: 'Питання та відповіді' } });
</script>
<template>
  <section class="section wrap faq-section">
    <div><h2>{{ title }}</h2><p class="muted">{{ subtitle }}</p></div>
    <div class="faq-list"><details v-for="[q, a] in items" :key="q"><summary>{{ q }}<PhPlus :size="20" weight="light" aria-hidden="true" /></summary><p>{{ a }}</p></details></div>
  </section>
</template>
