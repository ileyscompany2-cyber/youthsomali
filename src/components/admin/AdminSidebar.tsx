"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  BookOpen,
  FolderKanban,
  CalendarDays,
  ImageIcon,
  Upload,
  Users,
  Handshake,
  FileText,
  MessageSquare,
  Bell,
  ShieldCheck,
  KeyRound,
  Settings,
  ScrollText,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Leaf,
} from "lucide-react";

/* ─── Nav Tree ───────────────────────────────────────────────── */
type NavItem =
  | { kind: "link"; label: string; href: string; icon: React.ReactNode }
  | {
      kind: "group";
      label: string;
      icon: React.ReactNode;
      children: { label: string; href: string }[];
    };

const NAV: NavItem[] = [
  {
    kind: "link",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    kind: "group",
    label: "Content Management",
    icon: <Newspaper className="w-5 h-5" />,
    children: [
      { label: "News & Articles", href: "/admin/news" },
      { label: "Programs",        href: "/admin/programs" },
      { label: "Projects",        href: "/admin/projects" },
      { label: "Events",          href: "/admin/events" },
    ],
  },
  {
    kind: "group",
    label: "Media Management",
    icon: <ImageIcon className="w-5 h-5" />,
    children: [
      { label: "Photo Gallery",  href: "/admin/gallery" },
      { label: "Image Uploads",  href: "/admin/media" },
    ],
  },
  {
    kind: "group",
    label: "Organization",
    icon: <Users className="w-5 h-5" />,
    children: [
      { label: "Team Members",        href: "/admin/team" },
      { label: "Partners",            href: "/admin/partners" },
      { label: "Reports & Publications", href: "/admin/publications" },
    ],
  },
  {
    kind: "group",
    label: "Communications",
    icon: <MessageSquare className="w-5 h-5" />,
    children: [
      { label: "Contact Messages", href: "/admin/messages" },
    ],
  },
  {
    kind: "group",
    label: "Administration",
    icon: <ShieldCheck className="w-5 h-5" />,
    children: [
      { label: "Admin Users",       href: "/admin/users" },
      { label: "Website Settings",  href: "/admin/settings" },
      { label: "Audit Logs",        href: "/admin/audit" },
    ],
  },
];

/* ─── Sidebar Item ───────────────────────────────────────────── */
function SidebarLink({
  href,
  icon,
  label,
  collapsed,
  onClick,
}: {
  href: string;
  icon?: React.ReactNode;
  label: string;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={isActive ? "page" : undefined}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-150 group relative
        ${isActive
          ? "bg-white/15 text-white shadow-sidebar-item"
          : "text-white/70 hover:bg-white/10 hover:text-white"
        }
        ${collapsed ? "justify-center px-2.5" : ""}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {!collapsed && <span className="truncate">{label}</span>}
      {isActive && !collapsed && (
        <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-gold" />
      )}
    </Link>
  );
}

/* ─── Sidebar Group ──────────────────────────────────────────── */
function SidebarGroup({
  item,
  collapsed,
  onLinkClick,
}: {
  item: Extract<NavItem, { kind: "group" }>;
  collapsed: boolean;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const isAnyChildActive = item.children.some((c) => pathname.startsWith(c.href));
  const [open, setOpen] = useState(isAnyChildActive);

  if (collapsed) {
    return (
      <div className="relative group/tooltip">
        <button
          className="w-full flex items-center justify-center px-2.5 py-2.5 rounded-xl
                     text-white/70 hover:bg-white/10 hover:text-white transition-all"
          aria-label={item.label}
        >
          {item.icon}
        </button>
        {/* Tooltip submenu */}
        <div className="absolute left-full top-0 ml-2 bg-forest border border-white/10
                        rounded-xl shadow-modal z-50 min-w-[180px] hidden group-hover/tooltip:block">
          <p className="px-4 py-2 text-xs font-semibold text-gold uppercase tracking-widest border-b border-white/10">
            {item.label}
          </p>
          {item.children.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              onClick={onLinkClick}
              className="block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10
                         transition-colors rounded-lg mx-1 my-0.5"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
          transition-all duration-150
          ${isAnyChildActive ? "text-white" : "text-white/70 hover:text-white hover:bg-white/10"}
        `}
        aria-expanded={open}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        <span className="flex-1 text-left truncate">{item.label}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0 transition-transform" />
        )}
      </button>

      {open && (
        <div className="ml-9 mt-0.5 flex flex-col gap-0.5">
          {item.children.map((c) => {
            const isActive = pathname === c.href || pathname.startsWith(c.href + "/");
            return (
              <Link
                key={c.href}
                href={c.href}
                onClick={onLinkClick}
                aria-current={isActive ? "page" : undefined}
                className={`
                  block px-3 py-2 rounded-lg text-sm transition-all duration-150
                  ${isActive
                    ? "bg-white/15 text-white font-medium"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                  }
                `}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────── */
export interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  adminName: string;
  adminRole: string;
}

export default function AdminSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  adminName,
  adminRole,
}: SidebarProps) {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-5 py-5 border-b border-white/10 shrink-0 ${
          collapsed ? "justify-center px-2" : ""
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-gold flex items-center justify-center shrink-0">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">YPP</p>
            <p className="text-[10px] text-white/50 leading-tight truncate">Youth for Peace</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-0.5"
        aria-label="Admin navigation"
      >
        {NAV.map((item, i) =>
          item.kind === "link" ? (
            <SidebarLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
              onClick={onCloseMobile}
            />
          ) : (
            <SidebarGroup
              key={item.label}
              item={item}
              collapsed={collapsed}
              onLinkClick={onCloseMobile}
            />
          )
        )}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/10 p-3 space-y-1 shrink-0`}>
        {!collapsed && (
          <div className="px-4 py-2 mb-1">
            <p className="text-sm font-medium text-white truncate">{adminName}</p>
            <p className="text-xs text-white/50 truncate">{adminRole}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
            text-white/70 hover:text-white hover:bg-white/10 transition-all
            ${collapsed ? "justify-center px-2.5" : ""}
          `}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col bg-forest text-white fixed left-0 top-0 h-screen z-30
          transition-all duration-300
          ${collapsed ? "w-[72px]" : "w-[260px]"}
        `}
        aria-label="Main sidebar"
      >
        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-forest border-2 border-white/20
                     flex items-center justify-center text-white/70 hover:text-white transition-colors z-40"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
          lg:hidden fixed left-0 top-0 h-screen w-[260px] bg-forest text-white z-50
          transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Mobile navigation"
      >
        <button
          onClick={onCloseMobile}
          className="absolute right-3 top-3 p-2 rounded-lg text-white/70 hover:text-white
                     hover:bg-white/10 transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
