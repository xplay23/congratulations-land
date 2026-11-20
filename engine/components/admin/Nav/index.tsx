"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@payloadcms/ui";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCode2,
  Globe2,
  Image as ImageIcon,
  LayoutDashboard,
  Settings,
  Sliders,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./nav.css";

type NavMode = "main" | "settings";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const MAIN_MENU: Array<NavItem | NavGroup> = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders & Support", href: "/admin/orders", icon: ClipboardList },
  { label: "Tariffs & Limits", href: "/admin/tariffs", icon: Sliders },
  {
    label: "Content",
    items: [
      { label: "Media", href: "/admin/collections/media", icon: ImageIcon },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Users", href: "/admin/collections/users", icon: Users },
      { label: "Settings", href: "__settings__", icon: Settings },
    ],
  },
];

const SETTINGS_MENU: NavItem[] = [
  { label: "General", href: "/admin/globals/site-settings", icon: Globe2 },
  {
    label: "AI & ElevenLabs",
    href: "/admin/globals/ai-settings",
    icon: Sparkles,
  },
  { label: "AI Prompts", href: "/admin/globals/ai-prompts", icon: FileCode2 },
];

const SETTINGS_PATHS = SETTINGS_MENU.map((i) => i.href);

function getModeFromPathname(pathname: string): NavMode {
  if (SETTINGS_PATHS.some((p) => pathname.startsWith(p))) return "settings";
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

function MainPanel({ onSettings }: { onSettings: () => void }) {
  const pathname = usePathname();
  const settingsActive = SETTINGS_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      {MAIN_MENU.map((item) => {
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
                    label="Settings"
                    icon={Settings}
                    isActive={settingsActive}
                    onClick={onSettings}
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
          <MainPanel onSettings={() => setMode("settings")} />
        )}
        {mode === "settings" && (
          <SubPanel
            title="Settings"
            items={SETTINGS_MENU}
            onBack={() => setMode("main")}
          />
        )}
      </div>
      <div className="admin-nav__footer">VideoVitannya CMS</div>
    </nav>
  );
}

export default AdminNav;
