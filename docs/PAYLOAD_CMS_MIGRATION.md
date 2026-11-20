# Payload CMS 3.84 — Архитектура и дорожная карта (Этапы А, Б, В, Г)

> **Статус на 2026-11-21:** **Этап А, Этап Б и визуальный конструктор страниц/шаблонов (`HomeTemplate` + `Pages` + свободная область блоков на `Services`, всего 22 блока) полностью реализованы и проверены вживую.** Легаси-страница `/admin/tariffs` и отдельная коллекция `Faqs` удалены (FAQ — блок конструктора); в `HeaderNav` поддержаны вложенные выпадающие пункты (`children`); `Reviews` нелокализуемы (оригинальный язык автора) с поддержкой текстовых отзывов (с фото) и встраивания Instagram; в `AiEconomics` добавлена кнопка автообновления цен рабочих моделей из реестра LiteLLM + курса НБУ `USD → UAH` (`/api/ai/economics/refresh`). Далее остаются: **токенная система редизайна (`src/styles/tokens.css` + `DESIGN.md`)** и **Этап Г (полный отказ от SQLite → единый PostgreSQL 16)**.

---

## 0. Главный архитектурный принцип админки (обязательно к соблюдению)

**Мы строим новую админку строго по нативной логике Payload CMS, а не переносим и не костылим экраны из старой самописной админки.**

1. **Никакого легаси и дублирования экранов:** всё, что относится к контенту, каталогу услуг, ценам/тирам, вариациям, блогу, навигации, промптам, лимитам и системным справочникам, реализуется **исключительно нативными Collections и Globals Payload CMS** (с вкладками `tabs`, нативными фильтрами, списком колонок, локализацией `uk`/`ru`, `TranslateLocaleButton` и ИИ-кнопками).
2. **Кастомные страницы (Custom Views) допускаются только там, где это действительно операционный инструмент, а не CRUD:**
   - `/admin` (**Дашборд**) — сводная бизнес-аналитика, маржа, конверсии и «Состояние интеграций»;
   - `/admin/orders` (**Заказы**) — операционный инспектор заказов с живыми действиями (`Resume`, `Sync Plata by mono`, возврат/финализация холда, `+1 AI-правка`, просмотр превью/результата).
   - **Страница `/admin/tariffs` (`AdminSettingsTab`) — временный пережиток старой админки и подлежит полному удалению на Этапе Б:** цены и статусы услуг переезжают в коллекцию `Services`, а курсы себестоимости ИИ — в глобал `AiEconomics` («Курсы и маржа»).
