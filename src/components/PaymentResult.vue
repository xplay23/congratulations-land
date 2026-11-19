<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';

const messages = {
  created: 'Рахунок очікує на тестову оплату.',
  processing: 'Банк обробляє тестовий платіж.',
  hold: 'Банк обробляє підтвердження платежу.',
  success: 'Тестова оплата успішна.',
  failure: 'Тестову оплату відхилено.',
  reversed: 'Тестову оплату скасовано.',
  expired: 'Строк дії рахунку минув.'
};
const result = ref(null), message = ref(''), busy = ref(false), canRefresh = ref(false);
let orderId, timer, checks = 0;
const controller = new AbortController();
async function refresh() {
  if (busy.value) return;
  clearTimeout(timer);
  busy.value = true;
  try {
    const response = await fetch('/api/plata/invoices/' + orderId, { signal: controller.signal, cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) {
      result.value = null;
      message.value = body.error || 'Не вдалося перевірити платіж.';
      canRefresh.value = response.status !== 404;
      return;
    }
    result.value = body;
    message.value = messages[body.status];
    canRefresh.value = ['created', 'processing', 'hold'].includes(body.status);
    if (canRefresh.value && ++checks < 5) timer = setTimeout(refresh, 5000);
  } catch {
    message.value = 'Не вдалося перевірити платіж. Перевірте з’єднання й оновіть статус.';
    result.value = null;
    canRefresh.value = true;
  } finally { busy.value = false; }
}
onMounted(() => {
  orderId = window.location.hash.slice(1);
  if (!orderId) {
    try { orderId = sessionStorage.getItem('plata-test-order'); } catch {}
  }
  if (/^[0-9a-f-]{36}$/.test(orderId)) refresh();
  else message.value = 'Після тестової оплати тут з’явиться статус вашого рахунку.';
});
onBeforeUnmount(() => { clearTimeout(timer); controller.abort(); });
</script>

<template>
  <section class="document wrap">
    <h1>Тестова оплата</h1>
    <p role="status">{{ message || 'Перевіряємо статус рахунку…' }}</p>
    <p v-if="result">{{ result.label }} · {{ result.amount / 100 }} грн</p>
    <p>У тестовому режимі кошти не списуються, а готове привітання не створюється.</p>
    <a v-if="result?.pageUrl" class="button primary" :href="result.pageUrl">Продовжити тестову оплату</a>
    <button v-if="canRefresh" class="button ghost" type="button" :disabled="busy" @click="refresh">Оновити статус</button>
    <a class="text-link" href="/zamovlennya/">До форми замовлення</a>
  </section>
</template>
