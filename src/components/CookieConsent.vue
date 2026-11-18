<script setup>
import { onMounted, ref } from 'vue';
const visible = ref(false);
function show() { visible.value = true; }
function choose(value) {
  try { localStorage.setItem('videovitannya-consent', JSON.stringify({ necessary: true, analytics: value === 'all', marketing: value === 'all', version: 1 })); } catch { /* Consent remains valid in memory if storage is unavailable. */ }
  visible.value = false;
}
onMounted(() => {
  try { visible.value = !localStorage.getItem('videovitannya-consent'); } catch { visible.value = true; }
});
defineExpose({ show });
</script>
<template>
  <aside v-if="visible" class="cookie-banner" aria-label="Налаштування cookies"><div><strong>Ваш вибір — ваша приватність</strong><p>Необхідні налаштування допомагають сайту працювати. Аналітику та рекламу дозволяєте ви. Зараз ці системи не підключені.</p></div><div class="cookie-actions"><button class="button ghost" @click="choose('necessary')">Лише необхідні</button><button class="button secondary" @click="choose('all')">Дозволити всі</button></div></aside>
</template>
