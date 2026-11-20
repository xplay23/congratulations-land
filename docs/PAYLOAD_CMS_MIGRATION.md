# Payload CMS 3.84 — Архитектура и дорожная карта (Этапы А, Б, В)

> **Статус на 2026-11-20:** **Этап А выполнен и проверен.** Этапы **Б** и **В** предназначены для реализации в отдельных новых чатах поверх готового фундамента Этапа А (в текущем чате продолжаем только точечные доработки Этапа А).

---

## 1. Общая архитектура (Этап А — Готово)

### Гибридное разделение БД и контуров
Чтобы не смешивать редакционный контент с транзакциями и временным хранением заказов/фотографий, платформа разделена на два контура:

1. **Контур CMS и настроек ИИ — `Payload CMS 3.84.1` + `PostgreSQL 16`:**
   - Контейнер `videovitannya-db` (`postgres:16-alpine`, локальный проброс `127.0.0.1:5556 -> 5432`) в [docker-compose.dev.yml](file:///g:/WwW/work/gifts-project/docker-compose.dev.yml). Под хостинг на Hostinger VPS через Docker Manager используется штатный `DATABASE_URL`.
   - Главный конфиг: [payload.config.ts](file:///g:/WwW/work/gifts-project/payload.config.ts) (`Next.js 16.2.6`, `React 19.2.4`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `@payloadcms/plugin-seo`, `withPayload` в [next.config.ts](file:///g:/WwW/work/gifts-project/next.config.ts)).
   - Коллекции и глобалы:
     - [engine/collections/Users.ts](file:///g:/WwW/work/gifts-project/engine/collections/Users.ts) (`users`, 30-дневная сессия);
     - [engine/collections/Media.ts](file:///g:/WwW/work/gifts-project/engine/collections/Media.ts) (`media`, загрузка в `public/media`);
     - [engine/globals/SiteSettings.ts](file:///g:/WwW/work/gifts-project/engine/globals/SiteSettings.ts) (`site-settings`, локализуемые название, слоган, футер и общие контакты);
     - [engine/globals/AISettings.ts](file:///g:/WwW/work/gifts-project/engine/globals/AISettings.ts) (`ai-settings`, управление моделями/ключами OpenAI и ElevenLabs);
     - [engine/globals/AIPrompts.ts](file:///g:/WwW/work/gifts-project/engine/globals/AIPrompts.ts) (`ai-prompts`, редактируемые шаблоны с `{{переменными}}`).

2. **Операционный контур заказов и оплаты — `node:sqlite` (`storage/platform.sqlite`):**
   - Заказы видео и сказок, `Plata by mono` холды/финализация/webhook, OTP + magic links (`/my-orders`), 30-дневное хранение готовых файлов (`storage/`), очистка EXIF-фото, расчёт маржи `ai_cost_json` и обезличенная аналитика остаются в [src/lib/db.ts](file:///g:/WwW/work/gifts-project/src/lib/db.ts) и [src/lib/settings.ts](file:///g:/WwW/work/gifts-project/src/lib/settings.ts).
   - Существующие кастомные вкладки админки ([AdminAnalyticsTab.tsx](file:///g:/WwW/work/gifts-project/src/components/admin/AdminAnalyticsTab.tsx), [AdminOrdersTab.tsx](file:///g:/WwW/work/gifts-project/src/components/admin/AdminOrdersTab.tsx), [AdminSettingsTab.tsx](file:///g:/WwW/work/gifts-project/src/components/admin/AdminSettingsTab.tsx)) встроены в единую админку Payload `/admin` через [AdminClientWrapper.tsx](file:///g:/WwW/work/gifts-project/engine/views/AdminClientWrapper.tsx) как Custom Views:
     - `/admin` → [Dashboard](file:///g:/WwW/work/gifts-project/engine/views/Dashboard/index.tsx) (аналитика);
     - `/admin/orders` → [Orders](file:///g:/WwW/work/gifts-project/engine/views/Orders/index.tsx) (инспектор заказов);
     - `/admin/tariffs` → [Tariffs](file:///g:/WwW/work/gifts-project/engine/views/Tariffs/index.tsx) (динамические тарифы, лимиты, курсы ИИ).
   - Авторизация в [src/lib/admin-auth.ts](file:///g:/WwW/work/gifts-project/src/lib/admin-auth.ts) принимает активную сессию Payload наравне с существующими методами входа (`ADMIN_PASSWORD` / `ADMIN_EMAILS`).

### Маршрутизация, стили и двунаправленный перевод
- **Route Groups:** витрина и формы заказа изолированы в `src/app/(site)/` (`/` для UA и `/ru/...` для RU), а админка и API Payload — в `src/app/(payload)/`. В [src/lib/locale.ts](file:///g:/WwW/work/gifts-project/src/lib/locale.ts) и [src/middleware.ts](file:///g:/WwW/work/gifts-project/src/middleware.ts) `/media` добавлен в нелокализуемые пути наряду с `/admin`, `/api`, `/assets`, `/samples`.
- **Изоляция стилей админки:** дизайн-система админки взята из `domainer-platform` (`engine/styles/admin-*.css`), а для старых Tailwind-компонентов аналитики/заказов/тарифов подключён [admin-tailwind.css](file:///g:/WwW/work/gifts-project/engine/styles/admin-tailwind.css) (`tailwindcss/theme.css` + `tailwindcss/utilities.css` со `source("../../src/components/admin")` без глобального Preflight, класс `.vv-admin-tw`).
- **Нативная локализация + перевод `RU ↔ UA`:**
  - Локали в Payload: `uk` (`Українська (UA)`, default) и `ru` (`Русский (RU)`), `fallback: true`.
  - Компонент [TranslateLocaleButton](file:///g:/WwW/work/gifts-project/engine/components/admin/TranslateLocaleButton/index.tsx) + эндпоинт [src/app/api/ai/translate/route.ts](file:///g:/WwW/work/gifts-project/src/app/api/ai/translate/route.ts) работают **в обе стороны (`🇷🇺 → 🇺🇦` и `🇺🇦 → 🇷🇺`)** из любой вкладки локали (удобно, когда контент пишется на русском и переводится на украинский). Поддерживается преобразование `Lexical JSON <-> HTML` через [htmlToLexical.ts](file:///g:/WwW/work/gifts-project/engine/components/admin/PostAiButtons/htmlToLexical.ts).

### Runtime-конфиг AI и ElevenLabs + Python-воркер
- Резолвер [src/lib/cms-ai-config.ts](file:///g:/WwW/work/gifts-project/src/lib/cms-ai-config.ts) (`getCmsAiConfig()`, кэш 30 с + мгновенная инвалидация через `afterChange`-хуки `ai-settings` и `ai-prompts`) объединяет настройки из PostgreSQL с fallback на `.env.local`.
- Все генераторы переведены на `getCmsOpenAIRuntime()` / `getCmsAiConfig()`:
  - [src/lib/openai-client.ts](file:///g:/WwW/work/gifts-project/src/lib/openai-client.ts);
  - [src/lib/storybook/vision.ts](file:///g:/WwW/work/gifts-project/src/lib/storybook/vision.ts) (`storybookDirectorModel`);
  - [src/lib/storybook/writer.ts](file:///g:/WwW/work/gifts-project/src/lib/storybook/writer.ts) (`storybookWriterModel`, `storybookDirectorModel`, `style-*`, `storybook-*-system` с жёсткой защитой JSON-структуры в коде);
  - [src/lib/storybook/illustrator.ts](file:///g:/WwW/work/gifts-project/src/lib/storybook/illustrator.ts) (`storybookImageModel`, `storybookImageQuality`, `storybookDirectorModel`, `storybookVisionQaEnabled`, `storybook-vision-qa`);
  - [src/app/api/assistant/route.ts](file:///g:/WwW/work/gifts-project/src/app/api/assistant/route.ts) (`assistant-system`);
  - [src/lib/video/pipeline.ts](file:///g:/WwW/work/gifts-project/src/lib/video/pipeline.ts) — **принципиально важное архитектурное решение:** Python-скрипт [video-pipeline/scripts/assemble_pilot.py](file:///g:/WwW/work/gifts-project/video-pipeline/scripts/assemble_pilot.py) остаётся чистым локальным FFmpeg/Pillow-воркером без доступа к БД и ключам. Вся логика ElevenLabs (`elevenLabsApiKey`, `elevenLabsModelId`, `elevenLabsVoiceId`, `elevenLabsStability`, `elevenLabsSimilarityBoost` и шаблоны реплик `video-line-*`) читается из БД на стороне Next.js, реплики синтезируются в `.mp3` и передаются в Python через `--custom-audio`.
- Начальный сидер: [scripts/seed-stage-a.ts](file:///g:/WwW/work/gifts-project/scripts/seed-stage-a.ts) идемпотентно создаёт первого администратора, заполняет `site-settings` (`uk`/`ru`), переносит ключи и модели из `.env.local` в `ai-settings` и добавляет 26 шаблонов промптов в `ai-prompts`.

### Базовые команды Этапа А
- `npm run db` — запуск `postgres:16-alpine` в Docker (`npm run db:stop` — остановка);
- `npm run generate:importmap` — перегенерация `src/app/(payload)/admin/importMap.js` после изменения полей/компонентов админки;
- `npm run seed:stage-a` — первичная инициализация/досид глобалов и пользователя;
- `npm run typecheck` — проверка TypeScript без конфликта с работающим `next dev`.

---

## 2. Спецификация Этапа Б (для нового чата): Коллекции услуг, вариаций, демо, отзывов и блога

**Цель Этапа Б:** перенести жёстко зашитый контент из `src/lib/site-content.ts` и `src/lib/pricing-defaults.ts` в локализованные (`uk` / `ru`) коллекции и глобалы Payload CMS с редактированием через админку, ИИ-генерацией текстов/SEO и двунаправленным переводом `RU ↔ UA`.

### Новые коллекции (`engine/collections/`)
1. **`Services` (`slug: "services"`):**
   - Единый каталог всех услуг платформы: `svyatyj-mykolaj`, `kazka`, `ozhyvyty-foto`, `pisnya-na-zamovlennya`, `den-narodzhennya`, `novyj-rik`, `multfilm-pro-dytynu`.
   - Общие поля: `slug`, `serviceType` (`video` | `storybook` | `photo_animation` | `song` | `other`), `status` (`active` | `coming_soon` | `hidden`), `sortOrder` (для сохранения «Відео від Святого Миколая» на 1-м месте), `ctaOrderUrl` (например `/create/video` или `/create/storybook`), базовые цены/тарифные привязки, обложка/иконка.
   - Локализованные поля (`uk` / `ru`): название, бейдж, краткое описание карточки, расширенный список преимуществ, заголовок/подзаголовок посадочной страницы услуги, текст кнопки заказа, SEO-поля (`@payloadcms/plugin-seo`), кнопка `TranslateLocaleButton` + `PageSeoButton`.
2. **`ServiceVariations` (`slug: "service-variations"`):**
   - Вариации внутри одной услуги с единой ценой и общей механикой заказа (например: Святой Николай в сказочной комнате, в зимнем лесу, в мастерской, или сезонный Дед Мороз).
   - Поля: связь `service` (relationship → `services`), `variationSlug`, `enabled`, `isDefault`, `sortOrder`, локализованные `title`, `shortBadge`, `description`, демо-ролик (`demoVideoPath` / `media`), превью-кадр.
   - Технические параметры пайплайна (нелокализуемые): `pipelineTemplateId` (папка/набор клипов для Python-сборщика), опциональный `elevenLabsVoiceIdOverride`, опциональные шаблоны реплик (`line03Uk`, `line03Ru`, `line04bUk`, `line04bRu`, `line07Uk`, `line07Ru`).
   - Интеграция с конструктором `/create/video` и `VideoOrderPayload` (`variationSlug`), а также блоком выбора вариаций на странице услуги.
3. **`Showcases` (`slug: "showcases"`):**
   - Живые демонстрации для `#live-demos` (видео-плеер `<VideoShowcasePlayer />` и интерактивный PDF-просмотрщик `<StorybookShowcaseReader />`).
   - Поля: связь с `service` и опционально `serviceVariation`, тип (`video` | `storybook_pdf` | `before_after`), локализованные заголовок/подпись/возраст/сюжет, медиа/ссылки на `mp4`/`pdf`, флаг `featuredOnHome`, `sortOrder`.
4. **`Reviews` (`slug: "reviews"`):**
   - Отзывы родителей: локализованные текст и автор/город, оценка, связь с `service`, флаг `featuredOnHome`, дата/сортировка.
5. **`Faqs` (`slug: "faqs"`):**
   - Часто задаваемые вопросы: локализованные `question` и `answer` (RichText / textarea), привязка к `service` (или общий), флаги `showOnHome`, `showOnPricing`, `sortOrder`.
6. **Блог (`Posts`, `PostCategories`, `Authors`):**
   - Перенос `BLOG_HUBS` и `BLOG_POSTS` из `src/lib/site-content.ts` в полноценный блог с `PostAiButtons` (генерация заголовка, анонса, текста HTML→Lexical, тегов, категоризации и SEO), `SlugField` (транслитерация UA/RU) и `TranslateLocaleButton` (`RU ↔ UA`).
   - Обновление `/blog`, `/blog/[hub]`, `/blog/[hub]/[slug]` и `src/app/sitemap.ts` на чтение из Payload Local API с fallback.

### Новые глобалы навигации (`engine/globals/`)
- **`HeaderNav` (`slug: "header-nav"`)** и **`FooterNav` (`slug: "footer-nav"`)**: локализованные пункты меню, колонки футера и юридические ссылки.

### Миграционный сидер Этапа Б (`scripts/seed-stage-b.ts`)
- Идемпотентный скрипт переноса всех текущих UA/RU-данных из `src/lib/site-content.ts` и синхронизации статусов/цен с `src/lib/pricing-defaults.ts` в Postgres без перезаписи уже отредактированных в админке записей.

---

## 3. Спецификация Этапа В (для нового чата): Конструктор страниц (`Pages`) и токенная система дизайна

**Цель Этапа В:** дать возможность собирать и перестраивать структуру любых посадочных и информационных страниц из блоков прямо в `/admin` и подготовить единую CSS-токенную архитектуру под последующий полный редизайн (`DESIGN.md`).

### Коллекция `Pages` и система блоков (`engine/collections/Pages.ts` + `engine/blocks/`)
1. **`Pages` (`slug: "pages"`):**
   - Страницы: главная (`home`), цены (`tsiny`), о нас (`pro-nas`), контакты (`kontakty`), оферта (`oferta`), конфиденциальность (`konfidentsiynist`), а также произвольные промо-лендинги.
   - Поля: `slug`, локализованный `title`, `layout` (массив Payload-блоков с выбором, добавлением, перетаскиванием и скрытием секций), SEO-вкладка + кнопка `TranslateLocaleButton` (`RU ↔ UA`).
2. **Адаптация структурных блоков из `domainer-platform` (только layout/сетка без тёмных стилей исходного проекта):**
   - `HeroBlock`, `FeaturesGridBlock`, `StepsHowItWorksBlock`, `FaqBlock` (подтягивает записи из `faqs`), `ReviewsBlock` (из `reviews`), `CtaBannerBlock`, `RichContentBlock`, `ContactsBlock`, `BlogPreviewBlock` (последние статьи из `posts`).
3. **Специализированные блоки VideoVitannya:**
   - `LiveDemosShowcaseBlock` — блок живых демо видео и PDF-сказок (сохраняет приоритетную позицию перед каталогом услуг);
   - `ServicesCatalogBlock` — витрина услуг с фильтрацией по статусу и двумя кнопками (*«Детальніше»* / *«Замовити»*);
   - `ServiceVariationsPickerBlock` — выбор вариации внутри услуги (под разные сюжеты/локации одного формата);
   - `StorybookStylesShowcaseBlock` — витрина 6 художественных стилей и 2 режимов вёрстки;
   - `PricingTableBlock` — таблица тарифов (берёт актуальные цены из настроек и описания из `Services`);
   - `PrivacyTrustStripBlock` — полоса гарантий приватности (удаление EXIF и фото, 30-дневное хранение, Plata by mono).

### Токенная система и ревалидация (`src/styles/tokens.css` + `RenderBlocks.tsx`)
- Вынести цвета, типографику, отступы, радиусы и тени фронтенда в единый слой семантических CSS-токенов `src/styles/tokens.css` по образцу организации токенов в `domainer-platform`, но со значениями палитры VideoVitannya (чтобы после утверждения `DESIGN.md` поменять визуал всего сайта через один файл и компоненты блоков).
- Реализовать `RenderBlocks.tsx` (SSR через Payload Local API с `locale: "uk" | "ru"` и безопасным fallback, плюс `afterChange`-хуки с `revalidatePath` для `/` и `/ru/...`).
