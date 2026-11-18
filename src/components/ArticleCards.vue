<script setup>
import { PhArrowUpRight } from '@phosphor-icons/vue';
import { articlePath } from '../content.mjs';
defineProps({ articles: Array });
</script>
<template>
  <div class="article-grid"><a v-for="a in articles" :key="a.slug" class="article-card" :href="articlePath(a)"><span class="article-category">Святий Миколай</span><div><h3>{{ a.title }}</h3><p>{{ a.lead }}</p></div><PhArrowUpRight :size="24" weight="light" aria-hidden="true" /></a></div>
</template>
