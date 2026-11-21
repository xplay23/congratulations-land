"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@payloadcms/ui";
import {
  AudioLines,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Coins,
  FileCode2,
  FileText,
  Film,
  FolderOpen,
  FolderTree,
  Gauge,
  Gift,
  Globe2,
  Home,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  MessageSquareQuote,
  Navigation,
  PanelBottom,
  PlaySquare,
  Settings,
  Sparkles,
  UserPen,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { tAdmin, useAdminLang, type AdminLang } from "@engine/lib/admin-i18n";
import "./nav.css";

type NavMode = "main" | "settings" | "templates";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const SETTINGS_PATHS = [
  "/admin/globals/site-settings",
  "/admin/globals/header-nav",
  "/admin/globals/footer-nav",
  "/admin/globals/ai-settings",
  "/admin/globals/storybook-ai-settings",
  "/admin/globals/elevenlabs-settings",
  "/admin/globals/ai-prompts",
  "/admin/globals/platform-limits",
  "/admin/globals/ai-economics",
];

const TEMPLATES_PATHS = ["/admin/globals/home-template"];

function getMainMenu(lang: AdminLang): Array<NavItem | NavGroup> {
  return [
    {
      label: tAdmin(lang, "Дашборд", "Дашборд"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: tAdmin(lang, "Заказы", "Замовлення"),
      href: "/admin/orders",
      icon: ClipboardList,
    },
    {
      label: tAdmin(lang, "Каталог", "Каталог"),
      items: [
        {
          label: tAdmin(lang, "Услуги", "Послуги"),
          href: "/admin/collections/services",
          icon: Gift,
        },
        {
          label: tAdmin(lang, "Вариации", "Варіації"),
          href: "/admin/collections/service-variations",
          icon: Layers,
        },
        {
          label: tAdmin(lang, "Примеры", "Приклади"),
          href: "/admin/collections/showcases",
          icon: PlaySquare,
        },
        {
          label: tAdmin(lang, "Отзывы", "Відгуки"),
          href: "/admin/collections/reviews",
          icon: MessageSquareQuote,
        },
      ],
    },
    {
      label: tAdmin(lang, "Производство", "Виробництво"),
      items: [
        {
          label: tAdmin(lang, "Видео-шаблоны", "Відео-шаблони"),
          href: "/admin/collections/video-templates",
          icon: Film,
        },
        {
          label: tAdmin(lang, "Ассеты пайплайна", "Асети пайплайну"),
          href: "/admin/collections/pipeline-assets",
          icon: FolderOpen,
        },
      ],
    },
    {
      label: tAdmin(lang, "Контент", "Контент"),
      items: [
        {
          label: tAdmin(lang, "Страницы", "Сторінки"),
          href: "/admin/collections/pages",
          icon: FileText,
        },
        {
          label: tAdmin(lang, "Шаблоны", "Шаблони"),
          href: "__templates__",
          icon: LayoutTemplate,
        },
        {
          label: tAdmin(lang, "Статьи", "Статті"),
          href: "/admin/collections/posts",
          icon: BookOpen,
        },
        {
          label: tAdmin(lang, "Рубрики", "Рубрики"),
          href: "/admin/collections/post-categories",
          icon: FolderTree,
        },
        {
          label: tAdmin(lang, "Авторы", "Автори"),
          href: "/admin/collections/authors",
          icon: UserPen,
        },
        {
          label: tAdmin(lang, "Медиа", "Медіа"),
          href: "/admin/collections/media",
          icon: ImageIcon,
        },
      ],
    },
    {
      label: tAdmin(lang, "Система", "Система"),
      items: [
        {
          label: tAdmin(lang, "Пользователи", "Користувачі"),
          href: "/admin/collections/users",
          icon: Users,
        },
        {
          label: tAdmin(lang, "Настройки", "Налаштування"),
          href: "__settings__",
          icon: Settings,
        },
      ],
    },
  ];
}

function getTemplatesMenu(lang: AdminLang): NavItem[] {
  return [
    {
      label: tAdmin(lang, "Главная страница", "Головна сторінка"),
      href: "/admin/globals/home-template",
      icon: Home,
    },
  ];
}

function getSettingsMenu(lang: AdminLang): NavItem[] {
  return [
    {
      label: tAdmin(lang, "Общие", "Загальні"),
      href: "/admin/globals/site-settings",
      icon: Globe2,
    },
    {
      label: tAdmin(lang, "Меню шапки", "Меню шапки"),
      href: "/admin/globals/header-nav",
      icon: Navigation,
    },
    {
      label: tAdmin(lang, "Меню футера", "Меню футера"),
      href: "/admin/globals/footer-nav",
      icon: PanelBottom,
    },
    {
      label: tAdmin(lang, "ИИ (Контент)", "ШІ (Контент)"),
      href: "/admin/globals/ai-settings",
      icon: Sparkles,
    },
    {
      label: tAdmin(lang, "ИИ-сказки", "ШІ-казки"),
      href: "/admin/globals/storybook-ai-settings",
      icon: BookOpen,
    },
    {
      label: "ElevenLabs",
      href: "/admin/globals/elevenlabs-settings",
      icon: AudioLines,
    },
    {
      label: tAdmin(lang, "Промпты", "Промпти"),
      href: "/admin/globals/ai-prompts",
      icon: FileCode2,
    },
    {
      label: tAdmin(lang, "Лимиты", "Ліміти"),
      href: "/admin/globals/platform-limits",
      icon: Gauge,
    },
    {
      label: tAdmin(lang, "Курсы и маржа", "Курси та маржа"),
      href: "/admin/globals/ai-economics",
      icon: Coins,
    },
  ];
}

function getModeFromPathname(pathname: string): NavMode {
  if (SETTINGS_PATHS.some((p) => pathname.startsWith(p))) return "settings";
  if (TEMPLATES_PATHS.some((p) => pathname.startsWith(p))) return "templates";
  return "main";
}

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

function NavLink({ href, label, icon: Icon }: NavItem) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/admin" && pathname.startsWith(href));

  return (
    <a
      href={href}
      className={`admin-nav__link${isActive ? " admin-nav__link--active" : ""}`}
    >
      <Icon size={14} strokeWidth={1.75} className="admin-nav__icon" />
      <span>{label}</span>
    </a>
  );
}

function ExpandableButton({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`admin-nav__link admin-nav__link--expandable${
        isActive ? " admin-nav__link--active" : ""
      }`}
      onClick={onClick}
    >
      <Icon size={14} strokeWidth={1.75} className="admin-nav__icon" />
      <span>{label}</span>
      <span className="admin-nav__chevron-wrap">
        <ChevronRight size={11} strokeWidth={2} />
      </span>
    </button>
  );
}

