<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue';
import { PhPause, PhPlay } from '@phosphor-icons/vue';
import ResponsiveImage from './ResponsiveImage.vue';

const video = ref(null);
const playing = ref(false);
const mounted = ref(false);
const failed = ref(false);
const sourcesReady = ref(false);
const frameReady = ref(false);
let motion, observer;
let disposed = false;
let pageReady = false;
let starting = false;
let inView = true;
let userPaused = false;
let userStarted = false;

async function play() {
  if (starting || !video.value) return;
  starting = true;
  try {
    if (!sourcesReady.value) {
      sourcesReady.value = true;
      await nextTick();
      if (disposed) return;
      video.value.load();
    }
    if (!inView || document.hidden || userPaused) return;
    video.value.muted = true;
    await video.value.play();
  } catch { playing.value = false; }
  finally { starting = false; }
}
function syncPlayback() {
  if (!video.value || failed.value) return;
  if (!inView || document.hidden || userPaused || (!userStarted && (!pageReady || motion.matches || navigator.connection?.saveData))) video.value.pause();
  else play();
}
function togglePlayback() {
  if (video.value.paused) {
    userPaused = false;
    userStarted = true;
    play();
  } else {
    userPaused = true;
    video.value.pause();
  }
}
function motionChanged() {
  userStarted = false;
  syncPlayback();
}
async function startAfterPoster() {
  // Give the first frame and critical page resources priority over background media.
  await document.querySelector('.hero-poster img')?.decode().catch(() => {});
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (disposed) return;
    pageReady = true;
    syncPlayback();
  }));
}
onMounted(() => {
  mounted.value = true;
  motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  motion.addEventListener('change', motionChanged);
  document.addEventListener('visibilitychange', syncPlayback);
  observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncPlayback();
  }, { threshold: 0 });
  observer.observe(video.value);
  if (document.readyState === 'complete') startAfterPoster();
  else window.addEventListener('load', startAfterPoster, { once: true });
});
onBeforeUnmount(() => {
  disposed = true;
  window.removeEventListener('load', startAfterPoster);
  observer?.disconnect();
  motion?.removeEventListener('change', motionChanged);
  document.removeEventListener('visibilitychange', syncPlayback);
  video.value?.pause();
});
</script>

<template>
  <ResponsiveImage class="hero-poster" base="/assets/hero-andriiko-poster" :widths="[640, 960, 1280]" :width="1280" :height="720" sizes="(max-width: 640px) 960px, 100vw" eager />
  <video ref="video" class="hero-video" :style="{ opacity: frameReady && !failed ? 1 : 0 }" width="1280" height="720" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" @play="playing = true" @playing="frameReady = true" @pause="playing = false" @error="failed = true">
    <source :src="sourcesReady ? '/assets/hero-andriiko-480.mp4' : undefined" media="(max-width: 640px)" type="video/mp4">
    <source :src="sourcesReady ? '/assets/hero-andriiko-720.mp4' : undefined" type="video/mp4">
  </video>
  <button v-if="mounted && !failed" class="hero-playback" type="button" :aria-label="playing ? 'Пауза — призупинити фонове відео' : 'Відтворити фонове відео'" @click="togglePlayback">
    <PhPause v-if="playing" :size="16" weight="fill" aria-hidden="true" /><PhPlay v-else :size="16" weight="fill" aria-hidden="true" />
    <span>{{ playing ? 'Пауза' : 'Відтворити' }}</span>
  </button>
</template>
