<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { products, prices, defaultProductId } from '../content.mjs';
const props = defineProps({ selected: { type: String, default: () => defaultProductId } });
const step = ref(0), error = ref(''), form = ref(null), fileInput = ref(null);
const files = ref([]);
const data = reactive({ product: props.selected, hero: props.selected === 'mykolay' ? 'mykolay' : 'did', children: '1', variant: 'birthday', name: '', name2: '', age: '', age2: '', interest: '', interest2: '', achievement: '', achievement2: '', wish: '', genre: 'Поп', mood: 'Теплий', fact1: '', fact2: '', fact3: '', story: '', email: '', contact: '', photoRights: false, consent: false });
const winter = computed(() => ['newyear', 'mykolay'].includes(data.product));
const effectiveProduct = computed(() => data.product === 'birthday' ? data.variant : data.product);
const needsSong = computed(() => ['song', 'birthday'].includes(effectiveProduct.value));
const needsPhoto = computed(() => effectiveProduct.value !== 'song');
const twoChildren = computed(() => winter.value && data.children === '2');
const amount = computed(() => winter.value ? (twoChildren.value ? prices.winterTwo : prices.winter) : prices[effectiveProduct.value]);
const product = computed(() => products.find(p => p.id === data.product));
const names = { Олена: 'Олено', Оленка: 'Оленко', Тарас: 'Тарасе', Марія: 'Маріє', Андрій: 'Андрію', Іван: 'Іване', Софія: 'Софіє', Анна: 'Анно', Максим: 'Максиме', Михайло: 'Михайле', Наталія: 'Наталіє', Олександр: 'Олександре', Дмитро: 'Дмитре', Артем: 'Артеме', Богдан: 'Богдане', Катерина: 'Катерино' };
const suggested = computed(() => names[data.name.trim()]);
const progress = ['Подарунок', 'Деталі', 'Контакти', 'Перевірка'];
watch(() => data.product, value => { data.hero = value === 'mykolay' ? 'mykolay' : 'did'; error.value = ''; });
function release() { files.value.forEach(file => { if (file.url) URL.revokeObjectURL(file.url); }); }
function selectPhotos(event) {
  error.value = '';
  const chosen = [...event.target.files];
  if (chosen.length > 3 || chosen.some(f => f.size > 10 * 1024 * 1024 || !/\.(jpe?g|png|heic|heif)$/i.test(f.name))) {
    error.value = 'Оберіть від 1 до 3 фото у форматі JPG, PNG або HEIC, до 10 МБ кожне.';
    event.target.value = ''; release(); files.value = []; return;
  }
  release();
  files.value = chosen.map(f => ({ name: f.name, url: /\.(jpe?g|png)$/i.test(f.name) ? URL.createObjectURL(f) : null }));
}
async function go(value) {
  step.value = value; error.value = '';
  await nextTick();
  form.value?.querySelector('fieldset legend')?.focus();
}
function submit() {
  error.value = '';
  if (!form.value.reportValidity()) return;
  if (step.value === 1) {
    if (!data.name.trim() || (twoChildren.value && !data.name2.trim())) { error.value = 'Вкажіть, як звертатися до кожного отримувача.'; return; }
    if (needsPhoto.value && (files.value.length < (twoChildren.value ? 2 : 1) || !data.photoRights)) { error.value = twoChildren.value ? 'Додайте фото кожної дитини та підтвердьте право на використання.' : 'Додайте фото та підтвердьте право на його використання.'; return; }
    if (needsSong.value && [data.fact1, data.fact2, data.fact3].some(f => !f.trim())) { error.value = 'Додайте три короткі факти для особистої пісні.'; return; }
  }
  go(Math.min(step.value + 1, 3));
}
async function restart() {
  release(); files.value = [];
  for (const key of ['name', 'name2', 'age', 'age2', 'interest', 'interest2', 'achievement', 'achievement2', 'wish', 'fact1', 'fact2', 'fact3', 'story', 'email', 'contact']) data[key] = '';
  data.photoRights = false; data.consent = false;
  await go(0);
}
onMounted(() => {
  const query = new URLSearchParams(window.location.search).get('product');
  if (products.some(p => p.id === query && p.price !== null)) data.product = query;
});
onBeforeUnmount(release);
</script>

