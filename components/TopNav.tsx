"use client";

import { Search, Bell, Menu, Check, X, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useAppContext, formatFriendlyDate } from "@/components/AppProvider";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

type TopNavProps = {
  onMenuClick: () => void;
  sidebarCollapsed?: boolean;
};

// Map path segments to human-readable labels
const PATH_LABELS: Record<string, string> = {
  dashboard:   "Dashboard",
  projects:    "Projects",
  todos:       "Todos",
  calendar:    "Calendar",
  discussions: "Discussions",
  settings:    "Settings",
  archive:     "Archive",
  invites:     "Invite",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    // UUID-like segment → show "Detail"
    const label = PATH_LABELS[seg] ?? (seg.length > 20 ? "Detail" : seg);
    const isLast = idx === segments.length - 1;
    return { href, label, isLast };
  });
}

export function TopNav({ onMenuClick, sidebarCollapsed }: TopNavProps) {
  const { currentUser, notifications, markNotificationRead, clearNotifications } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const breadcrumbs = useBreadcrumbs();

  const userNotifications = useMemo(
    () => notifications.filter(n => n.userId === currentUser?.id),
    [notifications, currentUser?.id],
  );
  const unreadCount = useMemo(
    () => userNotifications.filter(n => !n.read).length,
    [userNotifications],
  );

  const toggleNotifications = useCallback(() => {
    setShowNotifications(p => !p);
    setShowSearch(false);
  }, []);

  const openSearch = useCallback(() => {
    setShowSearch(true);
    setShowNotifications(false);
  }, []);

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery("");
  }, []);

  // Close notifications panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus search inputs when opened
  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  // Global keyboard shortcut ⌘K / Ctrl+K to open search
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        desktopSearchRef.current?.focus();
        openSearch();
      }
      if (e.key === "Escape") {
        closeSearch();
        setShowNotifications(false);
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [openSearch, closeSearch]);

  return (
    <>
      <header className="text-on-surface flex items-center w-full h-full">

        {/* ── Mobile: hamburger + brand ────────────────────────────────────── */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="p-2 -ml-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer active:scale-95"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <div className="w-2.5 h-2.5 bg-primary rotate-45 rounded-[2px]" />
            </div>
            <span className="text-body-lg font-semibold text-on-surface tracking-tight">
              Trust &amp; Peace
            </span>
          </div>
        </div>

        {/* ── Desktop: breadcrumb ──────────────────────────────────────────── */}
        <nav className="hidden lg:flex items-center gap-1 text-label-sm">
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {idx > 0 && <ChevronRight size={13} className="text-outline-variant" />}
              {crumb.isLast ? (
                <span className="font-semibold text-on-surface">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* ── Desktop search ───────────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-1 justify-center px-6 max-w-xl mx-auto">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            <input
              ref={desktopSearchRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks, projects…"
              className="w-full pl-9 pr-16 py-2 bg-surface-container-low border border-transparent rounded-full text-body-md text-on-surface focus:border-outline-variant/60 focus:bg-surface focus:outline-none transition-all placeholder:text-outline"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] text-outline-variant font-mono border border-outline-variant/40 rounded px-1.5 py-0.5 pointer-events-none">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* ── Right actions ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-0.5 ml-auto">

          {/* Mobile search icon */}
          <button
            onClick={openSearch}
            className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotifications}
              aria-label="Notifications"
              className={`p-2 rounded-lg transition-colors cursor-pointer relative ${showNotifications ? "bg-surface-container text-on-surface" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-surface border border-outline-variant/30 rounded-2xl shadow-xl overflow-hidden flex flex-col z-50">
                <div className="px-4 py-3 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-body-md text-on-surface">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {userNotifications.length > 0 && (
                    <button
                      onClick={() => { clearNotifications(); }}
                      className="text-[11px] text-outline hover:text-on-surface transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto no-scrollbar divide-y divide-outline-variant/10">
                  {userNotifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <Bell size={28} className="text-outline-variant mx-auto mb-2 opacity-30" />
                      <p className="text-label-sm text-outline-variant">You're all caught up</p>
                    </div>
                  ) : (
                    userNotifications.map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 flex gap-3 items-start transition-colors ${!n.read ? "bg-primary/5" : "hover:bg-surface-container-low"}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-body-md leading-snug mb-0.5 ${!n.read ? "text-on-surface font-medium" : "text-on-surface-variant"}`}>
                            {n.message}
                          </p>
                          <p className="text-[10px] text-outline-variant">{formatFriendlyDate(n.timestamp)}</p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => markNotificationRead(n.id)}
                            title="Mark as read"
                            className="p-1 text-primary hover:bg-primary/10 rounded transition-colors cursor-pointer shrink-0"
                          >
                            <Check size={13} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-outline-variant/30 mx-1.5" />

          {/* User avatar chip */}
          <div className="flex items-center gap-2 pl-1 cursor-default select-none">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-label-sm font-medium text-on-surface">
                {currentUser?.name?.split(" ")[0]}
              </span>
              <span className="text-[10px] text-outline-variant capitalize">
                {currentUser?.orgRole ?? currentUser?.role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/40 shrink-0">
              <Image
                src={currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.email ?? "user"}`}
                alt={currentUser?.name ?? "User"}
                width={32} height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile search dropdown ───────────────────────────────────────── */}
      {showSearch && (
        <div className="lg:hidden fixed top-14 left-0 right-0 bg-surface border-b border-outline-variant/30 px-4 py-3 z-50 shadow-md">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks, projects…"
                className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-full text-body-md text-on-surface focus:border-primary/50 focus:bg-surface focus:outline-none transition-all placeholder:text-outline"
              />
            </div>
            <button
              onClick={closeSearch}
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
