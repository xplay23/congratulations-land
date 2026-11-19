import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

export function useTestCheckout(selection, lang = 'uk') {
  const available = ref(null), paying = ref(false), paymentError = ref(''), lastPayment = ref('');
  const retry = lang === 'ru' ? 'Не удалось открыть тестовую оплату. Попробуйте ещё раз.' : 'Не вдалося відкрити тестову оплату. Спробуйте ще раз.';
  let orderId;
  watch(selection, () => { orderId = undefined; paymentError.value = ''; });

  async function checkAvailability() {
    available.value = null;
    try {
      const response = await fetch('/api/plata/config', { cache: 'no-store' });
      available.value = response.ok && (await response.json()).testAvailable === true;
    } catch { available.value = false; }
  }
  async function pay() {
    if (paying.value || !available.value) return;
    paying.value = true;
    paymentError.value = '';
    try {
      orderId ??= crypto.randomUUID();
      const response = await fetch('/api/plata/invoices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, ...selection.value })
      });
      const result = await response.json();
      if (!response.ok || !result.pageUrl) {
        paymentError.value = (lang === 'uk' && result.error) || retry;
        paying.value = false;
        return;
      }
      lastPayment.value = orderId;
      try { sessionStorage.setItem('plata-test-order', orderId); } catch {}
      window.location.assign(result.pageUrl);
    } catch { paymentError.value = retry; paying.value = false; }
  }
  function resume() { paying.value = false; }
  onMounted(() => {
    window.addEventListener('pageshow', resume);
    try { lastPayment.value = sessionStorage.getItem('plata-test-order') || ''; } catch {}
  });
  onBeforeUnmount(() => window.removeEventListener('pageshow', resume));
  function resetOrder() { orderId = undefined; paymentError.value = ''; }
  return { available, paying, paymentError, lastPayment, pay, checkAvailability, resetOrder };
}
