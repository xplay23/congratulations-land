<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { prices } from '../content.mjs';
import { giftFormats, occasions } from '../birthday.mjs';
import { useTestCheckout } from '../useTestCheckout.js';
import ResponsiveImage from './ResponsiveImage.vue';

const props = defineProps({ lang: { type: String, default: 'uk' }, allowOther: Boolean });
defineEmits(['choose-other']);
const t = (uk, ru) => props.lang === 'ru' ? ru : uk;
const steps = ['Продукт', t('Привід', 'Повод'), t('Деталі', 'Детали'), t('Перевірка', 'Проверка'), t('Оплата', 'Оплата')];
const art = { birthday: 'birthday-music', song: 'christmas-song', photo: 'christmas-photo' };
const form = ref(null), step = ref(0), error = ref(''), files = ref([]);
const details = reactive({ name: '', wish: '', facts: ['', '', ''], mood: '', genre: '', email: '', photoRights: false, consent: false });
const variant = ref('birthday'), occasion = ref('birthday');
const needsPhoto = computed(() => variant.value !== 'song');
const needsSong = computed(() => variant.value !== 'photo');
const chosen = computed(() => giftFormats.find(item => item.id === variant.value));
const selection = computed(() => ({ product: 'birthday', variant: variant.value, occasion: occasion.value }));
const { available, paying, paymentError, lastPayment, pay, checkAvailability, resetOrder } = useTestCheckout(selection, props.lang);
watch(details, resetOrder);

onMounted(() => {
  const query = new URLSearchParams(location.search);
  if (Object.hasOwn(occasions, query.get('occasion'))) occasion.value = query.get('occasion');
});
function changeOccasion() {
  const url = new URL(window.location.href);
  url.searchParams.set('occasion', occasion.value);
  history.replaceState(history.state, '', url);
}
function selectFiles(event) {
  const selected = Array.from(event.target.files);
  error.value = '';
  if (selected.length > 3 || selected.some(f => f.size > 10 * 1024 * 1024 || !/\.(jpe?g|png|heic|heif)$/i.test(f.name))) {
    files.value = [];
    event.target.value = '';
    error.value = t('Оберіть до трьох фото JPG, PNG або HEIC, до 10 МБ кожне.', 'Выберите до трёх фото JPG, PNG или HEIC, до 10 МБ каждое.');
    return;
  }
  files.value = selected;
  resetOrder();
}
async function go(index) {
  step.value = index;
  error.value = '';
  await nextTick();
  form.value.querySelector('legend')?.focus();
  if (index === 4) await checkAvailability();
}
function submit() {
  if (step.value === 4) { pay(); return; }
  if (!form.value.reportValidity()) return;
  if (step.value === 2) {
    if (!details.name.trim() || (needsSong.value && details.facts.some(f => !f.trim()))) {
      error.value = t('Заповніть ім’я та позначені поля.', 'Заполните имя и обязательные поля.');
      return;
    }
    if (needsPhoto.value && !files.value.length) {
      error.value = t('Додайте хоча б одне фото.', 'Добавьте хотя бы одно фото.');
      return;
    }
  }
  go(step.value + 1);
}
</script>