function MainPanel({
  lang,
  onSettings,
  onTemplates,
}: {
  lang: AdminLang;
  onSettings: () => void;
  onTemplates: () => void;
}) {
  const pathname = usePathname();
  const settingsActive = SETTINGS_PATHS.some((p) => pathname.startsWith(p));
  const templatesActive = TEMPLATES_PATHS.some((p) => pathname.startsWith(p));
  const menu = getMainMenu(lang);

  return (
    <>
      {menu.map((item) => {
        if (!isGroup(item)) {
          return <NavLink key={item.href} {...item} />;
        }
        return (
          <div key={item.label} className="admin-nav__group">
            <div className="admin-nav__group-label">{item.label}</div>
            {item.items.map((child) => {
              if (child.href === "__settings__") {
                return (
                  <ExpandableButton
                    key="settings"
                    label={child.label}
                    icon={Settings}
                    isActive={settingsActive}
                    onClick={onSettings}
                  />
                );
              }
              if (child.href === "__templates__") {
                return (
                  <ExpandableButton
                    key="templates"
                    label={child.label}
                    icon={LayoutTemplate}
                    isActive={templatesActive}
                    onClick={onTemplates}
                  />
                );
              }
              return <NavLink key={child.href} {...child} />;
            })}
          </div>
        );
      })}
    </>
  );
}

function SubPanel({
  title,
  items,
  onBack,
}: {
  title: string;
  items: NavItem[];
  onBack: () => void;
}) {
  return (
    <>
      <button type="button" className="admin-nav__back" onClick={onBack}>
        <ChevronLeft size={14} strokeWidth={1.75} />
        <span>{title}</span>
      </button>
      <div className="admin-nav__sub-divider" />
      {items.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}
    </>
  );
}

export function AdminNav() {
  const { user } = useAuth();
  const lang = useAdminLang();
  const pathname = usePathname();
  const [mode, setMode] = useState<NavMode>(() =>
    getModeFromPathname(pathname)
  );

  useEffect(() => {
    const detected = getModeFromPathname(pathname);
    if (detected !== "main") setMode(detected);
  }, [pathname]);

  if (!user) return null;

  return (
    <nav className="admin-nav">
      <div className={`admin-nav__scroll admin-nav__scroll--${mode}`}>
        {mode === "main" && (
          <MainPanel
            lang={lang}
            onSettings={() => setMode("settings")}
            onTemplates={() => setMode("templates")}
          />
        )}
        {mode === "templates" && (
          <SubPanel
            title={tAdmin(lang, "Шаблоны", "Шаблони")}
            items={getTemplatesMenu(lang)}
            onBack={() => setMode("main")}
          />
        )}
        {mode === "settings" && (
          <SubPanel
            title={tAdmin(lang, "Настройки", "Налаштування")}
            items={getSettingsMenu(lang)}
            onBack={() => setMode("main")}
          />
        )}
      </div>
      <div className="admin-nav__footer">VideoVitannya CMS</div>
    </nav>
  );
}

export default AdminNav;
