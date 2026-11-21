# Payload CMS 3.84 — Архитектура и дорожная карта (Этапы А, Б, В, Г)

> **Статус на 2026-11-21:** **Этапы А, Б, визуальный конструктор страниц/шаблонов (`HomeTemplate` + `Pages` + свободная область блоков на `Services`, всего 22 блока) и Этап Г (полный отказ от SQLite → единый PostgreSQL 16 со схемой `app`) полностью реализованы и проверены вживую.** Легаси-страница `/admin/tariffs`, отдельная коллекция `Faqs`, зависимость от `node:sqlite` и таблица `app_state` полностью удалены; операционные таблицы (`app.orders`, `app.email_auth_tokens`, `app.telegram_tokens`, `app.runtime_state`) работают в том же `PostgreSQL 16` (`pg` Pool) изолированно от схемы `public` Payload CMS; цены, лимиты и курсы `AiEconomics` читаются напрямую из Payload Local API с 30-секундным кэшем и мгновенной инвалидацией. Далее остаётся только **остаток Этапа В (`src/styles/tokens.css`) и полная переработка визуального дизайна (`DESIGN.md`)**.

---

## 0. Главный архитектурный принцип админки (обязательно к соблюдению)

**Мы строим новую админку строго по нативной логике Payload CMS, а не переносим и не костылим экраны из старой самописной админки.**

1. **Никакого легаси и дублирования экранов:** всё, что относится к контенту, каталогу услуг, ценам/тирам, вариациям, блогу, навигации, промптам, лимитам и системным справочникам, реализуется **исключительно нативными Collections и Globals Payload CMS** (с вкладками `tabs`, нативными фильтрами, списком колонок, локализацией `uk`/`ru`, `TranslateLocaleButton` и ИИ-кнопками).
2. **Кастомные страницы (Custom Views) допускаются только там, где это действительно операционный инструмент, а не CRUD:**
   - `/admin` (**Дашборд**) — сводная бизнес-аналитика, маржа, конверсии и «Состояние интеграций»;
   - `/admin/orders` (**Заказы**) — операционный инспектор заказов с живыми действиями (`Resume`, `Sync Plata by mono`, возврат/финализация холда, `+1 AI-правка`, просмотр превью/результата).
   - **Страница `/admin/tariffs` (`AdminSettingsTab`) — удалена на Этапе Б:** цены и статусы услуг живут в коллекции `Services`, а курсы себестоимости ИИ — в глобале `AiEconomics` («Курсы и маржа»).
3. **Единый источник истины и стек с одной БД:**
   - Payload (схема `public` в PostgreSQL 16) — единственный источник истины для всех настроек, цен и контента.
   - На **Этапе Г** проект полностью перешёл на **единый PostgreSQL 16** (операционные таблицы вынесены в изолированную схему `app`; `node:sqlite` удалён).

---

## 1. Общая архитектура (Этап А — Готово)

### Гибридное разделение БД и контуров
Чтобы не смешивать редакционный контент с транзакциями и временным хранением заказов/фотографий, платформа разделена на два контура:

