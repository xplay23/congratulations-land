<script setup>
import { features } from '../features.mjs';
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { PhCaretDown, PhList, PhX } from '@phosphor-icons/vue';
const props = defineProps({ path: String });
const ru = computed(() => props.path.startsWith('/ru/'));
const birthday = computed(() => ['/den-narodzhennya/', '/ru/den-rozhdeniya/'].includes(props.path));
const open = ref(false), scrolled = ref(false), toggle = ref(null);
const scrollMarker = ref(null);
let scrollObserver;
function closeMenu(event) { if (event.key === 'Escape' && open.value) { open.value = false; toggle.value?.focus(); } }
onMounted(() => {
  scrollObserver = new IntersectionObserver(([entry]) => { scrolled.value = !entry.isIntersecting; });
  scrollObserver.observe(scrollMarker.value);
  window.addEventListener('keydown', closeMenu);
});
onBeforeUnmount(() => { scrollObserver?.disconnect(); window.removeEventListener('keydown', closeMenu); });
</script>
<template>
  <span ref="scrollMarker" aria-hidden="true" style="position:absolute;top:24px;left:0;width:1px;height:1px;pointer-events:none"></span>
  <header class="header" :class="{ scrolled, 'menu-open': open }"><div class="header-inner">
    <a class="brand" href="/" :aria-label="ru ? 'Videovitannya — главная' : 'Videovitannya — головна'"><img class="brand-symbol" :src="'/assets/video-gift.svg'" alt="VideoVitannya" width="256" height="256"></a>
    <nav id="main-nav" class="nav" :class="{ open }" :aria-label="ru ? 'Главная навигация' : 'Головна навігація'" @click="open = false">
      <a href="/#gifts">{{ ru ? 'Поздравления' : 'Привітання' }} <PhCaretDown :size="12" aria-hidden="true" /></a>
      <a href="/#how">{{ ru ? 'Как это работает' : 'Як це працює' }}</a>
      <a href="/tsiny/" :aria-current="path === '/tsiny/' ? 'page' : undefined">{{ ru ? 'Цены' : 'Ціни' }}</a>
      <a v-if="features.blogVisible" href="/blog/" :aria-current="path.startsWith('/blog/') ? 'page' : undefined">Блог</a>
      <a v-if="features.accountVisible" class="mobile-account" href="/kabinet/">Мої замовлення</a>
    </nav>
    <div class="header-actions"><a v-if="birthday" class="language-link" :lang="ru ? 'uk' : 'ru'" :hreflang="ru ? 'uk' : 'ru'" :href="ru ? '/den-narodzhennya/' : '/ru/den-rozhdeniya/'" :aria-label="ru ? 'Українською' : 'По-русски'">{{ ru ? 'Укр' : 'Рус' }}</a><a v-if="features.accountVisible" class="account-link" href="/kabinet/">Мій кабінет</a><a class="button ghost nav-cta" :href="birthday ? '#order' : '/zamovlennya/'">{{ ru ? 'Заказать' : 'Замовити' }}</a></div>
    <button ref="toggle" class="menu-toggle" :aria-expanded="open" aria-controls="main-nav" :aria-label="open ? (ru ? 'Закрыть меню' : 'Закрити меню') : (ru ? 'Открыть меню' : 'Відкрити меню')" @click="open = !open"><PhX v-if="open" :size="26" weight="light" /><PhList v-else :size="26" weight="light" /></button>
  </div></header>
</template>
