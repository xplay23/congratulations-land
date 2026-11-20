"use client";

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
  return (
    <SectionDivider
      label="Генерация текста, блога, перевода и SEO"
      description="Провайдер и модель для генерации контента в админке, двунаправленного перевода RU↔UA и чат-помощника."
    />
  );
}

export function AiImageGenerationDivider() {
  return (
    <SectionDivider
      label="Генерация обложек и изображений в админке"
      description="Отдельный провайдер и модель для генерации обложек блога и промо-материалов в админке."
    />
  );
}

export function AiStorybookPipelineDivider() {
  return (
    <SectionDivider
      label="Пайплайн ИИ-сказок PDF (Writer / Director / Vision / Иллюстрации)"
      description="Настройки моделей OpenAI и Vision QA для клиентского генератора персонализированных книг."
    />
  );
}

export function AiElevenLabsPipelineDivider() {
  return (
    <SectionDivider
      label="Пайплайн озвучки видео (ElevenLabs TTS)"
      description="API-ключ, модель синтеза, голос по умолчанию и параметры звучания для видеопоздравлений."
    />
  );
}

export function AiPersonaDivider() {
  return (
    <SectionDivider
      label="Персона и контекст бренда VideoVitannya"
      description="Базовый тон, стиль и ограничения бренда, передаваемые в промпты как {{aiPersona}} и {{siteDescription}}."
    />
  );
}

export function SiteContactsDivider() {
  return (
    <SectionDivider
      label="Контакты и соцсети"
      description="Контактная информация для футера, страницы контактов, писем и Telegram-бота."
    />
  );
}

export function SiteFooterDivider() {
  return (
    <SectionDivider
      label="Футер и брендинг"
      description="Тексты нижней части сайта и дополнительные ссылки."
    />
  );
}

export function PostAiContextDivider() {
  return (
    <SectionDivider
      label="AI Writing Context (optional)"
      description="Служебные поля для контекста ИИ при генерации статьи."
    />
  );
}

export function PostContentDivider() {
  return <SectionDivider label="Content" />;
}

export function PageIdentityDivider() {
  return (
    <SectionDivider
      label="Publication"
      description="Заголовок и URL-слаг страницы."
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
  return (
    <SidebarSectionDivider
      first
      label="Status"
      description="Публикация и видимость материала на сайте."
    />
  );
}

export function PostSidebarVisualIdentityDivider() {
  return (
    <SidebarSectionDivider
      label="Visual Identity"
      description="Обложка и изображение материала."
    />
  );
}

export function PostSidebarCategoriesTagsDivider() {
  return (
    <SidebarSectionDivider
      label="Categories & Tags"
      description="Хаб блога и теги статьи."
    />
  );
}