1. **Контур CMS и настроек ИИ — `Payload CMS 3.84.1` + `PostgreSQL 16`:**
   - Контейнер `videovitannya-db` (`postgres:16-alpine`, локальный проброс `127.0.0.1:5556 -> 5432`) в [docker-compose.dev.yml](file:///g:/WwW/work/gifts-project/docker-compose.dev.yml). Под хостинг на Hostinger VPS через Docker Manager используется штатный `DATABASE_URL`.
   - Главный конфиг: [payload.config.ts](file:///g:/WwW/work/gifts-project/payload.config.ts) (`Next.js 16.2.6`, `React 19.2.4`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `@payloadcms/plugin-seo`, `withPayload` в [next.config.ts](file:///g:/WwW/work/gifts-project/next.config.ts), `i18n` админки `ru`/`uk`/`en` с `fallbackLanguage: "ru"`).
   - Коллекции и глобалы:
     - [engine/collections/Users.ts](file:///g:/WwW/work/gifts-project/engine/collections/Users.ts) (`users`, 30-дневная сессия);
     - [engine/collections/Media.ts](file:///g:/WwW/work/gifts-project/engine/collections/Media.ts) (`media`, загрузка в `public/media`);
     - [engine/globals/SiteSettings.ts](file:///g:/WwW/work/gifts-project/engine/globals/SiteSettings.ts) (`site-settings`, «Общие»: логотип, слоган, контакты, `footerText` и `copyrightText` на визуальном редакторе Lexical RichText, гибкий массив соцсетей `socialLinks` с `SocialLinkRowLabel`, кнопка двунаправленного перевода `RU ↔ UA`);
     - [engine/globals/AISettings.ts](file:///g:/WwW/work/gifts-project/engine/globals/AISettings.ts) (`ai-settings`, «ИИ (Контент)»: провайдер/ключ/модель/`reasoningEffort` для блога, SEO, перевода и чат-помощника; отдельный провайдер/ключ/модель для обложек; персона бренда);
     - [engine/globals/StorybookAISettings.ts](file:///g:/WwW/work/gifts-project/engine/globals/StorybookAISettings.ts) (`storybook-ai-settings`, «ИИ-сказки»: три независимые секции с выбором провайдера, ключа, динамического `<select>` модели и `reasoningEffort` — *Текст сказки*, *Режиссура и Vision QA*, *Иллюстрации сказок* + качество);
     - [engine/globals/ElevenLabsSettings.ts](file:///g:/WwW/work/gifts-project/engine/globals/ElevenLabsSettings.ts) (`elevenlabs-settings`, «ElevenLabs»: ключ, `<select>` TTS-модели с fallback-списком при отсутствии `models_read`, выбор голоса из живого `/api/ai/elevenlabs-voices` + ручной Voice ID, слайдеры с числовым вводом `RangeNumberField` для `stability` и `similarityBoost`);
     - [engine/globals/AIPrompts.ts](file:///g:/WwW/work/gifts-project/engine/globals/AIPrompts.ts) (`ai-prompts`, «Промпты»: 26 редактируемых шаблонов с `{{переменными}}`);
     - [engine/globals/PlatformLimits.ts](file:///g:/WwW/work/gifts-project/engine/globals/PlatformLimits.ts) (`platform-limits`, «Лимиты»: вертикальная страница настроек лимитов превью, AI-правок и TTL хранения с мгновенной инвалидацией кэша `settings.ts`).

2. **Операционный контур заказов и оплаты (на Этапе Г перенесён из `node:sqlite` в схему `app` единого `PostgreSQL 16`):**
   - Заказы видео и сказок, `Plata by mono` холды/финализация/webhook, OTP + magic links (`/my-orders`), 30-дневное хранение готовых файлов (`storage/`), очистка EXIF-фото, расчёт маржи `ai_cost_json` и обезличенная аналитика работают в [src/lib/db.ts](file:///g:/WwW/work/gifts-project/src/lib/db.ts) (`pg` Pool, схема `app`) и [src/lib/settings.ts](file:///g:/WwW/work/gifts-project/src/lib/settings.ts) (Payload Local API).
   - Кастомные страницы админки полностью переписаны на единую дизайн-систему `domainer-platform` / Payload (`@engine/components/admin/ui`: `Card`, `Button`, `Input`, `Select`, `Checkbox`, `BarRow`, `Alert`, `SectionLabel`, `C`) и встроены как Custom Views:
     - `/admin` → [Dashboard](file:///g:/WwW/work/gifts-project/engine/views/Dashboard/index.tsx) (аналитика + [AdminSystemHealthCard.tsx](file:///g:/WwW/work/gifts-project/src/components/admin/AdminSystemHealthCard.tsx) «Состояние интеграций» внизу страницы);
     - `/admin/orders` → [Orders](file:///g:/WwW/work/gifts-project/engine/views/Orders/index.tsx) (инспектор заказов, Resume, Sync Mono, возврат/холд, `+1 AI-правка`).
   - Авторизация в [src/lib/admin-auth.ts](file:///g:/WwW/work/gifts-project/src/lib/admin-auth.ts) принимает активную сессию Payload наравне с существующими методами входа (`ADMIN_PASSWORD` / `ADMIN_EMAILS`).

### Маршрутизация, стили, i18n и двунаправленный перевод
- **Route Groups:** витрина и формы заказа изолированы в `src/app/(site)/` (`/` для UA и `/ru/...` для RU), а админка и API Payload — в `src/app/(payload)/`. В [src/lib/locale.ts](file:///g:/WwW/work/gifts-project/src/lib/locale.ts) и [src/middleware.ts](file:///g:/WwW/work/gifts-project/src/middleware.ts) `/media` добавлен в нелокализуемые пути наряду с `/admin`, `/api`, `/assets`, `/samples`.
- **Единый дизайн админки:** используются только стили и UI-примитивы `domainer-platform` + Payload (`engine/styles/admin-base.css`, `admin-layout.css`, `admin-payload.css`, `admin-custom-pages.css`, `engine/components/admin/ui/admin-ui.css`) с поддержкой тёмной/светлой тем и единой типографикой (`14px` body, `13px` controls, `16–18px` headings, `30px` KPI, `32px` H1).
- **Язык админки и локализация контента (`RU ↔ UA`):**
  - Интерфейс админки по умолчанию на **русском (`ru`)**, в шапке установлен переключатель **`RU | UA`** ([AdminLangSwitcher](file:///g:/WwW/work/gifts-project/engine/views/AdminLangSwitcher/index.tsx)) на базе `useTranslation().switchLanguage` + хелпер [admin-i18n.ts](file:///g:/WwW/work/gifts-project/engine/lib/admin-i18n.ts).
  - Локали контента в Payload: `uk` (`Українська (UA)`, default) и `ru` (`Русский (RU)`), `fallback: true`.
  - Компонент [TranslateLocaleButton](file:///g:/WwW/work/gifts-project/engine/components/admin/TranslateLocaleButton/index.tsx) + [src/app/api/ai/translate/route.ts](file:///g:/WwW/work/gifts-project/src/app/api/ai/translate/route.ts) работают **в обе стороны (`🇷🇺 → 🇺🇦` и `🇺🇦 → 🇷🇺`)** из любой вкладки локали (включая RichText Lexical `footerText`/`copyrightText` через [htmlToLexical.ts](file:///g:/WwW/work/gifts-project/engine/components/admin/PostAiButtons/htmlToLexical.ts)).

### Runtime-конфиг AI и ElevenLabs + Python-воркер
- Резолвер [src/lib/cms-ai-config.ts](file:///g:/WwW/work/gifts-project/src/lib/cms-ai-config.ts) (`getCmsAiConfig()`, кэш 30 с + мгновенная инвалидация через `afterChange`-хуки `ai-settings`, `storybook-ai-settings`, `elevenlabs-settings`, `ai-prompts`) объединяет настройки из всех глобалов PostgreSQL с fallback-цепочкой на общие ключи и `.env.local`.
- Все генераторы переведены на `getCmsOpenAIRuntime()` / `getCmsAiConfig()` с поддержкой `reasoningEffort` (`buildChatModelParams` + `buildVercelReasoningOptions`):
  - [src/lib/openai-client.ts](file:///g:/WwW/work/gifts-project/src/lib/openai-client.ts) (`client`, `writerClient`, `directorClient`, `imageClient`);
  - [src/lib/storybook/vision.ts](file:///g:/WwW/work/gifts-project/src/lib/storybook/vision.ts) (`directorClient`, `storybookDirectorModel`, `storybookDirectorReasoningEffort`);
  - [src/lib/storybook/writer.ts](file:///g:/WwW/work/gifts-project/src/lib/storybook/writer.ts) (`writerClient`, `directorClient`, `storybookWriterModel`, `storybookDirectorModel`, `reasoningEffort`, `style-*`, `storybook-*-system` с жёсткой защитой JSON-структуры в коде);
  - [src/lib/storybook/illustrator.ts](file:///g:/WwW/work/gifts-project/src/lib/storybook/illustrator.ts) (`imageClient`, `directorClient`, `storybookImageModel`, `storybookImageQuality`, `storybookVisionQaEnabled`, `storybook-vision-qa`);
  - [src/app/api/ai/generate/route.ts](file:///g:/WwW/work/gifts-project/src/app/api/ai/generate/route.ts), [src/app/api/ai/translate/route.ts](file:///g:/WwW/work/gifts-project/src/app/api/ai/translate/route.ts), [src/app/api/assistant/route.ts](file:///g:/WwW/work/gifts-project/src/app/api/assistant/route.ts);
  - [src/lib/video/pipeline.ts](file:///g:/WwW/work/gifts-project/src/lib/video/pipeline.ts) — **принципиально важное архитектурное решение:** Python-скрипт [video-pipeline/scripts/assemble_pilot.py](file:///g:/WwW/work/gifts-project/video-pipeline/scripts/assemble_pilot.py) остаётся чистым локальным FFmpeg/Pillow-воркером без доступа к БД и ключам. Вся логика ElevenLabs (`elevenLabsApiKey`, `elevenLabsModelId`, `elevenLabsVoiceId`, `elevenLabsStability`, `elevenLabsSimilarityBoost` и шаблоны реплик `video-line-*`) читается из БД на стороне Next.js, реплики синтезируются в `.mp3` и передаются в Python через `--custom-audio`.
- Начальный сидер: [scripts/seed-stage-a.ts](file:///g:/WwW/work/gifts-project/scripts/seed-stage-a.ts) идемпотентно создаёт первого администратора и сидит `site-settings` (`uk`/`ru`, Lexical RichText + `socialLinks`), `ai-settings`, `storybook-ai-settings`, `elevenlabs-settings`, `platform-limits` и 26 шаблонов промптов в `ai-prompts`.

### Базовые команды Этапа А
- `npm run db` — запуск `postgres:16-alpine` в Docker (`npm run db:stop` — остановка);
- `npm run generate:importmap` — перегенерация `src/app/(payload)/admin/importMap.js` после изменения полей/компонентов админки;
- `npm run seed:stage-a` — первичная инициализация/досид глобалов и пользователя;
- `npm run typecheck` — проверка TypeScript без конфликта с работающим `next dev`.

---

## 2. Этап Б и визуальный конструктор страниц/шаблонов (Готово)

**Итог:** платформа переведена на чистую Payload-нативную модель управления каталогом, ценами, блогом, навигацией, шаблоном главной и страницами — легаси-экран `/admin/tariffs` и отдельная коллекция `Faqs` удалены, все массивы используют читаемый `FirstFieldRowLabel`.

### Коллекции (`engine/collections/`)
1. **`Services` (`slug: "services"` — единый источник истины по услуге, статусу и цене):**
   - Каталог всех 7 услуг (`svyatyj-mykolaj`, `kazka`, `ozhyvyty-foto`, `pisnya-na-zamovlennya`, `den-narodzhennya`, `novyj-rik`, `multfilm-pro-dytynu`).
   - **Вкладка «Основное и цена»**: `slug` (`SlugField`), `serviceKey`, `status` (`active` | `coming_soon` | `hidden`), `sortOrder`, `ctaOrderUrl`, `showcaseKind`, `coverImage`/`fallbackImageUrl`, `basePriceUah`, массив `pricingTiers`, `relatedServices`.
   - **Вкладка «Контент (UA / RU)»**: `TranslateLocaleButton`, `title`, `label`, `badge`, `shortDescription`, `ctaLabel`, `features`, `h1`, `intro`, `heroFootnote`, `sections` и свободная область визуального конструктора **`extraBlocks`** (FAQ, отзывы, шаги, баннеры, CTA и др.).
   - **Вкладка «SEO»**: `@payloadcms/plugin-seo` + кнопка `PageSeoButton`.
   - `afterChange`/`afterDelete` синхронизируют кэш цен и ревалидируют страницы.
2. **`ServiceVariations` (`slug: "service-variations"`):**
   - Вариации сюжета/локации с наследованием цены родительской `Services` (и опциональным `priceOverrideUah`), `pipelineTemplateId`, `elevenLabsVoiceIdOverride` и кастомными репликами; интегрированы в `/create/video`, `/api/config/video-variations`, `/api/orders/video` и [src/lib/video/pipeline.ts](file:///g:/WwW/work/gifts-project/src/lib/video/pipeline.ts).
3. **`Showcases` (`slug: "showcases"`):**
   - Живые демонстрации видео (`MP4`) и сказок (`PDF`) для `#live-demos` и страниц услуг.
4. **`Reviews` (`slug: "reviews"` — нелокализуемая коллекция):**
   - Отзывы хранятся на оригинальном языке автора (UA или RU) без перевода; поддерживаются два типа (`reviewType`): **текстовый отзыв** (с опциональным фото `photo`) и **отзыв из Instagram** (`instagramUrl` с авто-встраиванием `<iframe>`, опциональный `instagramEmbedHtml` и резервный скриншот). Выводятся на страницах через блок конструктора `ReviewsBlock` (режим «Все отзывы» с лимитом или «Выбрать конкретные»).
5. **`Pages` (`slug: "pages"` — произвольные и сервисные страницы на конструкторе):**
   - Локализованные страницы `/tsiny`, `/pro-nas`, `/kontakty`, `/oferta`, `/konfidentsiynist`, плюс любые новые лендинги через динамический маршрут [src/app/(site)/\[slug\]/page.tsx](file:///g:/WwW/work/gifts-project/src/app/(site)/[slug]/page.tsx) и автоматическое включение в [sitemap.ts](file:///g:/WwW/work/gifts-project/src/app/sitemap.ts).
6. **Блог (`Posts`, `PostCategories`, `Authors`):**
   - Полноценный блог на Lexical RichText с [PostAiButtons](file:///g:/WwW/work/gifts-project/engine/components/admin/PostAiButtons/index.tsx), [PageSeoButton](file:///g:/WwW/work/gifts-project/engine/components/admin/PageSeoButton/index.tsx), `SlugField`, `TagsField` и `TranslateLocaleButton`.

### Шаблоны и глобалы (`engine/globals/`)
- **Шаблоны (обязательные неудаляемые страницы, подменю `Контент → Шаблоны`):**
  - **`HomeTemplate` (`slug: "home-template"`, «Главная страница»):** полностью собирается на блоках конструктора (`Hero`, `LiveDemos`, `ServicesCatalog`, `Steps`, `PrivacyTrust`, `Text`, `Reviews`, `FAQ`, `BlogGrid`, `CTA` + все общие блоки) и рендерит `/` и `/ru`.
- **Навигация и экономика (подменю `Настройки`):**
  - **`HeaderNav` (`slug: "header-nav"`):** пункты верхнего меню с поддержкой вложенных выпадающих подпунктов **`children`** (как в `domainer-platform`);
  - **`FooterNav` (`slug: "footer-nav"`):** колонки ссылок и юридические ссылки;
  - **`AiEconomics` (`slug: "ai-economics"`, «Курсы и маржа»):** курс `USD → UAH`, тарифы текстовых/image-моделей и ElevenLabs + кнопка [AiRatesRefreshButton](file:///g:/WwW/work/gifts-project/engine/components/admin/AiRatesRefreshButton/index.tsx) ([POST /api/ai/economics/refresh](file:///g:/WwW/work/gifts-project/src/app/api/ai/economics/refresh/route.ts), [ai-rates-sync.ts](file:///g:/WwW/work/gifts-project/src/lib/ai-rates-sync.ts)), подтягивающая цены реально используемых в проде моделей из реестра LiteLLM и актуальный курс НБУ `bank.gov.ua`.

### Визуальный конструктор блоков (`engine/blocks/` + `src/components/RenderBlocks.tsx`)
22 блока (все массивы с `FirstFieldRowLabel`, вертикальные отступы через [engine/lib/blocks/spacing.ts](file:///g:/WwW/work/gifts-project/engine/lib/blocks/spacing.ts)):
- **Специализированные и базовые (`catalog.ts`, `content.ts`):** `HeroBlock`, `LiveDemosBlock`, `ServicesCatalogBlock`, `PricingTableBlock`, `StepsBlock`, `PrivacyTrustBlock`, `ReviewsBlock`, `FAQBlock` (с JSON-LD `FAQPage`), `TextBlock` (Lexical + опция кнопки cookies), `BlogGridBlock`, `CTABlock`, `SpacerBlock`.
- **Адаптированные общие блоки из `domainer-platform` (`extra.ts`):** `BannerBlock` (с dismissible), `FeaturesBlock` (cards / list / icons-only + `IconPickerField`/`IconColorField`), `IconListBlock`, `LogosBlock`, `StatsBlock`, `TextImageBlock`, `VideoBlock` (YouTube / Vimeo / Upload), `ManifestoBlock`, `PricingCardsBlock`, `PaymentLogosBlock` (Plata by mono, Visa, Mastercard, Apple Pay, Google Pay, monobank, Privat24, custom).

### Итоговая навигация `/admin`
- **Операции (Custom Views):** `Дашборд`, `Заказы`
- **Каталог:** `Услуги`, `Вариации`, `Примеры`, `Отзывы`
- **Производство:** `Видео-шаблоны`, `Ассеты пайплайна`, `Стили сказок`, `Конструктор сказок`
- **Контент:** `Страницы`, `Шаблоны → Главная страница`, `Статьи`, `Рубрики`, `Авторы`, `Медиа`
- **Система → Пользователи / Настройки:** `Общие`, `Меню шапки`, `Меню футера`, `ИИ (Контент)`, `ИИ-сказки`, `ElevenLabs`, `Промпты`, `Лимиты`, `Курсы и маржа`

### Миграционный сидер (`scripts/seed-stage-b.ts`)
- Идемпотентный скрипт `npm run seed:stage-b` переносит `Services` (с `FAQBlock` в `extraBlocks`), `ServiceVariations`, `Showcases`, нелокализуемые `Reviews`, `HomeTemplate`, `Pages` (`tsiny`, `pro-nas`, `kontakty`, `oferta`, `konfidentsiynist`), `Authors`, `PostCategories`, `Posts`, `HeaderNav`, `FooterNav` и `AiEconomics`.

---

## 3. Оставшаяся часть Этапа В: Токенная система дизайна (`src/styles/tokens.css` + `DESIGN.md`)

**Что осталось от Этапа В:** конструктор страниц (`Pages`, `HomeTemplate`, 22 блока и `RenderBlocks.tsx`) уже реализован; остаётся вынести цвета, типографику, отступы, радиусы и тени фронтенда в единый слой семантических CSS-токенов `src/styles/tokens.css` и выполнить полную переработку визуального дизайна поверх блочной архитектуры по `DESIGN.md`.

---

## 4. Этап Г: Полный отказ от SQLite и переход на единый PostgreSQL 16 (Готово)

**Итог Этапа Г:** вторая база данных (`node:sqlite`, `storage/gifts.db`, `app_state`) полностью удалена — вся платформа работает на **одном экземпляре PostgreSQL 16** (`DATABASE_URL`).

### Реализованная архитектура в PostgreSQL 16
1. **Изолированная схема `app` (защита от `push: true` Payload/Drizzle в `public`):**
   - `app.orders` — заказы видео и сказок (`payload_json`/`result_json`/`ai_cost_json` в `JSONB`, временные метки в `TIMESTAMPTZ`, атомарный захват `claimOrderFinalization` с `GREATEST` и `RETURNING *`, транзакционный `mergeOrderAiCost` с `SELECT ... FOR UPDATE`);
   - `app.email_auth_tokens` — атомарные одноразовые OTP-коды и magic-ссылки для `/my-orders`;
   - `app.telegram_tokens` — транзакционные одноразовые deep-link токены доставки в Telegram с защитой от дублей в пределах 120 с;
   - `app.runtime_state` — лёгкое хранилище служебного runtime-состояния (в частности, `telegram_last_offset` для локального polling-синка `/api/telegram/sync`).
2. **Асинхронный драйвер и единый источник настроек:**
   - [src/lib/db.ts](file:///g:/WwW/work/gifts-project/src/lib/db.ts) переписан на асинхронный `pg` (`Pool`, синглтон `globalThis.__videovitannyaPgPool` с автоматическим идемпотентным `ensureSchema`).
   - [src/lib/settings.ts](file:///g:/WwW/work/gifts-project/src/lib/settings.ts) читает цены (`services`), лимиты (`platform-limits`) и курсы ИИ (`ai-economics`) напрямую через Payload Local API с 30-секундным кэшем и мгновенной кросс-бандловой инвалидацией через общий `globalThis.__videovitannyaCacheVersions` в [cms-cache.ts](file:///g:/WwW/work/gifts-project/src/lib/cms-cache.ts) (используется также в [cms-content.ts](file:///g:/WwW/work/gifts-project/src/lib/cms-content.ts) и [cms-ai-config.ts](file:///g:/WwW/work/gifts-project/src/lib/cms-ai-config.ts), чтобы `afterChange`-хуки из `/(payload)/api/[...slug]` мгновенно сбрасывали кэши во всех route-бандлах Next.js / Turbopack).
   - [src/lib/ai-cost.ts](file:///g:/WwW/work/gifts-project/src/lib/ai-cost.ts) резолвит тарифы моделей и сохраняет себестоимость в `async flushToOrder(orderId)`.
   - Удалены `node:sqlite`, `app_state`, `storage/gifts.db*`, `AdminLoginView`, `afterChange`-зеркалирование из `Services`/`PlatformLimits`/`AiEconomics`, чтение SQLite из сидеров `seed-stage-a.ts`/`seed-stage-b.ts` и легаси `PUT /api/admin/settings`.
   - Кастомные экраны `/admin` (`Дашборд`) и `/admin/orders` (`Заказы`) работают напрямую с таблицами `app.*` в PostgreSQL.
   - **Проверено большим E2E-прогоном (94/94 PASS без вызовов OpenAI):** все публичные страницы UA/RU, 10 коллекций + 10 глобалов Payload, мгновенная кросс-бандловая инвалидация кэша, ElevenLabs/LiteLLM+НБУ/Telegram, полный живой видео-пайплайн (`real_ffmpeg_elevenlabs`, автоудаление фото, живой инвойс Plata by mono, `Range 206` HD MP4, Email OTP + `/my-orders`, аналитика и админ-действия); после теста таблицы `app.*` очищены.


---

## 5. Видео-студия и конструктор видео-шаблонов в Payload CMS (Готово)

**Итог:** сборка поздравительных видео полностью перенесена под управление Payload CMS — новые персонажи, локации, реплики UA/RU, оверлеи фото/подписи и поля клиентской формы создаются из `/admin` без правок кода, а в коде остался универсальный stateless-движок сборки.

### Сущности, студия и движок
1. **`PipelineAssets` (`slug: "pipeline-assets"`, группа `Производство`):** приватное хранилище исходников (`storage/pipeline-assets/`, доступ только для авторизованного админа) для `.mp4` футажей, BGM, Ambient и кэшированных статичных `.mp3` реплик с автозамером `durationSec`/`width`/`height`/`fps` через `ffprobe` ([ffprobe.ts](file:///g:/WwW/work/gifts-project/src/lib/video/ffprobe.ts)) и приватным стримингом HTTP `Range` (`206`) ([stream/route.ts](file:///g:/WwW/work/gifts-project/src/app/api/admin/pipeline-assets/[id]/stream/route.ts)).
2. **`VideoTemplates` (`slug: "video-templates"`, группа `Производство`):** связывается с `ServiceVariations.videoTemplate` и содержит 4 вкладки:
   - **Основное и звук:** голос ElevenLabs (`ElevenLabsVoiceField`, `stability`, `similarityBoost`), кнопка массовой переозвучки статичных реплик [BulkRevoiceButton](file:///g:/WwW/work/gifts-project/engine/components/admin/VideoTimelineStudio/BulkRevoiceButton.tsx), BGM, Ambient (`none`/`asset`/`extract_from_shot`), `duckingPreset`, разрешение/FPS и `endFade`.
   - **Форма заказа:** локализуемая карточка персонажа + совет родителям + конструктор `formFields` на 6 доменных блоках ([videoFormFields.ts](file:///g:/WwW/work/gifts-project/engine/blocks/videoFormFields.ts): `genderField`, `textField` с опциональным кличним відмінком, `ageStepperField`, `praisePresetsField`, `photoUploadField`, `selectCardsField`).
   - **Студия таймлайна (`timelineConfig` JSONB + Zod-валидация в [template-schema.ts](file:///g:/WwW/work/gifts-project/src/lib/video/template-schema.ts)):** интерактивное приложение [VideoTimelineStudio](file:///g:/WwW/work/gifts-project/engine/components/admin/VideoTimelineStudio/index.tsx) с переключателем дорожек `UA | RU`, тестовыми пресетами `Короткий / Средний / Макс`, live-плеером шота (`<video>` + синхронизированный `Web Audio API` + перетаскивание/ресайз оверлея прямо поверх кадра + кнопка FFmpeg-превью шота ~1.3 с), 2-дорожечным Shot-anchored таймлайном (подрезка фиксированных шотов с обоих краёв + жёлтая полоса slip-сдвига окна с live-перемоткой кадра, перетаскивание `offsetSec` реплик) и инспектором с кнопками синтеза/тест-прослушивания ElevenLabs (с передачей `language_code: "uk" | "ru"` в [elevenlabs.ts](file:///g:/WwW/work/gifts-project/src/lib/video/elevenlabs.ts)). Автосинхронизация `usedAssets` в `beforeChange`.
   - **Тест-рендер:** [VideoTemplateTestRender](file:///g:/WwW/work/gifts-project/engine/components/admin/VideoTimelineStudio/VideoTemplateTestRender.tsx) для сборки и просмотра полного тестового MP4.
3. **Универсальный stateless Python-сборщик, клиентская форма и полировка UX:**
   - [assemble_video.py](file:///g:/WwW/work/gifts-project/video-pipeline/scripts/assemble_video.py) (`--manifest manifest.json --out out.mp4 [--only-shot key]`) + [manifest-builder.ts](file:///g:/WwW/work/gifts-project/src/lib/video/manifest-builder.ts) + движок шаблонов/грамматики [template-vars.ts](file:///g:/WwW/work/gifts-project/src/lib/video/template-vars.ts) (`{voc}`, `{agePrefix}`, `{gender:a|b}`, `{?field:then|else}`).
   - Клиентская форма [DynamicVideoForm.tsx](file:///g:/WwW/work/gifts-project/src/components/DynamicVideoForm.tsx) (авто-мокап оверлея и автокадр 1-го шота как fallback через `/api/config/video-template-frame`), автоматическая сборка `ctaOrderUrl` (`/create/video?service=<slug>`) и наследование цены/заголовка родительской `Services`, динамический вывод персонализированных реплик и отдельный блок совета перед показом на `/orders/[id]`, скрытие пустого слогана в [SiteHeader.tsx](file:///g:/WwW/work/gifts-project/src/components/SiteHeader.tsx), симметричная сетка строк и выравнивание чекбоксов в [admin-payload.css](file:///g:/WwW/work/gifts-project/engine/styles/admin-payload.css).
   - Динамическая валидация в [api/orders/video/route.ts](file:///g:/WwW/work/gifts-project/src/app/api/orders/video/route.ts) и гарантированное удаление всех загруженных пользовательских фото в `finally` [src/lib/video/pipeline.ts](file:///g:/WwW/work/gifts-project/src/lib/video/pipeline.ts).
   - Идемпотентный сидер `npm run seed:video` ([scripts/seed-video-template.ts](file:///g:/WwW/work/gifts-project/scripts/seed-video-template.ts)) переносит все 29 ассетов и шаблон `st-nicholas-room` («Святой Николай — Теплая резиденция») с привязкой к вариации; `assemble_pilot.py` сохранён как legacy-fallback.
   - **Проверено живым E2E (19/19 PASS):** публичный конфиг и защита `403`/`401`, приватный `Range 206` стрим ассетов, извлечение кадров (`first` и `04b`), ElevenLabs с `language_code` `uk`/`ru`, быстрый рендер шота `04b` (`1.27s`), полный живой заказ `real_ffmpeg_elevenlabs` с автоудалением фото и zero-code 2-й шаблон с новым полем `hobby`.

---

## 6. Адаптация сказок PDF в Payload CMS (Готово)

**Итог:** все художественные стили, справочники формы заказа `/create/storybook`, системные промпты пайплайна и оформление PDF перенесены в Payload CMS под группу **`Производство`** — новые стили, миры, сюжеты, настроения, возрастные группы, объёмы страниц и пресеты добавляются и тестируются из `/admin` без правок кода.

### Сущности, песочница стиля и интеграция
1. **`StorybookStyles` (`slug: "storybook-styles"`, группа `Производство`):**
   - **Витрина (UA / RU):** `TranslateLocaleButton`, `title`, `slug` (`SlugField`), `badge`, `description`, `previewImage` (`Media`) + `fallbackImageUrl`, `enabled`, `isDefault`, `sortOrder`.
   - **Промпт и рендер:** `stylePrompt` (EN, идёт в `visualBible.styleLock`), `mediumPreset` (`2d_illustration` | `3d_animation` | `claymation_stopmotion` | `custom` — автоподстановка правил перевода фото и `antiRipple` в [illustrator.ts](file:///g:/WwW/work/gifts-project/src/lib/storybook/illustrator.ts)), опциональные `mediumRuleOverride` и `negativeRulesOverride`.
   - **Тест стиля ([StorybookStyleTester](file:///g:/WwW/work/gifts-project/engine/components/admin/StorybookStyleTester/index.tsx)):** песочница с 4 контрольными сценами (или своим промптом), выбором формата (`1536x1024`, `1024x1024`, `1024x1536`), генерацией тест-кадра по текущему несохранённому промпту ([POST /api/admin/storybook-styles/test-image](file:///g:/WwW/work/gifts-project/src/app/api/admin/storybook-styles/test-image/route.ts)) и кнопкой в 1 клик «Установить как превью стиля» ([POST /api/admin/storybook-styles/promote-preview](file:///g:/WwW/work/gifts-project/src/app/api/admin/storybook-styles/promote-preview/route.ts)).
2. **`StorybookConfig` (`slug: "storybook-config"`, группа `Производство`):** 5 вкладок + `TranslateLocaleButton` (расширен поддержкой локализованных полей внутри `array`):
   - **Вёрстка, возраст и объём:** режимы вёрстки (`classic`/`panorama` с превью из `Media`), возрастные группы (с `wordRange` и `writerNote` для [writer.ts](file:///g:/WwW/work/gifts-project/src/lib/storybook/writer.ts)), `previewPagesCount` и варианты объёма книги (`pageVolumes`).
   - **Настроения, миры и сюжеты:** `tones` (с `IconPickerField`, дополнено группой `Storybook & Magic` + `promptHint`), `settings` и `plots` (с `IconPickerField` и **опциональными картинками-превью `previewImage`**, которые рендерятся карточкой с лайтбоксом, если заданы), и `presets` (для кнопки «Случайная комбинация» и URL-пресетов `?preset=...`, `?style=...`, `?setting=...`, `?plot=...`, `?tone=...`).
   - **Герой и спутники:** `hairSwatches` и `eyeSwatches` (через `SiteColorPickerField`), `petSpecies`, `familyRelations` (с режимами пола `female`/`male`/`ask`) и `toyPresets`.
   - **Промпты пайплайна:** 5 перенесённых системных промптов (`beats`, `draft`, `proofread`, `director`, `visionQa`) — мигрированы из `ai-prompts` с сохранением правок.
   - **PDF и декор:** локализованный `pdfWatermarkText`, `pdfJpegQuality` (`70–98`) и 5 опциональных PNG-ассетов (`decorCornerVignette`, `decorChapterDivider`, `decorDedicationWreath`, `decorCoverCorner`, `decorCoverBackdrop`) с автоматическим fallback на `assets/decorations/` в [pdf-assets.ts](file:///g:/WwW/work/gifts-project/src/lib/storybook/pdf-assets.ts) и [pdf.ts](file:///g:/WwW/work/gifts-project/src/lib/storybook/pdf.ts).
3. **Runtime-резолвер, витрина и сидер:**
   - [src/lib/storybook/config-shared.ts](file:///g:/WwW/work/gifts-project/src/lib/storybook/config-shared.ts) + [src/lib/storybook/config.ts](file:///g:/WwW/work/gifts-project/src/lib/storybook/config.ts) с 30-секундным кэшем и мгновенной кросс-бандловой инвалидацией (`storybookConfig` в [cms-cache.ts](file:///g:/WwW/work/gifts-project/src/lib/cms-cache.ts));
   - [GET /api/config/storybook](file:///g:/WwW/work/gifts-project/src/app/api/config/storybook/route.ts), динамическая валидация в [POST /api/orders/storybook](file:///g:/WwW/work/gifts-project/src/app/api/orders/storybook/route.ts), динамический конструктор [src/app/(site)/create/storybook/page.tsx](file:///g:/WwW/work/gifts-project/src/app/(site)/create/storybook/page.tsx) и резолв названий стилей в [StorybookShowcaseReader.tsx](file:///g:/WwW/work/gifts-project/src/components/StorybookShowcaseReader.tsx);
   - Добавлен `access: { read: () => true }` в [Media.ts](file:///g:/WwW/work/gifts-project/engine/collections/Media.ts) и относительные `/media/...` URL для надёжного публичного доступа;
   - Идемпотентный сидер `npm run seed:storybook` ([scripts/seed-storybook.ts](file:///g:/WwW/work/gifts-project/scripts/seed-storybook.ts)) переносит 6 стилей, 2 вёрстки с превью в `Media`, все справочники и 5 системных промптов и очищает 11 мигрированных дублей из `ai-prompts`.

**Следующий шаг:** деплой на продакшн (VPS / Docker / webhook / Email), затем `src/styles/tokens.css` (остаток Этапа В) и полная переработка визуального дизайна (`DESIGN.md`).