<template>
  <section id="order" class="order-section">
    <div class="order-intro"><span class="eyebrow">Починається з вашої історії</span><h2>Створімо щось особисте</h2><p>Кілька деталей — і ваш подарунок стане по-справжньому вашим.</p><div class="order-assurance"><span>01 — Деталі</span><span>02 — Прев’ю</span><span>03 — Оплата</span></div><p class="form-notice">Демонстраційна форма: перевірте макет замовлення. Генерація й оплата ще не підключені. Дані залишаються у браузері.</p></div>
    <form ref="form" class="order-form" @submit.prevent="submit">
      <ol class="form-progress" aria-label="Кроки замовлення"><li v-for="(label, i) in progress" :key="label" :class="{ complete: i < step }" :aria-current="i === step ? 'step' : undefined"><span>{{ i + 1 }}</span>{{ label }}</li></ol>
      <div class="sr-only" role="status" aria-live="polite">Крок {{ step + 1 }} з 4: {{ progress[step] }}</div>
      <fieldset v-if="step === 0"><legend tabindex="-1">Що подаруємо?</legend><label for="product">Привітання</label><select id="product" v-model="data.product"><option v-for="p in products.filter(p => p.price !== null)" :key="p.id" :value="p.id">{{ p.label }}</option></select>
        <template v-if="winter"><label for="hero">Хто вітатиме?</label><select id="hero" v-model="data.hero"><option v-if="data.product === 'newyear'" value="did">Дід Мороз</option><option v-if="data.product === 'newyear'" value="santa">Санта</option><option v-if="data.product === 'mykolay'" value="mykolay">Святий Миколай</option></select><label for="children">Для скількох дітей?</label><select id="children" v-model="data.children"><option value="1">Для однієї — 399 грн</option><option value="2">Для двох — 599 грн</option></select></template>
        <template v-if="data.product === 'birthday'"><label for="variant">Варіант подарунка</label><select id="variant" v-model="data.variant"><option value="birthday">Фото + пісня — 549 грн</option><option value="photo">Оживлення фото — 199 грн</option><option value="song">Пісня — 399 грн</option></select></template>
        <p class="field-help">Спершу перевірте короткий фрагмент. Оплата повної версії — лише після прев’ю.</p>
      </fieldset>
      <fieldset v-if="step === 1"><legend tabindex="-1">Кому подаруємо?</legend>
        <label for="name">Як звертатися *</label><input id="name" v-model="data.name" placeholder="Наприклад, Оленко" required maxlength="50" autocomplete="off" aria-describedby="name-help"><p id="name-help" class="field-help">Ім’я у кличному відмінку — саме так воно прозвучить.</p><button v-if="suggested" type="button" class="name-suggestion" @click="data.name = suggested">Використати «{{ suggested }}» ↗</button>
        <div class="field-row"><div><label for="age">Вік</label><input id="age" v-model="data.age" type="number" min="1" max="120" placeholder="Років"></div><div><label for="interest">Улюблена справа</label><input id="interest" v-model="data.interest" maxlength="150" placeholder="Любить малювати"></div></div><label for="achievement">Досягнення або добра справа</label><input id="achievement" v-model="data.achievement" maxlength="150" placeholder="Навчилася кататися на велосипеді">
        <div v-if="twoChildren" class="second-child"><h3>Друга дитина</h3><label for="name2">Як звертатися до другої дитини *</label><input id="name2" v-model="data.name2" maxlength="50" required placeholder="Наприклад, Тарасе"><label for="age2">Вік другої дитини</label><input id="age2" v-model="data.age2" type="number" min="1" max="120"><label for="interest2">Улюблена справа</label><input id="interest2" v-model="data.interest2" maxlength="150"><label for="achievement2">Досягнення або добра справа</label><input id="achievement2" v-model="data.achievement2" maxlength="150"></div>
        <label for="wish">Ваше побажання <span class="optional">необов’язково</span></label><textarea id="wish" v-model="data.wish" maxlength="500" rows="3" placeholder="Що хочете побажати цій людині?"></textarea>
        <template v-if="needsPhoto"><label for="photos">Додайте {{ twoChildren ? '2–3' : '1–3' }} фото</label><div class="upload-zone"><span aria-hidden="true">↑</span><strong>Оберіть фотографії</strong><small>JPG, PNG, HEIC · до 10 МБ кожне</small><input id="photos" ref="fileInput" type="file" accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif" multiple aria-describedby="photo-help" @change="selectPhotos"></div><p id="photo-help" class="field-help">Обличчя добре видно, без розмиття. {{ twoChildren ? 'Додайте фото кожної дитини.' : '' }}</p><div class="file-previews" aria-live="polite"><div v-for="file in files" :key="file.name"><img v-if="file.url" :src="file.url" :alt="file.name" width="64" height="64"><span>{{ file.name }}</span></div></div><label class="checkbox"><input v-model="data.photoRights" type="checkbox" required>Я маю право завантажувати ці фото та згоду на їх обробку.</label></template>
        <template v-if="needsSong"><div class="field-row"><div><label for="genre">Жанр</label><select id="genre" v-model="data.genre"><option v-for="g in ['Поп', 'Рок', 'Фолк', 'Шансон', 'Акустика']" :key="g">{{ g }}</option></select></div><div><label for="mood">Настрій</label><select id="mood" v-model="data.mood"><option v-for="m in ['Теплий', 'Веселий', 'Зворушливий', 'Урочистий']" :key="m">{{ m }}</option></select></div></div><template v-for="n in 3" :key="n"><label :for="`fact${n}`">Факт про людину {{ n }} *</label><input :id="`fact${n}`" v-model="data[`fact${n}`]" required maxlength="150"></template><label for="story">Коротка історія</label><textarea id="story" v-model="data.story" maxlength="500" rows="3" placeholder="До 500 символів"></textarea></template>
      </fieldset>
      <fieldset v-if="step === 2"><legend tabindex="-1">Куди надіслати подарунок?</legend><label for="email">Ваш email *</label><input id="email" v-model="data.email" type="email" required autocomplete="email" placeholder="you@example.com" maxlength="254"><label for="contact">Телефон або Telegram <span class="optional">необов’язково</span></label><input id="contact" v-model="data.contact" maxlength="80" placeholder="+380… або @username"><label class="checkbox"><input v-model="data.consent" type="checkbox" required><span>Я ознайомився/-лася з <a href="/konfidentsiynist/" target="_blank" rel="noopener">правилами конфіденційності</a>.</span></label><p class="field-help">У цій демонстрації email не зберігається та листи не надсилаються.</p></fieldset>
      <fieldset v-if="step === 3"><legend tabindex="-1">Перевірте ваше привітання</legend><dl class="order-summary"><div><dt>Подарунок</dt><dd>{{ product.label }}{{ data.product === 'birthday' ? ` · ${data.variant === 'birthday' ? 'Фото + пісня' : data.variant === 'song' ? 'Пісня' : 'Фото'}` : '' }}</dd></div><div><dt>Для кого</dt><dd>{{ data.name }}{{ twoChildren ? ` та ${data.name2}` : '' }}</dd></div><div v-if="winter"><dt>Герой</dt><dd>{{ { did: 'Дід Мороз', santa: 'Санта', mykolay: 'Святий Миколай' }[data.hero] }}</dd></div><div><dt>Email</dt><dd>{{ data.email }}</dd></div><div><dt>Вартість</dt><dd>{{ amount }} грн</dd></div></dl><div class="preview-layout"><span class="eyebrow">Макет · не згенероване відео</span><p class="preview-name">{{ data.name }}{{ twoChildren ? ` та ${data.name2}` : '' }},<br>це привітання для вас.</p><span class="watermark">PREVIEW</span></div><p class="field-help">Це макет персоналізації. Справжнє прев’ю з голосом і можливість оплатити з’являться після підключення генерації та платежів.</p><button type="button" class="button ghost" @click="restart">Створити інше привітання ↗</button></fieldset>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p><div class="form-controls"><button v-if="step > 0" type="button" class="text-button" @click="go(step - 1)">← Назад</button><span class="order-total">Вартість <strong>{{ amount }} грн</strong></span><button v-if="step < 3" type="submit" class="button primary">{{ step === 2 ? 'Перевірити макет' : 'Далі' }} <span aria-hidden="true">→</span></button></div>
    </form>
  </section>
</template>
