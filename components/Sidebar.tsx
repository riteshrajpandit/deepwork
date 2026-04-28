"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "./AppProvider";
import {
  LayoutDashboard,
  FolderOpen,
  ListTodo,
  Calendar,
  Settings,
  Archive,
  Plus,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/projects",    label: "Projects",    icon: FolderOpen },
  { href: "/todos",       label: "Todos",       icon: ListTodo },
  { href: "/calendar",    label: "Calendar",    icon: Calendar },
  { href: "/discussions", label: "Discussions", icon: MessageSquare },
];

const BOTTOM_LINKS = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/archive",  label: "Archive",  icon: Archive },
];

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
};

function NavItem({
  href, label, icon: Icon, onClick, collapsed,
}: {
  href: string; label: string; icon: React.ElementType;
  onClick?: () => void; collapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-xl transition-all duration-150 select-none
        ${collapsed ? "px-2.5 py-2.5 justify-center" : "px-3 py-2.5"}
        ${isActive
          ? "bg-primary/10 text-primary"
          : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
        }`}
    >
      <Icon
        size={19}
        strokeWidth={isActive ? 2.5 : 1.8}
        className={`shrink-0 ${isActive ? "text-primary" : ""}`}
      />

      {!collapsed && (
        <span className="text-body-md font-medium truncate flex-1">{label}</span>
      )}

      {!collapsed && isActive && (
        <ChevronRight size={13} className="ml-auto text-primary opacity-60 shrink-0" />
      )}

      {/* Tooltip when collapsed */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-on-surface text-surface text-label-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
          {label}
        </span>
      )}
    </Link>
  );
}

function SidebarContent({
  onLinkClick, collapsed, onCollapsedChange,
}: {
  onLinkClick?: () => void;
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
}) {
  const { setProjectModalOpen, currentUser, logout } = useAppContext();
  const router = useRouter();

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    router.push("/login");
  };

  return (
    <div className="flex flex-col h-full relative">

      {/* Brand header */}
      <div className={`flex items-center gap-3 px-3 pt-5 pb-4 shrink-0 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <div className="w-3.5 h-3.5 bg-primary rotate-45 rounded-sm" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="text-on-surface font-bold text-body-lg tracking-tight leading-tight truncate">
              Trust &amp; Peace
            </h1>
            <p className="text-on-surface-variant text-[11px] leading-tight opacity-70">
              Deep Work Workspace
            </p>
          </div>
        )}
      </div>

      {/* New project button */}
      {!collapsed ? (
        <button
          onClick={() => { setProjectModalOpen(true); onLinkClick?.(); }}
          className="mx-3 mb-4 bg-primary text-on-primary hover:opacity-90 active:scale-[0.98] transition-all rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 text-label-sm font-label-sm shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={16} />
          New Project
        </button>
      ) : (
        <button
          onClick={() => { setProjectModalOpen(true); onLinkClick?.(); }}
          title="New Project"
          className="mx-2 mb-4 bg-primary text-on-primary hover:opacity-90 active:scale-[0.98] transition-all rounded-xl p-2.5 flex items-center justify-center cursor-pointer shrink-0 group relative"
        >
          <Plus size={17} />
          <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-on-surface text-surface text-label-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
            New Project
          </span>
        </button>
      )}

      {/* Main nav */}
      <nav className={`flex-1 flex flex-col gap-0.5 overflow-y-auto no-scrollbar ${collapsed ? "px-1.5" : "px-2"}`}>
        {NAV_LINKS.map(link => (
          <NavItem key={link.href} {...link} onClick={onLinkClick} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className={`shrink-0 pt-3 pb-2 border-t border-outline-variant/30 mt-2 flex flex-col gap-0.5 ${collapsed ? "px-1.5" : "px-2"}`}>
        {BOTTOM_LINKS.map(link => (
          <NavItem key={link.href} {...link} onClick={onLinkClick} collapsed={collapsed} />
        ))}
      </div>

      {/* User strip */}
      {currentUser && (
        <div className={`shrink-0 mx-2 mb-3 mt-1 flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container border border-outline-variant/30 shrink-0">
            <Image
              src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.email ?? "user"}`}
              alt={currentUser.name}
              width={32} height={32}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-body-md font-medium text-on-surface truncate leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-outline-variant capitalize leading-tight truncate">{currentUser.orgRole ?? currentUser.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ mobileOpen, onClose, collapsed, onCollapsedChange }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — collapsible, with edge-mounted toggle tab */}
      <aside
        className={`hidden lg:flex flex-col bg-surface border-r border-outline-variant/30 h-screen sticky top-0 shrink-0 z-50 transition-[width] duration-300 ease-in-out overflow-visible relative
          ${collapsed ? "w-[68px]" : "w-64"}`}
      >
        <SidebarContent collapsed={collapsed} onCollapsedChange={onCollapsedChange} />

        {/* Edge-mounted collapse toggle — sits on the right border, vertically centered */}
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-1/2 -translate-y-1/2 -right-3 z-50
            w-6 h-6 rounded-full bg-surface border border-outline-variant/40
            flex items-center justify-center
            text-on-surface-variant hover:text-primary hover:border-primary/50
            hover:bg-surface-container-low
            transition-all duration-150 cursor-pointer shadow-sm"
        >
          {collapsed
            ? <ChevronRight size={12} strokeWidth={2.5} />
            : <ChevronLeft size={12} strokeWidth={2.5} />
          }
        </button>
      </aside>

      {/* Mobile: backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-on-background/30 backdrop-blur-sm z-[60] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer — always expanded, slides in from left */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-surface border-r border-outline-variant/30 z-[70] lg:hidden flex flex-col
          transition-transform duration-300 ease-in-out shadow-2xl
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer z-10"
        >
          <X size={18} />
        </button>
        <SidebarContent collapsed={false} onCollapsedChange={() => {}} onLinkClick={onClose} />
      </aside>
    </>
  );
}
