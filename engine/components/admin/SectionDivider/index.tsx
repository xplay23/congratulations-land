"use client";

import { tAdmin, useAdminLang } from "@engine/lib/admin-i18n";

interface SectionDividerProps {
  label: string;
  description?: string;
  compact?: boolean;
}

export function SectionDivider({
  label,
  description,
  compact,
}: SectionDividerProps) {
  return (
    <div
      className="field-type group-field group-field--top-level"
      style={{
        borderBottom: 0,
        paddingBottom: compact ? 14 : 28,
        marginBottom: 0,
      }}
    >
      <div className="group-field__wrap">
        <div className="group-field__header">
          <header>
            <h3 className="group-field__title">{label}</h3>
            {description && (
              <div className="field-description">{description}</div>
            )}
          </header>
        </div>
      </div>
    </div>
  );
}

export function NullLabel() {
  return null;
}

export function AiTextGenerationDivider() {
  const lang = useAdminLang();
  return (
    <SectionDivider
      label={tAdmin(
        lang,
        "Генерация текста, блога, перевода и SEO",
        "Генерація тексту, блогу, перекладу та SEO"
      )}
      description={tAdmin(
        lang,
        "Провайдер, модель и уровень размышления для контента в админке, перевода RU ↔ UA и чат-помощника.",
        "Провайдер, модель та рівень міркувань для контенту в адмінці, перекладу RU ↔ UA та чат-помічника."
      )}
    />
  );
}

export function AiImageGenerationDivider() {
  const lang = useAdminLang();
  return (
    <SectionDivider
      label={tAdmin(
        lang,
        "Генерация обложек и изображений (Контент)",
        "Генерація обкладинок і зображень (Контент)"
      )}
      description={tAdmin(
        lang,
        "Отдельный провайдер и модель для генерации обложек блога и промо-материалов в админке.",
        "Окремий провайдер і модель для генерації обкладинок блогу та промо-матеріалів в адмінці."
      )}
    />
  );
}

export function StorybookWriterDivider() {
  const lang = useAdminLang();
  return (
    <SectionDivider
      label={tAdmin(
        lang,
        "Текст сказки (Писатель и корректор RU/UA)",
        "Текст казки (Письменник і коректор RU/UA)"
      )}
      description={tAdmin(
        lang,
        "Провайдер, ключ, модель и уровень размышления для шагов story_beats, story_draft, корректуры и AI-правок страниц.",
        "Провайдер, ключ, модель та рівень міркувань для кроків story_beats, story_draft, коректури та AI-правок сторінок."
      )}
    />
  );
}

export function StorybookDirectorDivider() {
  const lang = useAdminLang();
  return (
    <SectionDivider
      label={tAdmin(
        lang,
        "Визуальная режиссура и Vision QA",
        "Візуальна режисура та Vision QA"
      )}
      description={tAdmin(
        lang,
        "Провайдер, ключ и модель для Vision-паспорта фото, режиссуры сцен (story_director) и автоматической QA-проверки иллюстраций.",
        "Провайдер, ключ і модель для Vision-паспорта фото, режисури сцен (story_director) та автоматичної QA-перевірки ілюстрацій."
      )}
    />
  );
}

export function StorybookImagesDivider() {
  const lang = useAdminLang();
  return (
    <SectionDivider
      label={tAdmin(
        lang,
        "Иллюстрации сказок (Якоря и страницы)",
        "Ілюстрації казок (Якорі та сторінки)"
      )}
      description={tAdmin(
        lang,
        "Отдельный провайдер, ключ, модель и качество для генерации портретных якорей, обложки и страниц книги.",
        "Окремий провайдер, ключ, модель і якість для генерації портретних якорів, обкладинки та сторінок книги."
      )}
    />
  );
}

export function ElevenLabsConnectionDivider() {
  const lang = useAdminLang();
  return (
    <SectionDivider
      label={tAdmin(
        lang,
        "Подключение, модель и голос (ElevenLabs TTS)",
        "Підключення, модель і голос (ElevenLabs TTS)"
      )}
      description={tAdmin(
        lang,
        "API-ключ, модель синтеза речи и голос по умолчанию для персонализированных видеопоздравлений.",
        "API-ключ, модель синтезу мовлення та голос за замовчуванням для персоналізованих відеопривітань."
      )}
    />
  );
}

export function ElevenLabsVoiceSettingsDivider() {
  const lang = useAdminLang();
  return (
    <SectionDivider
      label={tAdmin(lang, "Параметры звучания голоса", "Параметри звучання голосу")}
      description={tAdmin(
        lang,
        "Тонкая настройка стабильности и схожести тембра. Двигайте ползунок или введите точное значение от 0 до 1.",
        "Тонке налаштування стабільності та схожості тембру. Рухайте повзунок або введіть точне значення від 0 до 1."
      )}
    />
  );
}

