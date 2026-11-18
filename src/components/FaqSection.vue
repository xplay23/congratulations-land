<script setup>
import { PhPlus } from '@phosphor-icons/vue';
defineProps({ items: Array, title: { type: String, default: 'Питання та відповіді' } });
</script>
<template>
  <section class="section wrap faq-section">
    <div><h2>{{ title }}</h2><p class="muted">Щоб обрати подарунок було легко.</p></div>
    <div class="faq-list"><details v-for="[q, a] in items" :key="q"><summary>{{ q }}<PhPlus :size="20" weight="light" aria-hidden="true" /></summary><p>{{ a }}</p></details></div>
  </section>
</template>