3. **Единый источник истины и целевой стек с одной БД:**
   - Payload (PostgreSQL 16) — единственный источник истины для всех настроек, цен и контента.
   - Временное хранение операционных таблиц в `node:sqlite` — лишь промежуточный шаг, чтобы не ломать проверенный E2E-чекаут во время сборки админки; в финале (**Этап Г**) проект полностью переходит на **единый PostgreSQL 16** без второй базы данных.

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
     - [engine/globals/PlatformLimits.ts](file:///g:/WwW/work/gifts-project/engine/globals/PlatformLimits.ts) (`platform-limits`, «Лимиты»: вертикальная страница настроек лимитов превью, AI-правок и TTL хранения с мгновенной синхронизацией в SQLite через `afterChange`).

2. **Операционный контур заказов и оплаты — `node:sqlite` (`storage/platform.sqlite`):**
   - Заказы видео и сказок, `Plata by mono` холды/финализация/webhook, OTP + magic links (`/my-orders`), 30-дневное хранение готовых файлов (`storage/`), очистка EXIF-фото, расчёт маржи `ai_cost_json` и обезличенная аналитика остаются в [src/lib/db.ts](file:///g:/WwW/work/gifts-project/src/lib/db.ts) и [src/lib/settings.ts](file:///g:/WwW/work/gifts-project/src/lib/settings.ts).
   - Кастомные страницы админки полностью переписаны на единую дизайн-систему `domainer-platform` / Payload (`@engine/components/admin/ui`: `Card`, `Button`, `Input`, `Select`, `Checkbox`, `BarRow`, `Alert`, `SectionLabel`, `C`) и встроены как Custom Views:
     - `/admin` → [Dashboard](file:///g:/WwW/work/gifts-project/engine/views/Dashboard/index.tsx) (аналитика + [AdminSystemHealthCard.tsx](file:///g:/WwW/work/gifts-project/src/components/admin/AdminSystemHealthCard.tsx) «Состояние интеграций» внизу страницы);
     - `/admin/orders` → [Orders](file:///g:/WwW/work/gifts-project/engine/views/Orders/index.tsx) (инспектор заказов, Resume, Sync Mono, возврат/холд, `+1 AI-правка`);
     - `/admin/tariffs` → [Tariffs](file:///g:/WwW/work/gifts-project/engine/views/Tariffs/index.tsx) (тарифы, видимость, тексты услуг и курсы расчёта маржи ИИ).
   - Однословная навигация в [Nav/index.tsx](file:///g:/WwW/work/gifts-project/engine/components/admin/Nav/index.tsx): `Дашборд`, `Заказы`, `Тарифы`, `Контент → Медиа`, `Система → Пользователи / Настройки` (`Общие`, `ИИ (Контент)`, `ИИ-сказки`, `ElevenLabs`, `Промпты`, `Лимиты`).
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
- **Контент:** `Страницы`, `Шаблоны → Главная страница`, `Статьи`, `Рубрики`, `Авторы`, `Медиа`
- **Система → Пользователи / Настройки:** `Общие`, `Меню шапки`, `Меню футера`, `ИИ (Контент)`, `ИИ-сказки`, `ElevenLabs`, `Промпты`, `Лимиты`, `Курсы и маржа`

### Миграционный сидер (`scripts/seed-stage-b.ts`)
- Идемпотентный скрипт `npm run seed:stage-b` переносит `Services` (с `FAQBlock` в `extraBlocks`), `ServiceVariations`, `Showcases`, нелокализуемые `Reviews`, `HomeTemplate`, `Pages` (`tsiny`, `pro-nas`, `kontakty`, `oferta`, `konfidentsiynist`), `Authors`, `PostCategories`, `Posts`, `HeaderNav`, `FooterNav` и `AiEconomics`.

---

## 3. Оставшаяся часть Этапа В: Токенная система дизайна (`src/styles/tokens.css` + `DESIGN.md`)

**Что осталось от Этапа В:** конструктор страниц (`Pages`, `HomeTemplate`, 22 блока и `RenderBlocks.tsx`) уже реализован; остаётся вынести цвета, типографику, отступы, радиусы и тени фронтенда в единый слой семантических CSS-токенов `src/styles/tokens.css` и выполнить полную переработку визуального дизайна поверх блочной архитектуры по `DESIGN.md`.

---

## 4. Спецификация Этапа Г: Полный отказ от SQLite и переход на единый PostgreSQL 16

**Цель Этапа Г:** убрать вторую базу данных (`node:sqlite`, `storage/gifts.db`), чтобы вся платформа в продакшне работала на **одном экземпляре PostgreSQL 16** (единый бэкап, нормальная конкурентность транзакций под вебхуки `Plata by mono` и отсутствие синхронизации через `app_state`).

### Что переносится в PostgreSQL 16
В SQLite к моменту завершения Этапа Б остаются только 3 технические операционные таблицы (таблица `app_state` становится полностью ненужной, так как лимиты, цены и курсы живут в Payload):
1. `op_orders` (бывшая `orders` — заказы, статусы генерации, `payload_json`/`result_json`/`ai_cost_json` в `jsonb`, инвойсы `Plata by mono`, `access_token`, 30-дневный `expires_at`);
2. `op_email_auth_tokens` (OTP-коды и одноразовые magic-ссылки для `/my-orders`);
3. `op_telegram_tokens` (одноразовые deep-link токены доставки в Telegram).

### Архитектурное решение
- Эти 3 таблицы размещаются в **том же PostgreSQL 16** (`DATABASE_URL`, отдельная схема `app` или префикс `op_`), чтобы не смешиваться с таблицами Payload и не нагружать Payload-хуками частые обновления `progress_percent` во время рендера.
- [src/lib/db.ts](file:///g:/WwW/work/gifts-project/src/lib/db.ts) переводится на асинхронный драйвер `pg` (общий пул `DATABASE_URL`), а чтение лимитов, цен и курсов ИИ в [src/lib/settings.ts](file:///g:/WwW/work/gifts-project/src/lib/settings.ts) переводится напрямую на кэшируемые запросы к Payload Local API (как в `src/lib/cms-ai-config.ts`).
- После миграции и проверки E2E удаляются зависимость от экспериментального `node:sqlite`, `app_state` и `afterChange`-зеркалирование из глобалов/коллекций в SQLite.
- Кастомные экраны `/admin` (`Дашборд`) и `/admin/orders` (`Заказы`) сохраняются без потери функциональности и работают напрямую с таблицами `op_*` в PostgreSQL.