<template>
  <section id="order" class="birthday-order">
    <h2>{{ t('Оберіть свій подарунок', 'Выберите свой подарок') }}</h2>
    <ol class="birthday-progress" :aria-label="t('Кроки замовлення', 'Шаги заказа')">
      <li v-for="(label, i) in steps" :key="label" :aria-current="i === step ? 'step' : undefined" :class="{ complete: i < step }">{{ label }}</li>
    </ol>
    <form ref="form" class="order-form birthday-form" @submit.prevent="submit">
      <fieldset v-if="step === 0">
        <legend tabindex="-1" class="sr-only">{{ steps[0] }}</legend>
        <div class="gift-format-grid">
          <label v-for="item in giftFormats" :key="item.id" class="gift-format" :class="{ selected: variant === item.id }">
            <span class="format-art"><ResponsiveImage :base="'/assets/' + art[item.id]" alt="" :widths="[360, 640]" :width="640" :height="426" sizes="(max-width: 700px) 72px, 28vw" /></span>
            <input v-model="variant" type="radio" name="format" :value="item.id">
            <span class="format-copy">
              <strong>{{ item[lang] }}</strong><span>{{ item.detail[lang] }}</span>
              <span class="format-price">{{ prices[item.id] }} грн</span>
              <small v-if="item.id === 'birthday'">{{ t('Вигідніше, ніж окремо', 'Выгоднее, чем отдельно') }}</small>
            </span>
          </label>
        </div>
        <p class="bundle-cost">Пакет <strong>{{ prices.birthday }} грн</strong> · {{ t('окремо пісня й фото', 'песня и фото отдельно') }} {{ prices.song + prices.photo }} грн · {{ t('економія', 'экономия') }} {{ prices.song + prices.photo - prices.birthday }} грн</p>
        <button v-if="allowOther" class="text-button" type="button" @click="$emit('choose-other')">{{ t('Обрати інше привітання', 'Выбрать другое поздравление') }}</button>
      </fieldset>
      <fieldset v-else-if="step === 1" class="birthday-fields">
        <legend tabindex="-1">{{ t('З якої нагоди вітаємо?', 'По какому поводу поздравляем?') }}</legend>
        <label for="occasion">{{ steps[1] }}</label>
        <select id="occasion" v-model="occasion" @change="changeOccasion"><option v-for="(name, id) in occasions" :key="id" :value="id">{{ name[lang] }}</option></select>
      </fieldset>
      <fieldset v-else-if="step === 2" class="birthday-fields">
        <legend tabindex="-1">{{ t('Кому присвячено подарунок?', 'Кому посвящён подарок?') }}</legend>
        <label for="name">{{ t('Як звернутися до людини? *', 'Как обратиться к человеку? *') }}</label>
        <input id="name" v-model="details.name" required maxlength="50" :placeholder="t('Наприклад, Олено', 'Например, Олено')" aria-describedby="birthday-name-help">
        <p id="birthday-name-help" class="field-help">{{ t('Напишіть ім’я у кличному відмінку, як воно має прозвучати.', 'Укажите имя в звательном падеже, как оно должно прозвучать на украинском.') }}</p>
        <label for="wish">{{ t('Ваше побажання', 'Ваше пожелание') }}</label>
        <textarea id="wish" v-model="details.wish" rows="2" maxlength="500"></textarea>
        <template v-if="needsSong">
          <div class="field-row"><div><label for="genre">Жанр</label><select id="genre" v-model="details.genre"><option value="">{{ t('Довільний', 'Любой') }}</option><option v-for="g in ['Поп', 'Рок', 'Фолк', 'Шансон', 'Акустика']" :key="g">{{ g }}</option></select></div>
            <div><label for="mood">{{ t('Настрій', 'Настроение') }}</label><select id="mood" v-model="details.mood"><option value="">{{ t('На ваш вибір', 'На ваш выбор') }}</option><option v-for="m in [t('Теплий','Тёплое'), t('Веселий','Весёлое'), t('Жартівливий','Шутливое'), t('Урочистий','Торжественное')]" :key="m">{{ m }}</option></select></div></div>
          <template v-for="n in 3" :key="n"><label :for="'fact' + n">{{ t('Факт про людину', 'Факт о человеке') }} {{ n }} *</label><input :id="'fact' + n" v-model="details.facts[n - 1]" required maxlength="150"></template>
        </template>
        <template v-if="needsPhoto">
          <label for="photos">{{ t('Додайте від 1 до 3 фото *', 'Добавьте от 1 до 3 фото *') }}</label>
          <div class="upload-zone"><strong>{{ t('Обрати фотографії', 'Выбрать фотографии') }}</strong><small>JPG, PNG, HEIC · {{ t('до 10 МБ кожне', 'до 10 МБ каждое') }}</small>
            <input id="photos" type="file" accept="image/jpeg,image/png,.heic,.heif" multiple @change="selectFiles"></div>
          <ul v-if="files.length" class="selected-files"><li v-for="(file, i) in files" :key="i">{{ file.name }}</li></ul>
          <label class="checkbox"><input v-model="details.photoRights" type="checkbox" required>{{ t('Я маю право використовувати ці фото.', 'У меня есть право использовать эти фото.') }}</label>
        </template>
        <label for="email">{{ t('Пошта для готового подарунка *', 'Почта для готового подарка *') }}</label>
        <input id="email" v-model="details.email" required type="email" maxlength="254" autocomplete="email">
        <label class="checkbox"><input v-model="details.consent" required type="checkbox"><span>{{ t('Я погоджуюся з', 'Я соглашаюсь с') }} <a href="/konfidentsiynist/" target="_blank" rel="noopener">{{ t('правилами конфіденційності', 'правилами конфиденциальности') }}</a>.</span></label>
      </fieldset>
      <fieldset v-else class="birthday-fields">
        <legend tabindex="-1">{{ step === 3 ? t('Перевірте замовлення', 'Проверьте заказ') : t('Тестова оплата', 'Тестовая оплата') }}</legend>
        <dl class="order-summary">
          <div><dt>{{ steps[0] }}</dt><dd>{{ chosen[lang] }}</dd></div>
          <div><dt>{{ steps[1] }}</dt><dd>{{ occasions[occasion][lang] }}</dd></div>
          <template v-if="step === 3">
            <div><dt>{{ t('Звертання', 'Обращение') }}</dt><dd>{{ details.name }}</dd></div>
            <div v-if="details.wish"><dt>{{ t('Побажання', 'Пожелание') }}</dt><dd>{{ details.wish }}</dd></div>
            <div v-if="needsSong"><dt>{{ t('Факти для пісні', 'Факты для песни') }}</dt><dd>{{ details.facts.join(' · ') }}</dd></div>
            <div v-if="needsSong && (details.genre || details.mood)"><dt>{{ t('Жанр і настрій', 'Жанр и настроение') }}</dt><dd>{{ [details.genre, details.mood].filter(Boolean).join(' · ') }}</dd></div>
            <div v-if="needsPhoto"><dt>Фото</dt><dd>{{ files.map(f => f.name).join(', ') }}</dd></div>
            <div><dt>Email</dt><dd>{{ details.email }}</dd></div>
          </template>
        </dl>
      </fieldset>
      <p class="field-help">{{ t('Тестовий режим. Кошти не списуються, готовий подарунок не надсилається.', 'Тестовый режим. Деньги не списываются, готовый подарок не отправляется.') }}</p>
      <p v-if="step === 4 && !available" role="status">{{ available === null ? t('Перевіряємо доступність оплати…', 'Проверяем доступность оплаты…') : t('Тестова оплата поки недоступна.', 'Тестовая оплата пока недоступна.') }}</p>
      <p v-if="error || paymentError" class="form-error" role="alert">{{ error || paymentError }}</p>
      <div class="form-controls">
        <button v-if="step" type="button" class="text-button" :disabled="paying" @click="go(step - 1)">Назад</button>
        <span class="order-total">{{ t('Вартість', 'Стоимость') }} <strong>{{ prices[variant] }} грн</strong></span>
        <button v-if="step < 4" class="button primary" type="submit">{{ step === 3 ? t('До оплати', 'К оплате') : t('Далі', 'Далее') }}</button>
        <button v-else-if="available" class="button primary test-checkout" type="submit" :disabled="paying">{{ paying ? t('Відкриваємо оплату…', 'Открываем оплату…') : t('Тестова оплата через plata by mono', 'Тестовая оплата через plata by mono') }}</button>
      </div>
      <a v-if="lastPayment" class="text-link previous-payment" :href="'/oplata/#' + lastPayment">{{ t('Перевірити останню тестову оплату', 'Проверить последнюю тестовую оплату') }}</a>
    </form>
  </section>
</template>
