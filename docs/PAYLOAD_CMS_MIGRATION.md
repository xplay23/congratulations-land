# Payload CMS 3.84 — Архитектура и дорожная карта (Этапы А, Б, В)

> **Статус на 2026-11-20:** **Этап А полностью завершён и отполирован.** Интерфейс админки русифицирован по умолчанию с переключателем `RU | UA`, все кастомные страницы переведены на единую дизайн-систему `domainer-platform` / Payload, настройки разделены на отдельные страницы (`Общие`, `ИИ (Контент)`, `ИИ-сказки`, `ElevenLabs`, `Промпты`, `Лимиты`). **Этапы Б и В** готовы к реализации в новых чатах поверх фундамента Этапа А.

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