export function AiPersonaDivider() {
  const lang = useAdminLang();
  return (
    <SectionDivider
      label={tAdmin(
        lang,
        "Персона и контекст бренда VideoVitannya",
        "Персона та контекст бренду VideoVitannya"
      )}
      description={tAdmin(
        lang,
        "Базовый тон, стиль и ограничения бренда, передаваемые в промпты как {{aiPersona}} и {{siteDescription}}.",
        "Базовий тон, стиль та обмеження бренду, що передаються у промпти як {{aiPersona}} та {{siteDescription}}."
      )}
    />
  );
}

export function SiteContactsDivider() {
  const lang = useAdminLang();
  return (
    <SectionDivider
      label={tAdmin(lang, "Контакты", "Контакти")}
      description={tAdmin(
        lang,
        "Контактная информация для футера, страницы контактов, писем и Telegram-бота.",
        "Контактна інформація для футера, сторінки контактів, листів та Telegram-бота."
      )}
    />
  );
}

export function SiteFooterDivider() {
  const lang = useAdminLang();
  return (
    <SectionDivider
      label={tAdmin(lang, "Футер и соцсети", "Футер і соцмережі")}
      description={tAdmin(
        lang,
        "Тексты нижней части сайта (визуальный редактор) и произвольный список ссылок на соцсети.",
        "Тексти нижньої частини сайту (візуальний редактор) та довільний список посилань на соцмережі."
      )}
    />
  );
}

export function PlatformLimitsDivider() {
  const lang = useAdminLang();
  return (
    <SectionDivider
      label={tAdmin(
        lang,
        "Лимиты платформы и TTL хранения",
        "Ліміти платформи та TTL зберігання"
      )}
      description={tAdmin(
        lang,
        "Ограничения на генерацию превью, количество ИИ-правок и срок хранения готовых заказов. После сохранения сразу применяются на платформе.",
        "Обмеження на генерацію прев'ю, кількість ШІ-правок та строк зберігання готових замовлень. Після збереження миттєво застосовуються на платформі."
      )}
    />
  );
}

export function PostAiContextDivider() {
  const lang = useAdminLang();
  return (
    <SectionDivider
      label={tAdmin(lang, "Контекст ИИ (опционально)", "Контекст ШІ (опціонально)")}
      description={tAdmin(
        lang,
        "Служебные поля для контекста ИИ при генерации статьи.",
        "Службові поля для контексту ШІ при генерації статті."
      )}
    />
  );
}

export function PostContentDivider() {
  const lang = useAdminLang();
  return <SectionDivider label={tAdmin(lang, "Контент", "Контент")} />;
}

export function PageIdentityDivider() {
  const lang = useAdminLang();
  return (
    <SectionDivider
      label={tAdmin(lang, "Публикация", "Публікація")}
      description={tAdmin(lang, "Заголовок и URL-слаг страницы.", "Заголовок і URL-слаг сторінки.")}
    />
  );
}

function SidebarSectionDivider({
  label,
  description,
  first = false,
}: SectionDividerProps & { first?: boolean }) {
  return (
    <div
      className="field-type group-field"
      style={{
        borderBottom: 0,
        borderTop: first ? 0 : undefined,
        paddingTop: first ? 0 : 40,
        paddingBottom: 30,
        paddingLeft: "var(--sidebar-gutter-h-left, var(--gutter-h))",
        paddingRight: "var(--sidebar-gutter-h-right, var(--gutter-h))",
        marginBottom: 0,
        marginLeft: "calc(var(--sidebar-gutter-h-left, var(--gutter-h)) * -1)",
        marginRight: "calc(var(--sidebar-gutter-h-right, var(--gutter-h)) * -1)",
      }}
    >
      <div className="group-field__wrap">
        <div className="group-field__header">
          <header>
            <h3 className="group-field__title">{label}</h3>
            {description && (
              <div className="field-description">{description}</div>
            )}
          </header>
        </div>
      </div>
    </div>
  );
}

export function PostSidebarStatusDivider() {
  const lang = useAdminLang();
  return (
    <SidebarSectionDivider
      first
      label={tAdmin(lang, "Статус", "Статус")}
      description={tAdmin(
        lang,
        "Публикация и видимость материала на сайте.",
        "Публікація та видимість матеріалу на сайті."
      )}
    />
  );
}

export function PostSidebarVisualIdentityDivider() {
  const lang = useAdminLang();
  return (
    <SidebarSectionDivider
      label={tAdmin(lang, "Обложка", "Обкладинка")}
      description={tAdmin(
        lang,
        "Обложка и изображение материала.",
        "Обкладинка та зображення матеріалу."
      )}
    />
  );
}

export function PostSidebarCategoriesTagsDivider() {
  const lang = useAdminLang();
  return (
    <SidebarSectionDivider
      label={tAdmin(lang, "Рубрики и теги", "Рубрики та теги")}
      description={tAdmin(
        lang,
        "Хаб блога и теги статьи.",
        "Хаб блогу та теги статті."
      )}
    />
  );
}
