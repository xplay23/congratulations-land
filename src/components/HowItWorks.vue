<script setup>
defineProps({
  title: { type: String, default: 'Від ваших слів до близької усмішки.' },
  steps: { type: Array, default: () => [
    { title: 'Додайте особисте.', text: "Напишіть ім'я, як до людини звертатися, і кілька слів про неї: за що дякуєте чи що хочете побажати." },
    { title: 'Перевірте замовлення.', text: 'Перечитайте ім’я та побажання і перевірте електронну адресу для готового подарунка.' },
    { title: 'Подаруйте емоції.', text: 'Після оплати відео готується приблизно 5 хвилин і приходить на вказану пошту. Перешліть його у месенджері або покажіть особисто.' }
  ] },
  intro: { type: String, default: 'Три кроки, без складних форм.' }
});
</script>
<template>
  <section id="how" class="section wrap how-section">
    <div class="section-heading centered"><h2>{{ title }}</h2><p v-if="intro">{{ intro }}</p></div>
    <ol class="steps">
      <li v-for="(step, index) in steps" :key="index"><span class="step-number">{{ index + 1 }}</span><h3 v-if="step.title">{{ step.title }}</h3><p>{{ typeof step === 'string' ? step : step.text }}</p></li>
    </ol>
  </section>
</template>
